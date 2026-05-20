// scripts/new-trip.ts
// Run via: npm run trip:new -- <slug> "<title>" <lat> <lon>
// Example:  npm run trip:new -- 2026-12-tokyo "Tokyo" 35.6762 139.6503
//
// Scaffolds a new place entry:
//   - src/content/places/<slug>.md (with frontmatter conforming to content/config.ts schema)
//   - public/photos/<slug>/ (empty folder, ready for photo drops)
//
// The slug encodes the trip's year-month: YYYY-MM-<location-kebab>. yearMonth
// is derived from the slug prefix. country/countryCode default to placeholder
// TODOs that the user fills manually.

import { mkdir, writeFile, readdir, readFile, access } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";

const SLUG_RE = /^(\d{4})-(0[1-9]|1[0-2])-[a-z0-9][a-z0-9-]*$/;
const PLACES_DIR = "src/content/places";
const PHOTOS_DIR = "public/photos";

function die(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function parseArgs(): { slug: string; title: string; lat: number; lon: number } {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    die(
      [
        "Usage: npm run trip:new -- <slug> \"<title>\" <lat> <lon>",
        "Example: npm run trip:new -- 2026-12-tokyo \"Tokyo\" 35.6762 139.6503",
      ].join("\n"),
    );
  }
  const [slug, title, latRaw, lonRaw] = args;
  if (!SLUG_RE.test(slug)) {
    die(`slug "${slug}" must match YYYY-MM-<kebab> (e.g. 2026-12-tokyo)`);
  }
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    die(`lat "${latRaw}" must be a number in [-90, 90]`);
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    die(`lon "${lonRaw}" must be a number in [-180, 180]`);
  }
  if (!title.trim()) die("title must not be empty");
  return { slug, title: title.trim(), lat, lon };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const { slug, title, lat, lon } = parseArgs();
  const yearMonth = slug.slice(0, 7); // YYYY-MM

  const mdPath = join(PLACES_DIR, `${slug}.md`);
  const photoDir = join(PHOTOS_DIR, slug);

  if (await exists(mdPath)) {
    die(`${mdPath} already exists — refusing to clobber`);
  }

  // Compose frontmatter aligned with src/content/config.ts schema.
  // country/countryCode are required by the schema — left as TODOs the user
  // edits before the first build, so a malformed scaffold fails loudly.
  const frontmatter: Record<string, unknown> = {
    title,
    country: "TODO",
    countryCode: "XX",
    yearMonth,
    reason: "leisure",
    coverAlt: `${title} cover image`,
    geo: [lat, lon],
    mapCoords: { leftPct: 0, topPct: 0 }, // TODO: fill from world map SVG
    timelineLabel: `${title} ${yearMonth.slice(0, 4)}`,
    photoFolder: slug,
  };

  const body = `${title}. TODO short body line.\n`;
  const md = matter.stringify(body, frontmatter);

  await mkdir(PLACES_DIR, { recursive: true });
  await writeFile(mdPath, md, "utf8");

  await mkdir(photoDir, { recursive: true });

  // Sanity: ensure folder is empty (we just created it).
  const existingPhotos = await readdir(photoDir);
  if (existingPhotos.length > 0) {
    console.warn(`  ⚠ ${photoDir} already had ${existingPhotos.length} entries — left them alone`);
  }

  console.log(`✓ Created ${mdPath}`);
  console.log(`✓ Created ${photoDir}/`);
  console.log("");
  console.log("Next steps:");
  console.log(`  1. Edit ${mdPath} — fill country / countryCode / reason / mapCoords`);
  console.log(`  2. Drop 5–10 photos into ${photoDir}/`);
  console.log(`     Rename as: 01-cover.jpg, 02-something.jpg, ... up to 10-final.jpg`);
  console.log(`  3. (optional) Add captions.yaml in the same folder (filename → caption text)`);
  console.log(`  4. npm run photos       # validate + optimize + regenerate manifest`);
  console.log(`  5. npm run paragraphs   # AI fills narrative (or write manually + set paragraphAuthor: 'ashish')`);
}

main().catch((e) => {
  console.error("✗ Script failed:", e);
  process.exit(1);
});

// Silences ts unused-import warning when readFile is omitted from a refactor.
void readFile;
