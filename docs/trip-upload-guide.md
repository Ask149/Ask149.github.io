# Local trip photo uploader

Use this when you have a folder of 1-10 photos and want the Traveler page to pick them up without hand-creating every file.

This is intentionally **local-only**. The public GitHub Pages site is static, so a browser-only `/admin` form cannot securely upload photos or commit to the repo without exposing a token.

## Quick path

```sh
npm run trip:upload -- \
  --slug 2026-12-tokyo \
  --title "Tokyo" \
  --country Japan \
  --country-code JP \
  --lat 35.6762 \
  --lon 139.6503 \
  --photos ~/Pictures/tokyo
```

The script creates:

```txt
src/content/places/2026-12-tokyo.md
public/photos/2026-12-tokyo/01-*.jpg
public/photos/2026-12-tokyo/02-*.jpg
public/photos/2026-12-tokyo/captions.yaml
```

It then runs `npm run photos`, which validates and optimizes the images and regenerates `src/data/photoManifest.json`.

## Useful options

```sh
--cover 3                         # make the 3rd sorted source photo the cover
--cover IMG_1234.jpg              # or use an exact source filename
--cover-alt "Tokyo street at dusk"
--reason leisure                  # leisure | work | transit | family | wedding
--duration 7
--airport-code HND
--timeline-label "Tokyo 2026"
--map-left 72 --map-top 41
--paragraph "Hand-written paragraph"
--body "Short body line"
--favorite
--draft
--dry-run
--skip-photos
```

## Captions

If your source photo folder contains a `captions.yaml`, the uploader reuses it.

```yaml
IMG_1234.jpg: "Arriving after rain"
IMG_5678.jpg: "Station light, late evening"
```

Missing captions fall back to filename-derived captions.

## Publish checklist

```sh
npm run paragraphs   # optional, if you did not pass --paragraph
npm run check
npm run build
git status
```

Review the generated place file before committing. In particular, fill `mapCoords` if you did not pass `--map-left` / `--map-top`; otherwise the pin starts at `0, 0`.

## Future web form

The safe remote version is now scaffolded under `worker-trip-upload/`.
See `docs/trip-upload-form.md`.

It is a small authenticated backend, not browser-only JavaScript:

1. Mobile admin form.
2. GitHub OAuth or Cloudflare Access allowlist for Ashish only.
3. Backend validates metadata/photos.
4. Backend opens a PR or commits the same files this script writes.
5. Existing GitHub Actions deploy remains the publishing gate.

Do not put a GitHub token in frontend code, localStorage, or a public static route.
