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
  for (const byte of bytes) binary += String.fromCharCode(byte);
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
