import type { Env, PublishResult, UploadPayload, UploadPhoto } from "./types";

const encoder = new TextEncoder();

interface GitRef {
  object: { sha: string };
}

interface GitCommit {
  sha: string;
  tree: { sha: string };
}

interface GitBlob {
  sha: string;
}

interface GitTree {
  sha: string;
}

interface PullRequest {
  html_url: string;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const normalized = pem.replace(/\\n/g, "\n");
  const base64 = normalized
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(base64);
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0)).buffer;
}

async function createAppJwt(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = base64Url(encoder.encode(JSON.stringify({
    iat: now - 60,
    exp: now + 9 * 60,
    iss: env.GITHUB_APP_ID,
  })));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(env.GITHUB_APP_PRIVATE_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(`${header}.${payload}`));
  return `${header}.${payload}.${base64Url(new Uint8Array(signature))}`;
}

async function githubJson<T>(url: string, init: RequestInit & { token: string }): Promise<T> {
  const { token, ...rest } = init;
  const resp = await fetch(url, {
    ...rest,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "ask149-trip-upload",
      "X-GitHub-Api-Version": "2022-11-28",
      ...rest.headers,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub ${resp.status}: ${text}`);
  }
  return resp.json<T>();
}

async function githubMaybe(url: string, token: string): Promise<boolean> {
  const resp = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "User-Agent": "ask149-trip-upload",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (resp.status === 404) return false;
  if (!resp.ok) throw new Error(`GitHub ${resp.status}: ${await resp.text()}`);
  return true;
}

async function installationToken(env: Env): Promise<string> {
  const jwt = await createAppJwt(env);
  const resp = await fetch(`https://api.github.com/app/installations/${env.GITHUB_APP_INSTALLATION_ID}/access_tokens`, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${jwt}`,
      "User-Agent": "ask149-trip-upload",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const json = await resp.json<{ token?: string; message?: string }>();
  if (!resp.ok || !json.token) throw new Error(json.message ?? "Could not create GitHub App installation token");
  return json.token;
}

function yamlEscape(value: string): string {
  return JSON.stringify(value);
}

function captionsYaml(photos: UploadPhoto[]): string {
  return photos
    .map((photo) => `${photo.destFile}: ${yamlEscape(photo.caption)}`)
    .join("\n") + "\n";
}

function placeMarkdown(upload: UploadPayload): string {
  const month = new Date(`${upload.visitDate}T00:00:00Z`).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  return `---\n` +
    `title: ${yamlEscape(upload.title)}\n` +
    `country: ${yamlEscape(upload.location.country)}\n` +
    `countryCode: ${yamlEscape(upload.location.countryCode)}\n` +
    (upload.location.airportCode ? `airportCode: ${yamlEscape(upload.location.airportCode)}\n` : "") +
    `yearMonth: ${yamlEscape(upload.yearMonth)}\n` +
    `visitDate: ${yamlEscape(upload.visitDate)}\n` +
    `locationId: ${yamlEscape(upload.location.id)}\n` +
    `uploadedAt: ${yamlEscape(upload.uploadedAt)}\n` +
    `reason: ${yamlEscape(upload.reason)}\n` +
    `coverAlt: ${yamlEscape(`${upload.title} in ${upload.location.label}`)}\n` +
    `geo:\n` +
    `  - ${upload.location.geo[0]}\n` +
    `  - ${upload.location.geo[1]}\n` +
    `mapCoords:\n` +
    `  leftPct: ${upload.location.mapCoords.leftPct}\n` +
    `  topPct: ${upload.location.mapCoords.topPct}\n` +
    `timelineLabel: ${yamlEscape(`${month} · ${upload.location.city}`)}\n` +
    `photoFolder: ${yamlEscape(upload.slug)}\n` +
    `---\n` +
    `${upload.title}.\n`;
}

async function uniqueSlug(api: string, token: string, branch: string, slug: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const encodedPath = encodeURIComponent(`src/content/places/${candidate}.md`);
    const exists = await githubMaybe(`${api}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`, token);
    if (!exists) return candidate;
  }
  throw new Error("Could not find a free slug after 20 attempts");
}

export async function publishUpload(env: Env, upload: UploadPayload): Promise<PublishResult> {
  const token = await installationToken(env);
  const api = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}`;
  const baseRef = await githubJson<GitRef>(`${api}/git/ref/heads/${env.GITHUB_BRANCH}`, { token });
  const baseCommit = await githubJson<GitCommit>(`${api}/git/commits/${baseRef.object.sha}`, { token });
  const slug = await uniqueSlug(api, token, env.GITHUB_BRANCH, upload.slug);
  const branch = env.PUBLISH_MODE === "direct_master"
    ? env.GITHUB_BRANCH
    : `trip-upload/${slug}-${Date.now()}`;

  if (env.PUBLISH_MODE !== "direct_master") {
    await githubJson(`${api}/git/refs`, {
      token,
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseRef.object.sha }),
    });
  }

  const placePath = `src/content/places/${slug}.md`;
  const photoPrefix = `public/photos/${slug}`;
  const blobs: Array<{ path: string; sha: string }> = [];
  for (const photo of upload.photos) {
    const blob = await githubJson<GitBlob>(`${api}/git/blobs`, {
      token,
      method: "POST",
      body: JSON.stringify({ content: bytesToBase64(photo.bytes), encoding: "base64" }),
    });
    blobs.push({ path: `${photoPrefix}/${photo.destFile}`, sha: blob.sha });
  }

  const tree = await githubJson<GitTree>(`${api}/git/trees`, {
    token,
    method: "POST",
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree: [
        { path: placePath, mode: "100644", type: "blob", content: placeMarkdown({ ...upload, slug }) },
        { path: `${photoPrefix}/captions.yaml`, mode: "100644", type: "blob", content: captionsYaml(upload.photos) },
        ...blobs.map((blob) => ({ path: blob.path, mode: "100644", type: "blob", sha: blob.sha })),
      ],
    }),
  });

  const commit = await githubJson<GitCommit>(`${api}/git/commits`, {
    token,
    method: "POST",
    body: JSON.stringify({
      message: `content(travel): add ${upload.title}\n\nUploaded via trip upload form.`,
      tree: tree.sha,
      parents: [baseRef.object.sha],
    }),
  });

  await githubJson(`${api}/git/refs/heads/${branch}`, {
    token,
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  let prUrl: string | undefined;
  if (env.PUBLISH_MODE !== "direct_master") {
    const pr = await githubJson<PullRequest>(`${api}/pulls`, {
      token,
      method: "POST",
      body: JSON.stringify({
        title: `Add trip: ${upload.title}`,
        head: branch,
        base: env.GITHUB_BRANCH,
        body: [
          "Uploaded through the private trip upload form.",
          "",
          `- Location: ${upload.location.label}`,
          `- Date: ${upload.visitDate}`,
          `- Photos: ${upload.photos.length}`,
        ].join("\n"),
      }),
    });
    prUrl = pr.html_url;
  }

  return {
    mode: env.PUBLISH_MODE,
    slug,
    branch,
    commitUrl: `https://github.com/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/commit/${commit.sha}`,
    prUrl,
    liveUrl: env.PUBLIC_SITE_URL,
  };
}

// ---------------------------------------------------------------------------
// Manage / delete
// ---------------------------------------------------------------------------

const IMG_RE = /\.(jpe?g|png|webp|avif)$/i;

interface ContentEntry {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir" | "symlink" | "submodule";
}

interface TreeEntry {
  path: string;
  mode: "100644";
  type: "blob";
  sha?: string | null;
  content?: string;
}

export interface TripPhoto {
  name: string;
  sha: string;
  thumbUrl: string;
}

export interface TripSummary {
  slug: string;
  title: string;
  photos: TripPhoto[];
}

export interface DeleteResult {
  kind: "trip" | "photos";
  slug: string;
  removed: number;
  remaining: number;
  commitUrl: string;
  liveUrl: string;
}

function ghHeaders(token: string, accept = "application/vnd.github+json"): HeadersInit {
  return {
    "Accept": accept,
    "Authorization": `Bearer ${token}`,
    "User-Agent": "ask149-trip-upload",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function listDir(api: string, token: string, path: string, ref: string): Promise<ContentEntry[] | null> {
  const resp = await fetch(`${api}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`, {
    headers: ghHeaders(token),
  });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`GitHub ${resp.status}: ${await resp.text()}`);
  const json = await resp.json<ContentEntry[] | ContentEntry>();
  return Array.isArray(json) ? json : [json];
}

async function fetchText(api: string, token: string, path: string, ref: string): Promise<string | null> {
  const resp = await fetch(`${api}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`, {
    headers: ghHeaders(token, "application/vnd.github.raw"),
  });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`GitHub ${resp.status}: ${await resp.text()}`);
  return resp.text();
}

function parseTitle(md: string, fallback: string): string {
  const match = md.match(/^title:\s*(.+)$/m);
  if (!match) return fallback;
  const raw = match[1].trim();
  try {
    return JSON.parse(raw);
  } catch {
    return raw.replace(/^["']|["']$/g, "");
  }
}

function deriveCaption(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/^\d+[-_]?/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

function renumber(filename: string, index: number): string {
  const n = String(index + 1).padStart(2, "0");
  const stem = filename.replace(/^\d+[-_]?/, "");
  return `${n}-${stem}`;
}

function parseCaptions(text: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!text) return out;
  for (const line of text.split("\n")) {
    const match = line.match(/^([^:#]+):\s*(.+)$/);
    if (!match) continue;
    const key = match[1].trim();
    const rawValue = match[2].trim();
    let value: string;
    try {
      value = JSON.parse(rawValue);
    } catch {
      value = rawValue.replace(/^["']|["']$/g, "");
    }
    out[key] = value;
  }
  return out;
}

async function repoContext(env: Env) {
  const token = await installationToken(env);
  const api = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}`;
  const baseRef = await githubJson<GitRef>(`${api}/git/ref/heads/${env.GITHUB_BRANCH}`, { token });
  const baseCommit = await githubJson<GitCommit>(`${api}/git/commits/${baseRef.object.sha}`, { token });
  return { token, api, baseSha: baseRef.object.sha, baseTreeSha: baseCommit.tree.sha };
}

async function commitTree(
  env: Env,
  ctx: { token: string; api: string; baseSha: string; baseTreeSha: string },
  treeEntries: TreeEntry[],
  message: string,
): Promise<string> {
  const tree = await githubJson<GitTree>(`${ctx.api}/git/trees`, {
    token: ctx.token,
    method: "POST",
    body: JSON.stringify({ base_tree: ctx.baseTreeSha, tree: treeEntries }),
  });
  const commit = await githubJson<GitCommit>(`${ctx.api}/git/commits`, {
    token: ctx.token,
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [ctx.baseSha] }),
  });
  await githubJson(`${ctx.api}/git/refs/heads/${env.GITHUB_BRANCH}`, {
    token: ctx.token,
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  return commit.sha;
}

function rawThumb(env: Env, slug: string, name: string): string {
  return `https://raw.githubusercontent.com/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/${env.GITHUB_BRANCH}/public/photos/${slug}/${name}`;
}

export async function listTrips(env: Env): Promise<TripSummary[]> {
  const { token, api, baseSha } = await repoContext(env);
  const placeEntries = (await listDir(api, token, "src/content/places", baseSha)) ?? [];
  const trips: TripSummary[] = [];
  for (const entry of placeEntries) {
    if (entry.type !== "file" || !entry.name.endsWith(".md")) continue;
    const slug = entry.name.replace(/\.md$/, "");
    const md = (await fetchText(api, token, entry.path, baseSha)) ?? "";
    const title = parseTitle(md, slug);
    const folder = await listDir(api, token, `public/photos/${slug}`, baseSha);
    const photos = (folder ?? [])
      .filter((f) => f.type === "file" && IMG_RE.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f) => ({ name: f.name, sha: f.sha, thumbUrl: rawThumb(env, slug, f.name) }));
    trips.push({ slug, title, photos });
  }
  trips.sort((a, b) => b.slug.localeCompare(a.slug));
  return trips;
}

export async function deleteTrip(env: Env, slug: string): Promise<DeleteResult> {
  const ctx = await repoContext(env);
  const { token, api, baseSha } = ctx;

  const placeEntries = (await listDir(api, token, "src/content/places", baseSha)) ?? [];
  const mdFiles = placeEntries.filter((e) => e.type === "file" && e.name.endsWith(".md"));
  const placeFile = mdFiles.find((e) => e.name === `${slug}.md`);
  if (!placeFile) throw new Error(`Trip "${slug}" not found.`);
  if (mdFiles.length <= 1) {
    throw new Error("Can't delete the last remaining trip — the Traveler page needs at least one entry.");
  }

  const folder = await listDir(api, token, `public/photos/${slug}`, baseSha);
  if (folder?.some((f) => f.type === "dir")) {
    throw new Error(`Photo folder for "${slug}" has nested subfolders — delete those manually first.`);
  }

  const tree: TreeEntry[] = [{ path: placeFile.path, mode: "100644", type: "blob", sha: null }];
  for (const f of folder ?? []) {
    if (f.type === "file") tree.push({ path: f.path, mode: "100644", type: "blob", sha: null });
  }

  const commitSha = await commitTree(env, ctx, tree, `content(travel): remove ${slug}\n\nDeleted via trip manage form.`);
  return {
    kind: "trip",
    slug,
    removed: 1,
    remaining: 0,
    commitUrl: `https://github.com/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/commit/${commitSha}`,
    liveUrl: env.PUBLIC_SITE_URL,
  };
}

export async function deletePhotos(env: Env, slug: string, filenames: string[]): Promise<DeleteResult> {
  const ctx = await repoContext(env);
  const { token, api, baseSha } = ctx;
  const folderPath = `public/photos/${slug}`;

  const folder = await listDir(api, token, folderPath, baseSha);
  if (!folder) throw new Error(`No photo folder found for "${slug}".`);
  if (folder.some((f) => f.type === "dir")) {
    throw new Error(`Photo folder for "${slug}" has nested subfolders — delete those manually first.`);
  }

  const images = folder
    .filter((f) => f.type === "file" && IMG_RE.test(f.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  const captionsEntry = folder.find((f) => f.type === "file" && f.name === "captions.yaml");

  const toDelete = new Set(filenames);
  for (const name of toDelete) {
    if (!images.some((img) => img.name === name)) {
      throw new Error(`Photo "${name}" is no longer in ${slug} (the page may be stale — refresh and retry).`);
    }
  }

  const remaining = images.filter((img) => !toDelete.has(img.name));
  const currentImages = new Map(images.map((img) => [img.name, img.sha] as const));

  const tree: TreeEntry[] = [];

  if (remaining.length === 0) {
    // Revert to a 0-photo placeholder: drop every image + captions.yaml. The place .md stays.
    for (const img of images) tree.push({ path: `${folderPath}/${img.name}`, mode: "100644", type: "blob", sha: null });
    if (captionsEntry) tree.push({ path: captionsEntry.path, mode: "100644", type: "blob", sha: null });
  } else {
    // Renumber survivors to 01..NN (stem preserved) so the cover invariant always holds.
    const oldCaptions = parseCaptions(await fetchText(api, token, `${folderPath}/captions.yaml`, baseSha));
    const renames = remaining.map((img, i) => ({
      oldName: img.name,
      newName: renumber(img.name, i),
      sha: img.sha,
    }));
    const desired = new Map(renames.map((r) => [r.newName, r.sha] as const));

    // Delete any current image whose name is not reused as a final name.
    for (const [name] of currentImages) {
      if (!desired.has(name)) tree.push({ path: `${folderPath}/${name}`, mode: "100644", type: "blob", sha: null });
    }
    // Add/replace any final name whose content differs from what's already there.
    for (const [newName, sha] of desired) {
      if (currentImages.get(newName) !== sha) {
        tree.push({ path: `${folderPath}/${newName}`, mode: "100644", type: "blob", sha });
      }
    }
    // Rebuild captions.yaml keyed by the final filenames.
    const captionsBody = renames
      .map((r) => `${r.newName}: ${JSON.stringify(oldCaptions[r.oldName] ?? deriveCaption(r.oldName))}`)
      .join("\n") + "\n";
    tree.push({ path: `${folderPath}/captions.yaml`, mode: "100644", type: "blob", content: captionsBody });
  }

  const commitSha = await commitTree(
    env,
    ctx,
    tree,
    `content(travel): delete ${filenames.length} photo${filenames.length === 1 ? "" : "s"} from ${slug}\n\nDeleted via trip manage form.`,
  );
  return {
    kind: "photos",
    slug,
    removed: filenames.length,
    remaining: remaining.length,
    commitUrl: `https://github.com/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/commit/${commitSha}`,
    liveUrl: env.PUBLIC_SITE_URL,
  };
}
