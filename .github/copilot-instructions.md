# Copilot instructions — ask149.github.io

Personal portfolio site (Astro 4.10 static + React islands) deployed to GitHub Pages.

## Commands

```sh
npm run dev       # http://localhost:4321
npm run check     # astro check — TS + content collection schema validation
npm run build     # static build to dist/ (runs `prebuild` photo-manifest first)
npm run preview   # serve built site
```

Content tooling (run on demand, not in CI):

```sh
npm run photos       # validate/optimize photos under public/photos/<slug>/ and regenerate manifest
npm run paragraphs   # AI-generate place paragraphs via Gemini (needs GOOGLE_API_KEY in .env)
npm run trip:new -- <slug> "<title>" <lat> <lng>   # scaffold a new place + photo folder
npm run build:og     # generate og-default.jpg
```

There is no test suite and no linter beyond `astro check`. Treat `npm run check && npm run build` as the green-bar gate.

The Cloudflare Worker in `worker/` has its own `package.json` and is independently developed (`npx wrangler dev` from inside `worker/`). Don't touch it for site-side changes.

## Deploy

`.github/workflows/deploy.yml` is the active workflow and triggers on push to branch **`master`**. GitHub Pages is configured with `build_type: workflow`, so the artifact uploaded by `actions/deploy-pages@v4` is what serves from `https://ask149.github.io/`. A second workflow `.github/workflows/ci.yml` runs `npm run check && npm run build` on every PR into `master` — that's the green-bar gate before merge. The old Jekyll site is preserved at tag `v1-jekyll-archive`; see README's "Rollback" section for the recipe.

## Architecture — the persona registry is the keystone

The site is four personas, each its own route + visual world but sharing one chrome, one content layer, and one design system. **`src/personas/registry.ts` is the single source of truth** — every layout, nav item, and persona page reads from `PERSONAS`. Adding/removing a persona is a registry edit + the four mechanical follow-ups in the README ("Adding a 5th persona").

Each `PersonaDef` carries: `id`, `route`, `collection` (Astro content collection key or `null`), `tokensHref` (per-persona CSS variables under `public/styles/personas/<id>.css`), `accentHex`, `transitionMode` (`morph` | `fade`), and `heroLoader` (dynamic import of the hero `.astro` component).

`PersonaLayout.astro` wraps every page: sets `data-persona` on `<html>` and `<body>` (CSS tokens key off this attribute), injects `TopNav` + `FooterStatus`, and mounts Astro 4's `ViewTransitions` aliased as `ClientRouter` (alias is deliberate — it survives the eventual Astro 5 upgrade with a one-line change).

## Content collections

Defined in `src/content/config.ts`. Five collections, each with strict Zod schemas:

| Collection | Persona      | Notable schema bits |
|------------|--------------|---------------------|
| `projects` | coder        | `status: active\|shipped\|experimental\|abandoned`, optional `shipped` ISO date |
| `places`   | traveler     | `yearMonth: YYYY-MM`, `countryCode` 2-char, `paragraphAuthor` distinguishes hand-written vs AI |
| `books`    | curate       | `status: reading\|finished\|queued\|abandoned`, optional pull-quote |
| `builds`   | made         | `status: queued\|building\|shipped\|abandoned\|on-bench` |
| `essays`   | (writing)    | `tags`, `draft` |

Schemas are enforced at build by `astro check`. Editing a schema requires touching every existing entry that violates it.

### Places have a strict on-disk contract

Each place ships in two locations keyed by the same slug `YYYY-MM-<kebab>`:

- `src/content/places/<slug>.md` — frontmatter + body
- `public/photos/<slug>/` — 5–10 photos named `NN-descriptive-words.{jpg,jpeg,png,webp,avif}`; `01-` prefix on the cover is **mandatory** (the manifest script fails the build otherwise). Optional `captions.yaml` overrides the filename-derived captions.

Use `npm run trip:new` to scaffold both — don't create them by hand. Full workflow: `docs/add-trip-guide.md`.

### Paragraph regeneration

To force re-generation of an AI paragraph, set `paragraphAuthor: ai-regenerate` in the place's frontmatter; the next `npm run paragraphs` run replaces it. `ak` / `ashish` mark hand-written copy and are never overwritten.

## Conventions

- **Path alias**: `@/*` → `src/*` (from `tsconfig.json`). Use it for cross-directory imports; relative paths inside the same persona folder are fine.
- **shadcn/ui**: New York style, lucide icons, base color zinc. Config in `components.json`. Generated components live in `src/components/ui/`.
- **Styling layers**, in order of precedence: per-persona CSS variables in `public/styles/personas/<id>.css` → `src/styles/tokens.css` (global tokens) → `src/styles/global.css` → Tailwind utilities. Persona tokens override globals via the `[data-persona="<id>"]` selector on `<html>`.
- **React islands** live under `src/components/<persona>/*.tsx` and are mounted from `.astro` pages with `client:*` directives. Astro components (`.astro`) are SSR-only; don't try to import them from `.tsx` files.
- **`as any` on `heroLoader` imports in `registry.ts` is intentional** — plain `tsc --noEmit` can't resolve `.astro` modules (only `@astrojs/check` can). Keep the cast; the components are verified at build time.
- **Astro 4 → 5 migration shim**: `import { ViewTransitions as ClientRouter } from "astro:transitions"` is the project-wide pattern. When upgrading to Astro 5, drop the alias and rename the import — that's the only change.
- **`tsconfig.json` excludes** `dist`, `worker`, and `scripts`. Scripts use `tsx` at runtime and don't need to satisfy site TS settings.

## Review artifacts

`REVIEW-2026-05-18.md` and its summary are the canonical UX/a11y/copy critiques driving current iteration (H1 semantics, contrast, "Previously:" receipts strip, etc.). Read them before making hero, nav, or chrome changes — most "feels arbitrary" decisions trace back to a finding in there.

## MCP servers

Use the MCP servers already wired into this Copilot CLI session — do not add new ones. Verified healthy 2026-05-26:

| Server | Tool prefix | Use for |
|---|---|---|
| **ashish_chrome** | `ashish_chrome_http-*`, `ashish_chrome_stdio-*` | **Primary.** Drives the user's logged-in Chrome — best for visual review of `localhost:4321` / the live site, persona-switch animations, and the REVIEW-2026-05-18 punch list (contrast checks, H1 semantics via `chrome_read_page`, network/console captures, perf traces). |
| **ashish_playwright** | `ashish_playwright-browser_*` | **Primary.** Use when a clean profile, scripted automation, or `browser_snapshot`-based accessibility tree is needed (a11y audits, deterministic screenshots, headless flows). |
| **deepwiki** | `deepwiki-*` | Astro 4.x / React 18 / Tailwind 3 / Embla / Motion API lookups — prefer over webfetch for framework docs. |
| **memory** | `memory-*` | Persist persona-routing or content-schema invariants across sessions. |
| **linear** | `linear-*` | Track follow-ups from `REVIEW-*.md` punch lists if/when they get filed as issues. |
| **neon** | `neon-*` | Not relevant — this site is fully static, no database. |

**Default rule:** for any browser-driven task on this repo, reach for `ashish_chrome` first (it carries the real session + extensions); fall back to `ashish_playwright` only when isolation, scripting, or a11y-tree snapshots are needed.

## Don't

- Don't commit `.env`, `worker/.dev.vars`, `dist/`, `.astro/`, or anything under `node_modules/`.
- Don't add a persona without updating `registry.ts` first — every other place that needs to know derives from it.
- Don't bypass `npm run trip:new` when adding a place; the slug + cover-photo constraints are enforced downstream.
- Don't push to any branch other than `master` to deploy; that's the only branch `deploy.yml` listens on.
