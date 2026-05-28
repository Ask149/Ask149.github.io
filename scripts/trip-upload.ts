// scripts/trip-upload.ts
// Local-only trip/photo uploader for the static GitHub Pages site.
//
// This intentionally does not expose a public /admin upload route or browser token.
// It writes the same files the site already trusts:
//   - src/content/places/<slug>.md
//   - public/photos/<slug>/NN-caption.ext
//   - public/photos/<slug>/captions.yaml
//
// Run via:
//   npm run trip:upload -- --slug 2026-12-tokyo --title "Tokyo" \
//     --country Japan --country-code JP --lat 35.6762 --lon 139.6503 \
//     --photos ~/Pictures/tokyo

import { access, copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { extname, join, parse, resolve } from "node:path";
import { homedir } from "node:os";
import matter from "gray-matter";
import yaml from "js-yaml";

const SLUG_RE = /^(\d{4})-(0[1-9]|1[0-2])-[a-z0-9][a-z0-9-]*$/;
const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)$/i;
const PLACES_DIR = "src/content/places";
const PHOTOS_DIR = "public/photos";
const REASONS = new Set(["leisure", "work", "transit", "family", "wedding"]);

interface Options {
  slug: string;
  title: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  photosDir: string;
  reason: string;
  durationDays?: number;
  airportCode?: string;
  favorite: boolean;
  draft: boolean;
  cover?: string;
  coverAlt?: string;
  timelineLabel?: string;
  mapLeft?: number;
  mapTop?: number;
  paragraph?: string;
  paragraphAuthor?: string;
  body?: string;
  skipPhotos: boolean;
  dryRun: boolean;
}

interface SourcePhoto {
  file: string;
  path: string;
  ext: string;
}

interface PlannedPhoto {
  source: SourcePhoto;
  destFile: string;
  caption: string;
}

function die(message: string): never {
  console.error(`x ${message}`);
  process.exit(1);
}

function usage(): string {
  return [
    "Usage:",
    "  npm run trip:upload -- --slug <YYYY-MM-place> --title <title> --country <country> --country-code <CC> --lat <lat> --lon <lon> --photos <folder>",
    "",
    "Example:",
    "  npm run trip:upload -- --slug 2026-12-tokyo --title \"Tokyo\" --country Japan --country-code JP --lat 35.6762 --lon 139.6503 --photos ~/Pictures/tokyo",
    "",
    "Optional:",
    "  --reason leisure|work|transit|family|wedding   default: leisure",
    "  --duration 7",
    "  --airport-code HND",
    "  --cover 3                                  1-based index in sorted photo list",
    "  --cover IMG_1234.jpg                       exact source filename",
    "  --cover-alt \"Tokyo street at dusk\"",
    "  --timeline-label \"Tokyo 2026\"",
    "  --map-left 72 --map-top 41",
    "  --paragraph \"Hand-written paragraph\"      stamps paragraphAuthor: ak",
    "  --body \"Short body line\"",
    "  --favorite",
    "  --draft",
    "  --dry-run",
    "  --skip-photos                              do not run npm run photos",
  ].join("\n");
}

function expandHome(path: string): string {
  if (path === "~") return homedir();
  if (path.startsWith("~/")) return join(homedir(), path.slice(2));
  return path;
}

function parseNumber(raw: string | undefined, label: string): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) die(`${label} must be a number`);
  return n;
}

function parsePositiveInt(raw: string | undefined, label: string): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) die(`${label} must be a positive integer`);
  return n;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    process.exit(0);
  }

  const values = new Map<string, string>();
  const booleans = new Set<string>();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("--")) {
      die(`unexpected positional argument "${arg}"\n\n${usage()}`);
    }
    const key = arg.slice(2);
    const next = args[i + 1];
    if (next === undefined || next.startsWith("--")) {
      booleans.add(key);
      continue;
    }
    values.set(key, next);
    i++;
  }

  const get = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const value = values.get(key);
      if (value !== undefined) return value;
    }
    return undefined;
  };

  const slug = get("slug")?.trim();
  const title = get("title")?.trim();
  const country = get("country")?.trim();
  const countryCode = get("country-code", "countryCode")?.trim().toUpperCase();
  const photosRaw = get("photos", "photos-dir", "photosDir");
  const lat = parseNumber(get("lat"), "lat");
  const lon = parseNumber(get("lon", "lng"), "lon");
  const reason = get("reason")?.trim() ?? "leisure";

  if (!slug) die(`--slug is required\n\n${usage()}`);
  if (!SLUG_RE.test(slug)) die(`slug "${slug}" must match YYYY-MM-<kebab>`);
  if (!title) die("--title is required");
  if (!country) die("--country is required");
  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) die("--country-code must be a 2-letter ISO code");
  if (lat === undefined || lat < -90 || lat > 90) die("--lat must be a number in [-90, 90]");
  if (lon === undefined || lon < -180 || lon > 180) die("--lon must be a number in [-180, 180]");
  if (!photosRaw) die("--photos is required");
  if (!REASONS.has(reason)) die(`--reason must be one of: ${Array.from(REASONS).join(", ")}`);

  const airportCode = get("airport-code", "airportCode")?.trim().toUpperCase();
  if (airportCode && !/^[A-Z]{3}$/.test(airportCode)) die("--airport-code must be a 3-letter airport code");

  const durationDays = parsePositiveInt(get("duration", "duration-days", "durationDays"), "duration");
  const mapLeft = parseNumber(get("map-left", "mapLeft"), "map-left");
  const mapTop = parseNumber(get("map-top", "mapTop"), "map-top");
  if (mapLeft !== undefined && (mapLeft < 0 || mapLeft > 100)) die("--map-left must be in [0, 100]");
  if (mapTop !== undefined && (mapTop < 0 || mapTop > 100)) die("--map-top must be in [0, 100]");

  return {
    slug,
    title,
    country,
    countryCode,
    lat,
    lon,
    photosDir: resolve(expandHome(photosRaw)),
    reason,
    durationDays,
    airportCode,
    favorite: booleans.has("favorite"),
    draft: booleans.has("draft"),
    cover: get("cover"),
    coverAlt: get("cover-alt", "coverAlt"),
    timelineLabel: get("timeline-label", "timelineLabel"),
    mapLeft,
    mapTop,
    paragraph: get("paragraph"),
    paragraphAuthor: get("paragraph-author", "paragraphAuthor"),
    body: get("body"),
    skipPhotos: booleans.has("skip-photos") || booleans.has("skipPhotos"),
    dryRun: booleans.has("dry-run") || booleans.has("dryRun"),
  };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function safeCaptionSlug(file: string): string {
  const base = parse(file).name
    .replace(/^\d+[-_]?/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return base || "photo";
}

function captionFromFile(file: string): string {
  return parse(file).name
    .replace(/^\d+[-_]?/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

async function listPhotos(dir: string): Promise<SourcePhoto[]> {
  let s;
  try {
    s = await stat(dir);
  } catch {
    die(`photo folder does not exist: ${dir}`);
  }
  if (!s.isDirectory()) die(`--photos must point to a folder: ${dir}`);

  const files = (await readdir(dir))
    .filter((f) => !f.startsWith("."))
    .filter((f) => IMG_EXT_RE.test(f))
    .sort((a, b) => a.localeCompare(b));

  if (files.length < 1 || files.length > 10) {
    die(`photo folder must contain 1-10 images; found ${files.length}`);
  }

  return files.map((file) => ({
    file,
    path: join(dir, file),
    ext: extname(file).toLowerCase(),
  }));
}

function orderPhotos(photos: SourcePhoto[], cover?: string): SourcePhoto[] {
  if (!cover) return photos;

  const coverIndex = Number(cover);
  let selectedIndex = -1;
  if (Number.isInteger(coverIndex) && coverIndex >= 1 && coverIndex <= photos.length) {
    selectedIndex = coverIndex - 1;
  } else {
    selectedIndex = photos.findIndex((p) => p.file === cover);
  }

  if (selectedIndex < 0) {
    die(`--cover must be a 1-based index or exact filename from the source folder`);
  }

  const selected = photos[selectedIndex];
  return [selected, ...photos.filter((_, i) => i !== selectedIndex)];
}

async function loadSourceCaptions(dir: string): Promise<Record<string, string>> {
  const path = join(dir, "captions.yaml");
  if (!(await exists(path))) return {};

  const raw = await readFile(path, "utf8");
  const parsed = yaml.load(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    die(`${path} must be a YAML object: filename -> caption`);
  }
  return parsed as Record<string, string>;
}

function planPhotos(ordered: SourcePhoto[], captions: Record<string, string>): PlannedPhoto[] {
  const used = new Set<string>();
  return ordered.map((source, index) => {
    const n = String(index + 1).padStart(2, "0");
    const stem = index === 0 ? safeCaptionSlug(source.file) || "cover" : safeCaptionSlug(source.file);
    let destFile = `${n}-${stem}${source.ext}`;
    let suffix = 2;
    while (used.has(destFile)) {
      destFile = `${n}-${stem}-${suffix}${source.ext}`;
      suffix++;
    }
    used.add(destFile);
    return {
      source,
      destFile,
      caption: captions[source.file] ?? captionFromFile(source.file),
    };
  });
}

function buildPlaceMarkdown(options: Options): string {
  const yearMonth = options.slug.slice(0, 7);
  const year = options.slug.slice(0, 4);
  const frontmatter: Record<string, unknown> = {
    title: options.title,
    country: options.country,
    countryCode: options.countryCode,
    yearMonth,
    reason: options.reason,
    coverAlt: options.coverAlt ?? `${options.title} cover image`,
    geo: [options.lat, options.lon],
    mapCoords: {
      leftPct: options.mapLeft ?? 0,
      topPct: options.mapTop ?? 0,
    },
    timelineLabel: options.timelineLabel ?? `${options.title} ${year}`,
    photoFolder: options.slug,
  };

  if (options.airportCode) frontmatter.airportCode = options.airportCode;
  if (options.durationDays) frontmatter.durationDays = options.durationDays;
  if (options.favorite) frontmatter.favorite = true;
  if (options.draft) frontmatter.draft = true;
  if (options.paragraph) {
    frontmatter.paragraph = options.paragraph;
    frontmatter.paragraphAuthor = options.paragraphAuthor ?? "ak";
  }

  return matter.stringify(`${options.body ?? `${options.title}.`}\n`, frontmatter);
}

async function runPhotosPipeline(): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn("npm", ["run", "photos"], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`npm run photos exited with code ${code}`));
    });
  });
}

async function main(): Promise<void> {
  const options = parseArgs();
  const photos = await listPhotos(options.photosDir);
  const ordered = orderPhotos(photos, options.cover);
  const captions = await loadSourceCaptions(options.photosDir);
  const planned = planPhotos(ordered, captions);

  const mdPath = join(PLACES_DIR, `${options.slug}.md`);
  const destPhotoDir = join(PHOTOS_DIR, options.slug);
  const captionsPath = join(destPhotoDir, "captions.yaml");

  if (await exists(mdPath)) die(`${mdPath} already exists -- refusing to clobber`);
  if (await exists(destPhotoDir)) die(`${destPhotoDir} already exists -- refusing to clobber`);

  console.log(`Trip: ${options.title} (${options.slug})`);
  console.log(`Photos: ${planned.length}`);
  console.log("");
  for (const photo of planned) {
    console.log(`  ${photo.source.file} -> ${photo.destFile}`);
  }
  console.log("");

  if (options.dryRun) {
    console.log("Dry run only. No files written.");
    return;
  }

  await mkdir(PLACES_DIR, { recursive: true });
  await mkdir(destPhotoDir, { recursive: true });
  await writeFile(mdPath, buildPlaceMarkdown(options), "utf8");

  for (const photo of planned) {
    await copyFile(photo.source.path, join(destPhotoDir, photo.destFile));
  }

  const captionMap = Object.fromEntries(planned.map((photo) => [photo.destFile, photo.caption]));
  await writeFile(captionsPath, yaml.dump(captionMap, { lineWidth: 100 }), "utf8");

  console.log(`Created ${mdPath}`);
  console.log(`Created ${destPhotoDir}/`);
  console.log(`Created ${captionsPath}`);

  if (!options.skipPhotos) {
    console.log("");
    console.log("Running npm run photos...");
    await runPhotosPipeline();
  }

  console.log("");
  console.log("Next:");
  console.log("  npm run paragraphs   # optional AI paragraph if you did not pass --paragraph");
  console.log("  npm run check && npm run build");
}

main().catch((error) => {
  console.error("x trip-upload failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
