# ask149.github.io

Personal site of Ashish Kshirsagar — live at [ask149.github.io](https://ask149.github.io).

## What this is

A four-persona portfolio. Each persona is its own route, its own visual world, and its own interaction pattern — but they share one design system, one content layer, and one chrome.

| Persona | Route | Subject | Interaction |
|---------|-------|---------|-------------|
| Coder | `/` | Shipping with agents in parallel | Tag-filterable project grid + live agent feed |
| Traveler | `/traveler` | Places visited, places next | Horizontal polaroid timeline (Embla) |
| Curator | `/curate` | Books, quotes, taste | Editorial reading list |
| Maker | `/made` | Side builds and sketchbook | AnimatePresence grid |

The premise: a recruiter, a friend, and a fellow builder land on different pages and each find what they came for — without the others getting in the way.

## Stack

- **Astro 4.10** static site generator (18 routes, no SSR)
- **React 18** islands for interactive components (ProjectGrid, TravelTimeline, MakerGrid)
- **TypeScript** strict mode end-to-end
- **Tailwind 3** + custom CSS tokens per persona (`public/styles/personas/*.css`)
- **Motion** for AnimatePresence; **Embla** for the carousel; **Radix Slot** for primitives
- **Cloudflare Worker** (`worker/`) — separate, untouched — powers the live agent activity feed at `ask149-feed.workers.dev`

Deployed to GitHub Pages via the `deploy.yml` workflow on push to `master`.

## The keystone: persona registry

`src/personas/registry.ts` is the only place that knows about personas. It declares each persona's route, collection, tokens, hero loader, and transition mode. Every layout, nav, and page reads from this registry — adding a 5th persona is mechanical (see below).

```ts
export interface PersonaDef {
  id: PersonaId;
  sectionNumber: number;
  label: string;
  route: `/${string}`;
  blurb: string;
  tokensHref: `personas/${PersonaId}.css`;
  collection: CollectionKey | null;
  transitionMode: "morph" | "fade";
  heroLoader: () => Promise<{ default: ComponentType<unknown> }>;
}
```

## Run locally

```sh
npm install
npm run dev
# → http://localhost:4321
```

Other useful scripts:

```sh
npm run check    # astro check (TS + content schema validation)
npm run build    # static build to dist/
npm run preview  # serve the built site
```

Worker (separate concern, rarely touched):

```sh
cd worker
npm install
cp .dev.vars.example .dev.vars
npx wrangler dev   # → http://localhost:8787
```

## Adding a 5th persona

1. Add the persona id to the `PersonaId` union in `src/personas/registry.ts` and append a new `PersonaDef` entry.
2. Create `src/content/<collection>/` with a matching schema in `src/content/config.ts`.
3. Drop a tokens file at `public/styles/personas/<id>.css` defining `--bg`, `--fg`, `--accent`, `--bg-texture`, etc.
4. Build the page at `src/pages/<id>.astro` using `PersonaLayout` and a hero component at `src/components/<id>/<Id>Hero.astro`.
5. Run `npm run check && npm run build` and verify the new route + nav entry render.

## Project layout

```
src/
  components/{coder,traveler,curate,made,chrome,ui}/   # persona-scoped + shared
  content/{essays,projects,places,books,builds}/       # MDX collections
  layouts/PersonaLayout.astro                          # shared chrome wrapper
  pages/{index,traveler,curate,made,...}.astro         # routes
  personas/registry.ts                                 # the keystone
  styles/                                              # global tokens + utilities
public/
  styles/personas/*.css                                # per-persona CSS variables
  textures/*.svg                                       # background textures
worker/                                                # Cloudflare Worker (agent feed)
```

## Reference

- Design spec: `docs/superpowers/specs/2026-05-17-portfolio-v3-multi-persona-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-17-portfolio-v3-multi-persona.md`
- Cutover notes: `docs/superpowers/cutover-2026-05-17-portfolio-v3.md`

## License

MIT — see `LICENSE`.
