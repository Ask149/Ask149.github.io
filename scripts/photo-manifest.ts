// scripts/photo-manifest.ts
// Run via: npm run photos
// Auto-runs before every `npm run build` via the "prebuild" hook in package.json.
//
// Pipeline (fail-fast on validation):
//   1. Validate slug format (YYYY-MM-<kebab>) — legacy slugs grandfathered
//   2. Validate photo count per folder (0 or 5–10)
//   3. Validate cover photo (first sorted file starts with "01-")
//   4. Optimize images: resize >2000px wide → 2000px wide, strip non-date EXIF (sharp)
//   5. Extract DateTimeOriginal from cover, suggest timelineLabel if missing (exifr)
//   6. Merge captions.yaml (if present) into manifest entries
//   7. Preserve empty manifest placeholders for place entries with no photo folder yet
//   8. Write src/data/photoManifest.json
//
// Idempotent: re-running just overwrites the JSON. Sharp step skips photos
// already within size limits.

import {
  readdirSync,
  statSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
} from "node:fs";
import { join, parse } from "node:path";
import sharp from "sharp";
import exifr from "exifr";
import yaml from "js-yaml";
import matter from "gray-matter";

const ROOT = "public/photos";
const OUT_DIR = "src/data";
const OUT_FILE = join(OUT_DIR, "photoManifest.json");
const PLACES_DIR = "src/content/places";

const IMG_EXT = /\.(jpe?g|png|webp|avif)$/i;
const SLUG_RE = /^\d{4}-(0[1-9]|1[0-2])-[a-z0-9][a-z0-9-]*$/;
const MAX_WIDTH = 2000;

// Legacy slugs predating the YYYY-MM-<kebab> convention. Add NEW slugs only
// via the validated convention — this allowlist is closed.
const LEGACY_SLUGS = new Set<string>([
  "2019-pune-school",
  "2022-tempe-asu",
  "2024-seattle",
  "2026-pune-return",
]);

interface Photo {
  src: string;
  caption: string;
}

interface ManifestEntry extends Photo {}

interface Manifest {
  [slug: string]: ManifestEntry[];
}

function captionFromFilename(file: string): string {
  const base = parse(file).name;
  return base
    .replace(/^\d+[-_]?/, "") // strip leading order prefix like "01-"
    .replace(/[-_]+/g, " ")
    .trim();
}

async function optimizeIfNeeded(path: string): Promise<{ resized: boolean; width: number }> {
  const img = sharp(path, { failOn: "none" });
  const meta = await img.metadata();
  const width = meta.width ?? 0;
  if (width <= MAX_WIDTH) {
    return { resized: false, width };
  }
  // Resize preserving aspect; strip metadata except keep orientation handled implicitly.
  const buf = await sharp(path, { failOn: "none" })
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .toBuffer();
  writeFileSync(path, buf);
  return { resized: true, width: MAX_WIDTH };
}

async function suggestTimelineLabelFromExif(coverPath: string, slug: string): Promise<void> {
  try {
    const md = await exifr.parse(coverPath, { pick: ["DateTimeOriginal"] });
    const dt = md?.DateTimeOriginal as Date | string | undefined;
    if (!dt) return;
    const d = dt instanceof Date ? dt : new Date(dt);
    if (Number.isNaN(d.getTime())) return;

    // Check matching place file for missing timelineLabel.
    const mdPath = join(PLACES_DIR, `${slug}.md`);
    if (!existsSync(mdPath)) return;
    const raw = readFileSync(mdPath, "utf8");
    const parsed = matter(raw);
    const data = parsed.data as { timelineLabel?: string; title?: string };
    if (data.timelineLabel) return;

    const monthShort = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    const suggestion = `${monthShort} ${year}${data.title ? ` — ${data.title}` : ""}`;
    console.log(`  ℹ ${slug}: timelineLabel missing; suggested from EXIF → "${suggestion}"`);
  } catch {
    // EXIF read failure is non-fatal.
  }
}

function loadCaptions(dir: string): Record<string, string> {
  const path = join(dir, "captions.yaml");
  if (!existsSync(path)) return {};
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = yaml.load(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch (e) {
    console.warn(`  ⚠ ${path}: could not parse — ${(e as Error).message}`);
  }
  return {};
}

function loadPlacePhotoFolders(): string[] {
  if (!existsSync(PLACES_DIR)) return [];
  return readdirSync(PLACES_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const raw = readFileSync(join(PLACES_DIR, f), "utf8");
      const parsed = matter(raw);
      const data = parsed.data as { photoFolder?: string };
      return data.photoFolder ?? f.replace(/\.md$/, "");
    });
}

async function main(): Promise<void> {
  const manifest: Manifest = {};
  let hadError = false;

  if (!existsSync(ROOT)) {
    console.warn(`⚠ ${ROOT} does not exist yet — writing empty manifest.`);
  } else {
    const entries = readdirSync(ROOT)
      .filter((name) => !name.startsWith("."))
      .filter((name) => name !== "README.md");

    for (const slug of entries) {
      const dir = join(ROOT, slug);
      let s;
      try {
        s = statSync(dir);
      } catch {
        continue;
      }
      if (!s.isDirectory()) continue;

      // (1) Slug validation
      if (!SLUG_RE.test(slug) && !LEGACY_SLUGS.has(slug)) {
        console.error(
          `✗ ${slug}: folder name must match YYYY-MM-<kebab> (e.g. 2026-12-tokyo). Rename or remove.`,
        );
        hadError = true;
        continue;
      }

      const files = readdirSync(dir).filter((f) => IMG_EXT.test(f)).sort();

      // (2) Count validation
      if (files.length === 0) {
        console.warn(`  ⚠ ${slug}: 0 photos (placeholder slot — drop 5–10 photos to publish)`);
        manifest[slug] = [];
        continue;
      }
      if (files.length < 5 || files.length > 10) {
        console.error(`✗ ${slug}: has ${files.length} photos, expected 0 or 5–10`);
        hadError = true;
        continue;
      }

      // (3) Cover photo validation
      if (!files[0].startsWith("01-")) {
        console.error(
          `✗ ${slug}: cover required — first sorted file must start with "01-" (got "${files[0]}")`,
        );
        hadError = true;
        continue;
      }

      // (4) Image optimization
      let resizedCount = 0;
      for (const f of files) {
        try {
          const r = await optimizeIfNeeded(join(dir, f));
          if (r.resized) resizedCount++;
        } catch (e) {
          console.warn(`  ⚠ ${slug}/${f}: optimize failed — ${(e as Error).message}`);
        }
      }
      if (resizedCount > 0) {
        console.log(`  ↺ ${slug}: resized ${resizedCount} photo${resizedCount === 1 ? "" : "s"} to ${MAX_WIDTH}px wide`);
      }

      // (5) EXIF date suggestion
      await suggestTimelineLabelFromExif(join(dir, files[0]), slug);

      // (6) Captions merge
      const captions = loadCaptions(dir);

      manifest[slug] = files.map((f) => ({
        src: `/photos/${slug}/${f}`,
        caption: captions[f] ?? captionFromFilename(f),
      }));
      console.log(`  ✓ ${slug}: ${files.length} photo${files.length === 1 ? "" : "s"}`);
    }
  }

  if (hadError) {
    console.error("");
    console.error("✗ photo-manifest failed validation. Fix errors above and re-run.");
    process.exit(1);
  }

  // (7) Placeholder guard: refuse to ship scaffold defaults from `npm run trip:new`.
  // `countryCode: "XX"` passes the schema's .length(2) check, and would otherwise
  // silently inflate the unique-country count on traveler.astro. Fail loudly here
  // before any consumer reads the place files.
  if (existsSync(PLACES_DIR)) {
    const placeholderOffenders: { slug: string; country: string; countryCode: string }[] = [];
    const placeFiles = readdirSync(PLACES_DIR).filter((f) => f.endsWith(".md"));
    for (const f of placeFiles) {
      const raw = readFileSync(join(PLACES_DIR, f), "utf8");
      const data = matter(raw).data as { country?: string; countryCode?: string };
      const country = data.country ?? "";
      const countryCode = data.countryCode ?? "";
      if (country === "TODO" || countryCode === "XX") {
        placeholderOffenders.push({ slug: f.replace(/\.md$/, ""), country, countryCode });
      }
    }
    if (placeholderOffenders.length > 0) {
      console.error("");
      for (const o of placeholderOffenders) {
        console.error(`✗ Place "${o.slug}" still has scaffold placeholders:`);
        console.error(`    country: "${o.country}"     (fill with real country name, e.g., "Japan")`);
        console.error(`    countryCode: "${o.countryCode}"   (fill with ISO 3166-1 alpha-2 code, e.g., "JP")`);
        console.error(`  Edit src/content/places/${o.slug}.md before building.`);
      }
      console.error("");
      console.error(`✗ photo-manifest: ${placeholderOffenders.length} place file(s) still contain scaffold placeholders.`);
      process.exit(1);
    }
  }

  for (const folder of loadPlacePhotoFolders()) {
    manifest[folder] ??= [];
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + "\n");
  const totalPhotos = Object.values(manifest).reduce((n, arr) => n + arr.length, 0);
  console.log(
    `✓ wrote ${OUT_FILE} — ${Object.keys(manifest).length} slug${Object.keys(manifest).length === 1 ? "" : "s"}, ${totalPhotos} photo${totalPhotos === 1 ? "" : "s"} total`,
  );
}

main().catch((e) => {
  console.error("✗ photo-manifest failed:", e);
  process.exit(1);
});
