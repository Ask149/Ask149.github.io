# Trip photos

Drop photos here for new trips. One folder per trip.

## Folder name

`YYYY-MM-<location-kebab>` — e.g. `2026-12-tokyo`.

The scaffold script creates the folder for you. Don't make folders by hand unless you also add the matching markdown in `src/content/places/`.

## Photo filenames

`NN-words.jpg` where `NN` is `01` through `10`. The first file MUST start with `01-` (cover).

Example folder:

```
2026-12-tokyo/
├── 01-cover.jpg
├── 02-narita-morning.jpg
├── 03-shinjuku-night.jpg
├── 04-tsukiji-breakfast.jpg
├── 05-shrine-rain.jpg
└── captions.yaml   (optional)
```

## Rules

- 5–10 photos per trip. (0 = placeholder, won't fail; 1–4 or 11+ fails the build.)
- Photos >2000px wide are auto-resized on `npm run photos`.
- Allowed: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`.

## Commands

```bash
npm run trip:new -- 2026-12-tokyo "Tokyo" 35.6762 139.6503
npm run photos        # validate + optimize + regenerate manifest
npm run paragraphs    # AI fills narrative copy
npm run build         # ship it
```

Full guide: [`docs/add-trip-guide.md`](../../docs/add-trip-guide.md)
