# ask149.github.io

Ashish Kshirsagar's personal site.

## Branches

- **`master`** — current production: Jekyll + AcademicPages (live at https://Ask149.github.io)
- **`v2`** — rewrite in progress: Astro static + Cloudflare Worker for live agent activity feed

## v2 architecture

- **Static site** — Astro, deployed to GitHub Pages via the `deploy-v2.yml` workflow
- **Agent feed Worker** — Cloudflare Worker at `ask149-feed.workers.dev` (see `worker/README.md`); coding agents POST events; the static site polls `/events.json` and renders the LIVE widget on the homepage
- **Visual language** — Newsreader (serif) + JetBrains Mono (mono); warm copper `#C26644` accent; warm cream / near-black backgrounds; one signature animation (ink-bleed feed entries)

## v2 dev

```sh
npm install
npm run dev
# → http://localhost:4321
```

Worker dev:
```sh
cd worker
npm install
cp .dev.vars.example .dev.vars
npx wrangler dev
# → http://localhost:8787
```

## v2 deploy

- **Site:** push to `v2` → GH Actions builds + deploys to GitHub Pages
- **Worker:** `cd worker && npx wrangler deploy`

## Cutover plan (later)

When v2 is content-complete: merge `v2` → `master`; rename current `master` → `archive/jekyll-v1`; flip the deploy workflow to trigger on `master`.

## Design spec

See `~/Projects/active/opencode/notes/2026-05-16-portfolio-v2-design-spec.md`.
