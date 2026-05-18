# Portfolio v3 — Multi-Persona Architecture (design spec)

**Date:** 2026-05-17
**Status:** Design locked. Implementation pending Ashish's review of this spec, then a `writing-plans` pass.
**Owner:** Ashish Kshirsagar
**Repo:** `Ask149/ask149.github.io` (work branch: `v2`; cutover target: `main`)
**Companion docs:**
- v2 spec (inherited base): `~/Projects/active/opencode/notes/2026-05-16-portfolio-v2-design-spec.md`
- Researcher findings (2026-05-17, inline citations below)
- This spec lives at: `docs/superpowers/specs/2026-05-17-portfolio-v3-multi-persona-design.md`

---

## 1. Why we're doing this

V2 shipped a single-page Coder portfolio with a live agent feed centerpiece — the receipts-of-real-work identity signal (see v2 spec §"Why"). V3 keeps that centerpiece but extends the surface area into a **multi-persona portfolio**: Coder (current `/`), Traveler (`/traveler`), Curator (`/curate`), Maker (`/made`). The thesis is that a single-page tech identity flattens Ashish into "another L5/L6 SWE" — the four-tab structure surfaces dimensions (places visited, books read, things built outside work) that compound the recruiter-credibility win from v2 without diluting it. V3 is a strict *extension* of v2: the Cloudflare Worker, content collections (`essays`, `projects`), `LiveFeed.tsx` island, and Astro+MDX+React stack are all preserved; what changes is the layout/chrome split, the addition of three persona routes, and a registry-driven theming model engineered so a fifth persona later costs hours, not days.

## 2. Decisions locked

| # | Decision | Value | Rationale |
|---|---|---|---|
| 1 | Inheritance from v2 | All v2 stack, worker, feed, content collections, easter eggs preserved | V3 is extension, not rewrite |
| 2 | Persona count at launch | 4 (Coder, Traveler, Curator, Maker) | Matches Ashish's actual surfaces; fifth persona deferred to registry-driven future-add |
| 3 | Route shape | `/` (Coder), `/traveler`, `/curate`, `/made` | Short, memorable; root stays Coder so existing inbound links don't break |
| 4 | Tab transitions | Astro `<ClientRouter />` (native View Transitions API in Astro 4.x) | Zero-JS for nav; `transition:name` morphs the active-tab pill across routes |
| 5 | Hydration strategy | `client:visible` for ALL interactive islands | Above-fold paint is HTML-only; LCP stays locked to H1; ~31 KB gz incremental JS budget total |
| 6 | Coder pattern | `motion/react` `staggerChildren` + `whileInView` + tag cross-filter | Builds on v2 Coder; framer-motion was renamed to `motion` package (Nov 2024) |
| 7 | Traveler pattern | shadcn `<Carousel />` wrapping `embla-carousel-react` + `embla-carousel-wheel-gestures` | Per researcher findings 2026-05-17, shadcn/Carousel wraps `embla-carousel-react` directly; we adopt the verbatim source via `npx shadcn@latest add carousel` |
| 8 | Curator pattern | Pure Astro Content Collections + Zod; daily deterministic quote rotation `Math.floor(Date.now()/86_400_000) % n` | Zero JS — quote rotates at SSG build cadence + a tiny client expr; no hydration cost |
| 9 | Maker pattern | Tailwind `animate-pulse` + Motion `<AnimatePresence>` for cross-fade when builds populate | Empty state is intentional, not embarrassing; pulses while queue is the only signal |
| 10 | Modularity keystone | Persona registry as config (`src/personas/registry.ts`) | Fifth persona = one registry entry + one tokens file + one content collection + one component folder |
| 11 | Theme tokens | Per-persona CSS custom property modules under `src/styles/personas/` | Persona swap = one tokens file change; never inline |
| 12 | Chrome separation | One shared layout (top nav + footer status bar) used by all 4 personas | Crossing this line requires a deliberate refactor, not casual edit |
| 13 | Reduced motion | Motion auto-respects `prefers-reduced-motion`; Tailwind uses `motion-safe:` variants for the rest | Single, predictable behavior across all 4 patterns |
| 14 | View Transitions fallback | Instant nav (no morph) when API unsupported (Firefox under flag, older Safari) | Graceful degradation; no JS polyfill |
| 15 | Bundle budget | ≤ 35 KB gz total incremental JS across all 4 personas (estimate: ~31 KB) | Hard ceiling; measured via `astro build --analyze` |
| 16 | Content collection strategy | Versioned via Zod `.extend()`, optional fields, sensible defaults | Book schema can evolve without breaking earlier entries |
| 17 | No coupling between persona islands | Traveler carousel cannot import from Coder grid; Curator quote rotation cannot reference Maker empty state | Enforced via folder boundaries; no shared persona-body utility module |
| 18 | Cutover | Merge `v2` → `main` after Phase F polish; old Jekyll preserved at `archive/jekyll-v1` | Same approach as v2 spec |
| 19 | Branding | Each persona has its own palette + typography emphasis; chrome (nav + footer) stays neutral | Active-tab pill picks up persona accent on hover/active |

## 3. Information architecture

### 3.1 Route map

| Route | Persona | Type | Hydration |
|---|---|---|---|
| `/` | §1 Coder | Persona landing | `client:visible` (ProjectGrid + LiveFeed) |
| `/traveler` | §2 Traveler | Persona landing | `client:visible` (TravelTimeline) |
| `/curate` | §3 Curator | Persona landing | none — pure Astro |
| `/made` | §6 Maker | Persona landing | `client:visible` (MakerGrid AnimatePresence) |
| `/feed` | shared | Off-nav | Inherits v2 |
| `/feed.json` | shared | API proxy | Inherits v2 |
| `/now` | shared | Off-nav | Inherits v2 |
| `/uses` | shared | Off-nav | Inherits v2 |
| `/writing` | shared | Off-nav (essay index) | Inherits v2 |
| `/writing/[slug]` | shared | MDX render | Inherits v2 |
| `/projects` | shared | Off-nav (deep dives) | Inherits v2 |
| `/projects/[slug]` | shared | MDX render | Inherits v2 |
| `/changelog` | shared | Off-nav (linked from footer status bar) | static |
| `/agents` | shared | Easter egg | Inherits v2 |
| `/sudo` | shared | Easter egg | Inherits v2 |
| `/cost` | shared | Easter egg | Inherits v2 |
| `/404` | shared | JSON-styled error | Inherits v2 |

> Why §6 not §4? The persona ordering mirrors how Ashish thinks about himself: Coder (1), Traveler (2), Curator (3) — these are the active-output dimensions — then a numbering jump to Maker (6) signaling "this one is mostly aspirational right now." If that feels too cute later, we collapse to §1/§2/§3/§4 in a single registry edit.

### 3.2 Per-persona content inventory

**§1 Coder (`/`)** — kept faithful to v2's homepage:
- Header status line (one dense line, name + current role + transition)
- LIVE Now widget (3 most-recent agent events; expand to 10)
- Manifesto essay link / lead-in
- Project grid (4–6 cards from `projects` collection) with tag cross-filter
- Career timeline (tight, dated)
- Connect strip (email, GitHub, Twitter, LinkedIn)

**§2 Traveler (`/traveler`)** — horizontal scroll-snap timeline:
- Sticky year-marker header (year derived from current Embla slide)
- Horizontal carousel of polaroid-style place cards (left→right chronological)
- "Next stop" card (currently: Pune Jun 2026)
- Optional bottom strip: country count, miles flown (computed from collection)

**§3 Curator (`/curate`)** — quiet, literary:
- "Now reading" card (single book; from `books` collection where `status: "reading"`)
- Daily-rotating quote (deterministic — see §5.3)
- "Recently finished" grid (last 6–8 books with `status: "finished"`)
- Optional: "On the shelf" list (`status: "queued"`)

**§6 Maker (`/made`)** — sparse-by-design:
- "Build queue" list (`builds` collection where `status: "queued"`)
- Empty grid placeholder with `animate-pulse` — populates via `<AnimatePresence>` cross-fade when first `status: "shipped"` lands
- Once shipped builds exist: grid of build cards (similar to project cards but more sketchbook-feel)

### 3.3 Shared chrome

**Top nav** (single component, rendered from registry — see §4):
- Logo / wordmark on left ("ask149" in Newsreader)
- Persona tabs: Coder · Traveler · Curate · Made
- Active tab pill (morphs across routes via View Transitions `transition:name="tab-pill"`)
- Theme toggle (light/dark, inherits v2 behavior)
- Hover: tab pill peeks in persona accent color

**Footer status bar** (one component, all 4 personas):
- Left: `last commit: <hash> · <relative time>` (read at build time; linked to `/changelog`)
- Center: `current persona: <id> · §<number>`
- Right: lightweight hit counter (carried from v2) + LIVE-poll thinking dot when a poll is in flight

**`/changelog`** behavior:
- A reverse-chrono list of meaningful site changes (manual MDX entries)
- Footer link on every page; serves as the "did anything change?" signal

## 4. The persona registry (MODULARITY KEYSTONE)

**This is the heart of v3's extensibility.** Adding a 5th persona must cost: (a) one entry in this registry, (b) one tokens file, (c) one content collection, (d) one component folder. Nothing else.

### 4.1 Location and shape

`src/personas/registry.ts`:

```ts
import type { CollectionKey } from "astro:content";
import type { ComponentType } from "react";

export type PersonaId = "coder" | "traveler" | "curate" | "made";

export interface PersonaDef {
  /** Stable id used as discriminator and CSS data attribute */
  id: PersonaId;
  /** Display section number — purely cosmetic */
  sectionNumber: number;
  /** Short label shown in top-nav tab */
  label: string;
  /** Route pathname (must match a file under src/pages/) */
  route: `/${string}`;
  /** Short blurb for hover / a11y aria-description */
  blurb: string;
  /** Path to the per-persona CSS tokens file, relative to src/styles/ */
  tokensHref: `personas/${PersonaId}.css`;
  /** Astro content collection this persona reads from (or null) */
  collection: CollectionKey | null;
  /** Whether this persona uses View Transitions cross-fade (vs default morph) */
  transitionMode: "morph" | "fade";
  /** Lazy import of the persona's hero/body component (Astro or React) */
  heroLoader: () => Promise<{ default: ComponentType<unknown> }>;
}

export const PERSONAS: readonly PersonaDef[] = [
  {
    id: "coder",
    sectionNumber: 1,
    label: "Coder",
    route: "/",
    blurb: "shipping with agents in parallel",
    tokensHref: "personas/coder.css",
    collection: "projects",
    transitionMode: "morph",
    heroLoader: () => import("../components/coder/CoderHero.astro"),
  },
  {
    id: "traveler",
    sectionNumber: 2,
    label: "Traveler",
    route: "/traveler",
    blurb: "places visited, places next",
    tokensHref: "personas/traveler.css",
    collection: "places",
    transitionMode: "morph",
    heroLoader: () => import("../components/traveler/TravelerHero.astro"),
  },
  {
    id: "curate",
    sectionNumber: 3,
    label: "Curate",
    route: "/curate",
    blurb: "books, quotes, taste",
    tokensHref: "personas/curate.css",
    collection: "books",
    transitionMode: "fade",
    heroLoader: () => import("../components/curate/CurateHero.astro"),
  },
  {
    id: "made",
    sectionNumber: 6,
    label: "Made",
    route: "/made",
    blurb: "side builds and sketchbook",
    tokensHref: "personas/made.css",
    collection: "builds",
    transitionMode: "fade",
    heroLoader: () => import("../components/made/MadeHero.astro"),
  },
] as const;

export function getPersonaByRoute(pathname: string): PersonaDef | undefined {
  // Exact-match first, then fallback to longest-prefix match for sub-routes
  const exact = PERSONAS.find((p) => p.route === pathname);
  if (exact) return exact;
  return PERSONAS
    .filter((p) => p.route !== "/" && pathname.startsWith(p.route))
    .sort((a, b) => b.route.length - a.route.length)[0];
}

export function getPersonaById(id: PersonaId): PersonaDef {
  const p = PERSONAS.find((x) => x.id === id);
  if (!p) throw new Error(`Persona not in registry: ${id}`);
  return p;
}
```

### 4.2 How the top nav renders from the registry

`src/components/chrome/TopNav.astro`:

```astro
---
import { PERSONAS, getPersonaByRoute } from "../../personas/registry";
const active = getPersonaByRoute(Astro.url.pathname);
---
<nav class="top-nav" aria-label="Persona navigation">
  <a href="/" class="brand">ask149</a>
  <ul class="tabs">
    {PERSONAS.map((p) => (
      <li>
        <a
          href={p.route}
          aria-current={active?.id === p.id ? "page" : undefined}
          aria-description={p.blurb}
          data-persona={p.id}
          class:list={["tab", { active: active?.id === p.id }]}
        >
          {active?.id === p.id && (
            <span class="pill" transition:name="tab-pill" />
          )}
          <span class="label">{p.label}</span>
        </a>
      </li>
    ))}
  </ul>
  <theme-toggle />
</nav>
```

The `transition:name="tab-pill"` is rendered ONLY on the active tab. When the user clicks another tab, Astro's View Transitions API morphs the pill from old position to new — single line, no JS needed.

### 4.3 How the shared layout consumes the registry

`src/layouts/PersonaLayout.astro`:

```astro
---
import { ClientRouter } from "astro:transitions";
import { getPersonaById, type PersonaId } from "../personas/registry";
import TopNav from "../components/chrome/TopNav.astro";
import FooterStatus from "../components/chrome/FooterStatus.astro";
import "../styles/tokens.css"; // neutral/shared tokens only

export interface Props {
  personaId: PersonaId;
  title: string;
  description?: string;
}

const { personaId, title, description } = Astro.props;
const persona = getPersonaById(personaId);
---
<!doctype html>
<html lang="en" data-persona={persona.id}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    {/* Persona-scoped tokens — only one stylesheet per persona */}
    <link rel="stylesheet" href={`/styles/${persona.tokensHref}`} />
    <ClientRouter />
  </head>
  <body class={`persona-${persona.id}`}>
    <TopNav />
    <main>
      <slot />
    </main>
    <FooterStatus />
  </body>
</html>
```

Adding a 5th persona = (1) push a new entry into `PERSONAS`, (2) drop `src/styles/personas/<id>.css`, (3) register a `src/content/config.ts` collection, (4) create `src/components/<id>/` folder, (5) create `src/pages/<route>.astro` that does `<PersonaLayout personaId="<id>" …>`. Five touches, zero shared-component edits.

## 5. Component contracts

For brevity, the prop interfaces are TypeScript; Astro components use `Astro.props` typed via the same interfaces.

### 5.1 §1 Coder

**`<ProjectGrid />`** — React island (`client:visible`).

```ts
import type { CollectionEntry } from "astro:content";

export interface ProjectGridProps {
  /** Sorted: featured first, then by date desc */
  projects: CollectionEntry<"projects">[];
  /** Tags to render as chip filters (computed by caller from project frontmatter) */
  allTags: string[];
}
```

- Hydration: `client:visible`
- Required Tailwind classes / tokens: `bg-[color:var(--bg)]`, `text-[color:var(--fg)]`, `border-[color:var(--rule)]`
- Motion: `motion.div` parent with `variants={{ visible: { transition: { staggerChildren: 0.05 } } }}`; each `<ProjectCard />` uses `whileInView={{ opacity: 1, y: 0 }}` from `{ opacity: 0, y: 8 }`
- Tag filter: local `useState<Set<string>>`; clicking a chip toggles inclusion; "any" mode (OR semantics) — empty selection = show all
- Loading state: render skeleton cards at full grid dimensions to prevent layout shift before hydration
- Empty state (after filter narrows to 0): "no projects match. [reset]"
- Error state: not applicable (data is build-time)

**`<ProjectCard />`** — React (children of ProjectGrid).

```ts
export interface ProjectCardProps {
  slug: string;
  title: string;
  blurb: string;
  tags: readonly string[];
  url?: string;
  /** Optional cover image; uses Astro Image at build for the static fallback */
  cover?: { src: string; alt: string };
  featured?: boolean;
  /** Live filter set from grid parent */
  activeFilters: ReadonlySet<string>;
}
```

- Hydrates with parent
- Failure mode: if `cover` missing, falls back to monospace ASCII art placeholder

**`<TechChip />`** — pure React (no hooks).

```ts
export interface TechChipProps {
  tag: string;
  active: boolean;
  onToggle: (tag: string) => void;
}
```

### 5.2 §2 Traveler

**`<TravelTimeline />`** — React island (`client:visible`); wraps shadcn `<Carousel />`.

```ts
import type { CollectionEntry } from "astro:content";

export interface TravelTimelineProps {
  /** Sorted oldest → newest */
  places: CollectionEntry<"places">[];
  /** Optional next-stop card data */
  nextStop?: { name: string; date: string; reason: string };
}
```

- Hydration: `client:visible`
- Uses shadcn-installed `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext` from `src/components/ui/carousel.tsx` (verbatim shadcn source per researcher findings 2026-05-17)
- Embla options: `{ align: "start", dragFree: true, loop: false }`
- Plugins: `WheelGesturesPlugin()` from `embla-carousel-wheel-gestures` (verify liveness — see §12 risks)
- Hooks `api.on("select")` to update sticky year-marker header (derived from selected slide's frontmatter year)
- Sticky year-marker rendered as a sibling above carousel, position:sticky top:0 within the persona main
- Loading state: SSR renders all slides as a horizontally-scrollable flex row (no JS = it's still a usable native scroll-snap container with `scroll-snap-type: x mandatory`)
- Empty state: "no places yet. starting in Pune, Jun 2026."

**`<Polaroid />`** — React (children of carousel items).

```ts
export interface PolaroidProps {
  slug: string;
  title: string; // city name
  country: string;
  airportCode?: string; // IATA-ish, optional
  yearMonth: string; // "2024-08"
  image: { src: string; alt: string };
  caption?: string;
}
```

- Rotation: `transform: rotate(<deterministic-jitter>)` — small ±2° based on hash of `slug` so cards feel hand-laid but stable across renders
- Required tokens: `bg-[color:var(--polaroid-bg)]`, `shadow-[var(--polaroid-shadow)]`
- Failure: if image fails to load, shows airport-code + city in mono fallback

**`<YearMarker />`** — pure React.

```ts
export interface YearMarkerProps {
  year: number;
  count: number; // places that year
}
```

**`<NextStopCard />`** — pure Astro (no React).

```ts
export interface NextStopCardProps {
  name: string;
  date: string;
  reason: string;
}
```

### 5.3 §3 Curator

All Curator components are **pure Astro** — zero React, zero client JS.

**`<NowReading />`** — pure Astro.

```ts
export interface NowReadingProps {
  book: CollectionEntry<"books">;
}
```

- Renders title, author, cover (via Astro Image), date-started, current-page-or-percent
- No interactive state
- Empty state: "between books." (intentional, literary)

**`<QuoteRotator />`** — pure Astro with a deterministic daily pick.

```ts
export interface QuoteRotatorProps {
  quotes: { text: string; source: string }[];
}
```

Implementation:

```astro
---
const { quotes } = Astro.props;
// Deterministic: change at UTC midnight; SSG-rendered once per build,
// hydrated index re-derived only if we ever opt into client:load (we don't).
const idx = Math.floor(Date.now() / 86_400_000) % quotes.length;
const today = quotes[idx];
---
<blockquote class="quote">
  <p>{today.text}</p>
  <cite>— {today.source}</cite>
</blockquote>
```

Because pages are SSG'd and GitHub Pages serves them statically, the quote "rotates" on the cadence of redeploys + once per UTC day relative to the build time. That's the intended behavior: low-fi, no JS, no surprise to the user. If we ever want true daily client-side rotation we can swap to a single inline `<script>` that recomputes index on `DOMContentLoaded`; not in v1.

**`<FinishedGrid />`** — pure Astro.

```ts
export interface FinishedGridProps {
  books: CollectionEntry<"books">[];
  limit?: number; // default 8
}
```

- Sort: by `finishedDate` desc
- Empty state: hides itself entirely (no awkward "no books" placeholder)

### 5.4 §6 Maker

**`<MakerGrid />`** — React island (`client:visible`).

```ts
import type { CollectionEntry } from "astro:content";

export interface MakerGridProps {
  builds: CollectionEntry<"builds">[];
}
```

- Hydration: `client:visible`
- If `builds.filter(b => b.data.status === "shipped").length === 0` → render only `<EmptyPlaceholder />`
- Else: wrap shipped cards in `<AnimatePresence initial={false}>` so first card lands with a cross-fade
- `motion.div` per card with `layout` prop so reordering feels alive
- Failure: same as ProjectGrid (build-time data; no error path)

**`<EmptyPlaceholder />`** — React (children of MakerGrid).

```ts
export interface EmptyPlaceholderProps {
  /** Pulse intensity; default 0.4 (Tailwind animate-pulse equivalent) */
  pulseOpacity?: number;
}
```

- Uses `motion-safe:animate-pulse` so reduced-motion users see a static placeholder
- Copy: "no shipped builds yet. queue below."

**`<BuildQueueList />`** — pure Astro.

```ts
export interface BuildQueueListProps {
  items: CollectionEntry<"builds">[];
}
```

- Filters internally to `status === "queued"`
- Sort: `priority` desc, then `addedDate` asc
- No animation (it's a list, not a feature)

## 6. Content collection schemas

Existing v2 collections (`essays`, `projects`) stay **as-is**. Three new collections added:

### 6.1 `places` (Traveler)

`src/content/config.ts`:

```ts
import { defineCollection, z } from "astro:content";

const places = defineCollection({
  type: "content",
  schema: ({ image }) => z.object({
    title: z.string(),               // city, e.g. "Lisbon"
    country: z.string(),             // ISO 3166 name
    countryCode: z.string().length(2),
    airportCode: z.string().length(3).optional(),
    yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), // "2024-08"
    cover: image().optional(),
    coverAlt: z.string().default(""),
    durationDays: z.number().int().positive().optional(),
    reason: z.enum(["leisure", "work", "transit", "family", "wedding"]).default("leisure"),
    favorite: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});
```

Sample entry — `src/content/places/2024-08-lisbon.md`:

```markdown
---
title: "Lisbon"
country: "Portugal"
countryCode: "PT"
airportCode: "LIS"
yearMonth: "2024-08"
durationDays: 6
reason: "leisure"
favorite: true
coverAlt: "Yellow tram 28 climbing Rua da Conceição"
---

Pastéis at Manteigaria. Tram 28 down Alfama. Day trip to Sintra.
```

Sort order in `<TravelTimeline />`: `yearMonth` asc (chronological L→R).
Filter: `where draft === false`.

**Future extensibility:** add `coordinates: z.tuple([z.number(), z.number()]).optional()` later for a map view; existing entries still validate (optional field). Add `companions: z.array(z.string()).optional()` for "traveled with" credits. Schema version bump = add fields as `.optional()`; never remove.

### 6.2 `books` (Curator)

```ts
const books = defineCollection({
  type: "content",
  schema: ({ image }) => z.object({
    title: z.string(),
    author: z.string(),
    status: z.enum(["reading", "finished", "queued", "abandoned"]),
    startedDate: z.coerce.date().optional(),
    finishedDate: z.coerce.date().optional(),
    cover: image().optional(),
    coverAlt: z.string().default(""),
    rating: z.number().int().min(1).max(5).optional(),
    quote: z.object({
      text: z.string().max(280),
      page: z.number().int().positive().optional(),
    }).optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});
```

Sample entry — `src/content/books/2025-deep-work.md`:

```markdown
---
title: "Deep Work"
author: "Cal Newport"
status: "finished"
startedDate: 2025-01-15
finishedDate: 2025-02-03
rating: 4
quote:
  text: "The Deep Work Hypothesis: The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy."
  page: 14
tags: ["productivity", "focus"]
---

Re-read after switching to async-heavy work. Held up better than I expected.
```

Sort:
- `<NowReading />`: filter `status === "reading"`, take first (max 1)
- `<FinishedGrid />`: filter `status === "finished"`, sort `finishedDate` desc, limit
- `<QuoteRotator />`: pull all entries with non-empty `quote` field; deterministic daily pick across them

**Future extensibility:** add `genre`, `format: z.enum(["physical", "ebook", "audio"])`, `goodreadsId: z.string().optional()`. All additive.

### 6.3 `builds` (Maker)

```ts
const builds = defineCollection({
  type: "content",
  schema: ({ image }) => z.object({
    title: z.string(),
    status: z.enum(["queued", "building", "shipped", "abandoned"]),
    priority: z.number().int().min(0).max(10).default(5),
    addedDate: z.coerce.date(),
    shippedDate: z.coerce.date().optional(),
    blurb: z.string().max(140),
    url: z.string().url().optional(),
    repo: z.string().regex(/^[\w-]+\/[\w.-]+$/).optional(),
    cover: image().optional(),
    coverAlt: z.string().default(""),
    tags: z.array(z.string()).default([]),
    why: z.string().optional(), // longer "why this exists" — surfaced on /made/[slug]
    draft: z.boolean().default(false),
  }),
});
```

Sample entry — `src/content/builds/2026-mcp-gateway.md`:

```markdown
---
title: "MCP Gateway (Go)"
status: "queued"
priority: 8
addedDate: 2026-05-01
blurb: "Single auth-aware proxy in front of multiple MCP servers."
tags: ["go", "mcp", "infra"]
why: "Five MCPs, five auth flows, five places to leak a token. One gateway, one place."
---
```

Sort:
- `<MakerGrid />`: `status === "shipped"`, sort `shippedDate` desc
- `<BuildQueueList />`: `status === "queued"`, sort by `priority` desc then `addedDate` asc

**Future extensibility:** add `stack: z.array(z.string()).optional()`, `metrics: z.object({...}).optional()` for "users", "stars", "revenue" if any builds ever earn that. Additive.

### 6.4 Existing collections (unchanged)

```ts
// from v2 — keep verbatim
const essays = defineCollection({ /* unchanged */ });
const projects = defineCollection({ /* unchanged */ });

export const collections = { essays, projects, places, books, builds };
```

## 7. Theming + tokens (MODULARITY KEYSTONE #2)

### 7.1 Per-persona token files

`src/styles/personas/coder.css` (existing v2 tokens, modestly renamed for namespacing):

```css
:root[data-persona="coder"] {
  --bg: #F4EFE3;
  --bg-texture: url("/textures/dot-grid-22.svg");
  --bg-texture-size: 22px;
  --fg: #15110A;
  --fg-muted: #5C5650;
  --fg-faint: #A8A39C;
  --rule: #D7D1C5;
  --accent: #B85838;
  --surface: #FFFFFFCC;
  --polaroid-bg: #FFFFFF; /* unused here but defined for parity */
  --polaroid-shadow: 0 1px 2px rgba(0,0,0,0.08);
  --font-display: "Newsreader", serif;
  --font-body: "Newsreader", serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

`src/styles/personas/traveler.css`:

```css
:root[data-persona="traveler"] {
  --bg: linear-gradient(180deg, #E8DBC0 0%, #D9CFB8 100%);
  --bg-texture: url("/textures/topographic-lines.svg");
  --bg-texture-size: 240px;
  --fg: #1A2638;
  --fg-muted: #5A6878;
  --fg-faint: #99A2B0;
  --rule: #C7BFA8;
  --accent: #3A5470;
  --surface: #FFFFFFE0;
  --polaroid-bg: #F8F4EA;
  --polaroid-shadow: 0 4px 14px rgba(26, 38, 56, 0.18);
  --font-display: "Newsreader", serif;
  --font-body: "Newsreader", serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

`src/styles/personas/curate.css`:

```css
:root[data-persona="curate"] {
  --bg: linear-gradient(180deg, #F0E8D8 0%, #E6D9BE 100%);
  --bg-texture: none;
  --bg-texture-size: 0;
  --fg: #4A2828;
  --fg-muted: #7A5A5A;
  --fg-faint: #B89AA0;
  --rule: #D9C7B0;
  --accent: #7A2828;
  --accent-secondary: #B89968; /* brass */
  --surface: #FFFFFFCC;
  --polaroid-bg: #FFFFFF;
  --polaroid-shadow: 0 1px 2px rgba(0,0,0,0.08);
  --font-display: "Newsreader", serif;
  --font-display-style: italic;
  --font-body: "Newsreader", serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

`src/styles/personas/made.css`:

```css
:root[data-persona="made"] {
  --bg: linear-gradient(180deg, #2A3A52 0%, #1A2638 100%);
  --bg-texture: repeating-linear-gradient(
    0deg,
    transparent 0,
    transparent 23px,
    rgba(245, 239, 224, 0.04) 23px,
    rgba(245, 239, 224, 0.04) 24px
  );
  --bg-texture-size: auto;
  --fg: #F5EFE0;
  --fg-muted: #C0B8A8;
  --fg-faint: #6A6258;
  --rule: rgba(245, 239, 224, 0.12);
  --accent: #D85820;
  --surface: rgba(245, 239, 224, 0.06);
  --polaroid-bg: #F5EFE0; /* unused */
  --polaroid-shadow: 0 1px 2px rgba(0,0,0,0.3);
  --font-display: "Newsreader", serif;
  --font-body: "Newsreader", serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

### 7.2 Shared neutral tokens

`src/styles/tokens.css` (shrunk from v2's monolithic version — keeps only cross-persona neutrals):

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --radius-sm: 2px;
  --radius-md: 6px;
  --radius-pill: 9999px;
  --transition-fast: 150ms ease-out;
  --transition-base: 200ms ease-out;
  --max-w-text: 720px;
  --max-w-grid: 960px;
  --max-w-feed: 1100px;
  --duration-stagger: 50ms;
  --duration-reveal: 200ms;
}
```

### 7.3 How a layout scopes them

Two-layer model:
1. **Attribute selector** — `:root[data-persona="..."]` (set on `<html>` by `PersonaLayout.astro`). One persona's tokens are active at a time; tokens cascade automatically.
2. **CSS layer order:** `@layer reset, neutral, persona, components;` — persona tokens override neutral; component CSS overrides persona.

### 7.4 Tailwind integration

Tailwind's `tailwind.config.ts` maps a small set of utility classes to CSS variables; this lets `bg-[color:var(--bg)]` work and means we don't need to write Tailwind colors per persona. We keep Tailwind's default palette intact for utility classes we don't theme (e.g. `text-red-500` for error states).

```ts
// tailwind.config.ts (excerpt)
export default {
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        fg: "var(--fg)",
        accent: "var(--accent)",
        rule: "var(--rule)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
};
```

## 8. Motion budget

| Pattern | Persona | Duration | Easing | Stagger | Reduced-motion fallback |
|---|---|---|---|---|---|
| Stagger reveal | Coder | 200ms per child | `ease-out` | 50ms | Static (no transform/opacity) |
| Tag-filter morph | Coder | 150ms | `ease-out` | — | Instant swap |
| Carousel drag | Traveler | native Embla | — | — | Snap-on-arrow-click only; drag disabled |
| Year-marker swap | Traveler | 120ms cross-fade | `ease-in-out` | — | Instant |
| Quote rotate | Curator | n/a (SSG) | — | — | n/a |
| Card cross-fade | Maker | 250ms | `ease-out` | — | Instant appear |
| Empty pulse | Maker | 2000ms loop | Tailwind default | — | Static |
| Tab pill morph | Chrome | View Transitions default (~250ms) | `ease` | — | Instant nav |
| LIVE green dot pulse | Chrome footer | 2Hz | linear | — | Static dot |

**`client:visible` boundary:** Before the IntersectionObserver fires, SSR has already rendered each component's HTML at full dimensions (skeletons for ProjectGrid; static slides for TravelTimeline; static empty placeholder for MakerGrid). When the island hydrates, Motion's `initial` state matches the SSR DOM (`opacity: 1` on already-visible items via `viewport: { once: true, margin: "-10%" }`), preventing layout shift or flash.

## 9. Tab transitions

### 9.1 Setup

`<ClientRouter />` in `PersonaLayout.astro`'s `<head>` (already shown §4.3). This enables Astro's native View Transitions across all four persona routes.

### 9.2 Morphing tab pill

The pill (`<span class="pill" transition:name="tab-pill" />`) is conditionally rendered only on the active tab. When the user clicks another tab, View Transitions API:
1. Snapshots the old pill's position/size
2. Navigates (instant — no spinner; SSG pages load fast)
3. Animates the new pill from old position/size to its new position/size

No JS beyond `<ClientRouter />` itself. The animation runs in the browser's compositor.

### 9.3 Per-route customization

`PERSONAS[i].transitionMode` controls cross-fade vs morph for the page content (not the pill, which always morphs):

- `morph` — default Astro behavior: old page slides out, new slides in
- `fade` — opt-in via `transition:animate="fade"` on `<main>`; used by Curator and Maker (quieter feel matching their content tone)

`PersonaLayout.astro` reads `persona.transitionMode` and applies `transition:animate="fade"` conditionally on `<main>`.

### 9.4 Fallback

When `document.startViewTransition` is undefined (Firefox without `dom.view-transitions.enabled`, older Safari < 18, very old Chrome), Astro's `<ClientRouter />` gracefully falls back to a standard SPA-style nav with no animation. Initial paint is still SSG'd HTML so there's no flash. No polyfill, no JS shim.

## 10. Implementation plan (phases)

### Phase A — Foundation refactor (~1–2 days)

1. Create `src/personas/registry.ts` per §4.1
2. Extract `src/layouts/PersonaLayout.astro` (chrome + ClientRouter + persona token link) per §4.3
3. Move v2's tokens out of monolithic `src/styles/tokens.css` into `src/styles/personas/coder.css`; leave the shared/neutral subset in `tokens.css` per §7.2
4. Create empty `src/styles/personas/{traveler,curate,made}.css` with the palettes from §7.1 (real values, even though the routes don't exist yet)
5. Extract `src/components/chrome/TopNav.astro` + `src/components/chrome/FooterStatus.astro`
6. Add Astro `<ClientRouter />` to PersonaLayout's head
7. Smoke test: `npm run build`; verify no regressions on existing routes

### Phase B — Coder tab refactor (~1 day)

1. Refactor `src/pages/index.astro` to render `<PersonaLayout personaId="coder" …>` and consume the new chrome
2. Build `<ProjectGrid />` + `<ProjectCard />` + `<TechChip />` per §5.1
3. Wire Motion stagger reveal + tag cross-filter state
4. Migrate existing project cards to the new component contract (no schema change to `projects` collection)
5. Lighthouse on `/` — target ≥95 Performance + Accessibility

### Phase C — Traveler tab (~2–3 days) — researcher's #1 priority

1. `npx shadcn@latest add carousel` → drops `src/components/ui/carousel.tsx` (verbatim shadcn source per researcher 2026-05-17)
2. `npm install embla-carousel-react embla-carousel-wheel-gestures`
3. Verify `embla-carousel-wheel-gestures` liveness — see §12 risks
4. Create `places` content collection per §6.1 + 3–5 starter `.md` entries (Lisbon, Tempe, Seattle, Pune)
5. Build `<TravelTimeline />`, `<Polaroid />`, `<YearMarker />`, `<NextStopCard />` per §5.2
6. Wire `api.on("select")` for sticky year-marker
7. Create `src/pages/traveler.astro` → `<PersonaLayout personaId="traveler" …>`
8. Lighthouse on `/traveler` — target ≥95

### Phase D — Curator tab (~1 day) — researcher's #3 priority (lowest effort)

1. Create `books` content collection per §6.2 + 1–2 starter `.md` entries
2. Build `<NowReading />`, `<QuoteRotator />`, `<FinishedGrid />` as pure Astro per §5.3
3. Create `src/pages/curate.astro` → `<PersonaLayout personaId="curate" …>`
4. Lighthouse on `/curate` — target ≥98 (no JS = trivial)

### Phase E — Maker tab (~0.5–1 day)

1. Create `builds` content collection per §6.3 (3 queued items, 0 shipped at launch)
2. Build `<MakerGrid />`, `<EmptyPlaceholder />`, `<BuildQueueList />` per §5.4
3. Wire AnimatePresence so first `shipped` entry triggers cross-fade
4. Create `src/pages/made.astro` → `<PersonaLayout personaId="made" …>`
5. Verify empty state feels intentional (not embarrassing)

### Phase F — Polish + verify (~1 day)

1. Lighthouse audit per persona route — target ≥95 Performance + Accessibility on all four
2. Run `astro build --analyze` to confirm ≤35 KB gz incremental JS total
3. Test reduced-motion: macOS System Settings → Accessibility → Display → Reduce motion; verify all 4 patterns degrade per §8 table
4. Test View Transitions: Chrome ✅, Safari 18+ ✅, Firefox (with and without `dom.view-transitions.enabled`); confirm graceful fallback
5. Mobile QA: iOS Safari (carousel touch drag), Android Chrome, Pixel emulation
6. No-JS test: disable JS in DevTools; visit all four routes; verify each shows something useful (Coder: project cards static; Traveler: native horizontal scroll-snap; Curator: full content; Maker: static grid)
7. Accessibility: keyboard nav across tabs and carousel; aria-current on active tab; focus rings visible

### Phase G — Cutover (~0.5 day)

1. Merge `v2` → `main`
2. Verify `https://ask149.github.io` resolves to new build
3. Confirm `.github/workflows/deploy-v2.yml` was updated to also accept `main` (or replaced with a new `deploy.yml`)
4. Confirm Jekyll preserved at `archive/jekyll-v1` (already done in v2 cutover plan)
5. Update LinkedIn / resume links if any deep-linked to v2-specific paths

**Total estimate:** 7–9 working days. Compatible with the post-departure timeline (Jul 15 / Aug 1 onward) but small enough to slot into a weekend if Ashish wants it live sooner.

## 11. Migration plan from v2

### What stays untouched
- Cloudflare Worker (`worker/`, KV, ULID events, denylist, bearer auth)
- `essays` and `projects` content collections (schemas and existing entries)
- `LiveFeed.tsx` React island (Coder persona embeds it unchanged)
- All easter-egg routes (`/agents`, `/sudo`, `/cost`)
- `/404` JSON-styled page
- v2's deploy workflow (extended in Phase G to deploy from `main` too)
- v2 design language (Newsreader + JetBrains Mono, warm copper accent — now scoped to Coder persona only)

### What gets refactored
- `src/pages/index.astro` — becomes Coder-specific (`PersonaLayout personaId="coder"`)
- `src/styles/tokens.css` — split: neutral tokens stay; persona-specific tokens move into `src/styles/personas/coder.css`
- `Base.astro` — replaced by `PersonaLayout.astro` for persona routes; kept as-is for off-nav pages that don't need persona theming (or deprecated entirely if everything migrates)

### What gets added
- 3 new routes: `/traveler`, `/curate`, `/made`
- `src/personas/registry.ts` (single source of truth for persona metadata)
- 3 new content collections (`places`, `books`, `builds`) + Zod schemas
- 4 new component folders: `src/components/{coder,traveler,curate,made}/`
- 4 new token files: `src/styles/personas/{coder,traveler,curate,made}.css`
- `src/components/chrome/{TopNav,FooterStatus}.astro`
- `src/components/ui/carousel.tsx` (from `shadcn@latest add carousel`)
- `npm` deps: `motion`, `embla-carousel-react`, `embla-carousel-wheel-gestures`
- `/changelog` page + content collection (optional — could reuse `essays`)

### What gets deleted
- Nothing. `v2` branch stays git-restorable.

## 12. Risks + mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `motion` package rename — old imports `framer-motion` break | Low | Medium | Researcher confirmed (2026-05-17) the package was renamed `framer-motion` → `motion` in Nov 2024; import paths are `motion/react` (not `motion`); pin exact version; one global find-replace if anything references the old name |
| `embla-carousel-wheel-gestures` plugin abandoned | Medium | Low | Verify with `npm view embla-carousel-wheel-gestures` before depending on it: check last publish date < 12 months and weekly downloads > 5k. If stale: vendor the plugin (it's ~80 lines) or drop wheel-gesture support (touch + arrow keys still work) |
| View Transitions API unsupported (Firefox under flag) | Medium | Low | Astro's `<ClientRouter />` falls back to instant nav with no animation; no JS polyfill needed; the pill morph degrades to instant repaint — acceptable |
| `prefers-reduced-motion` not respected by some path | Low | Medium | Motion auto-respects; Tailwind `motion-safe:` prefix used for `animate-pulse`; QA step explicitly enables Reduce Motion and walks all 4 personas in Phase F |
| Persona registry malformed (typo in `tokensHref`, missing entry, wrong collection name) | Low | High | TypeScript `as const` + the `PersonaId` literal union catches most errors at build; `getPersonaById` throws on miss (loud failure better than silent); add a build-time assertion in `astro.config.mjs` that every persona's route has a matching `src/pages/...` file |
| Content collection schema migration breaks earlier entries | Medium | Medium | Zod `.optional()` and `.default()` for all new fields; never remove a field — deprecate by ignoring; document schema version at top of `src/content/config.ts` |
| Zod version compatibility (Astro pins its own Zod) | Low | Medium | Don't `npm install zod` directly — import from `astro:content`; Astro re-exports its bundled Zod |
| Stitch MCP still broken — can we lean on it for mockups? | High | Zero (for this spec) | Spec deliverable doesn't depend on Stitch; UI was designed via researcher + Ashish's references (Paco, Rauno, Karpathy, Simon Willison) — Stitch breakage is a separate issue |
| Bundle budget overrun | Low | Medium | `astro build --analyze` after Phase C and again in Phase F; if over 35 KB gz, candidates to drop: `embla-carousel-wheel-gestures` first, then consider dropping Motion's `<AnimatePresence>` in Maker (CSS-only fallback) |
| Tab pill `transition:name` collision across personas | Very Low | Low | The name is fixed (`tab-pill`) and rendered once per page; View Transitions are page-scoped, so no collision possible |
| Carousel SSR mismatch (Embla hydration vs SSR DOM) | Medium | Medium | shadcn's carousel handles SSR safely; we render slides server-side as a flex row; on hydration Embla takes over without re-mounting children — verified pattern per shadcn docs |
| GitHub Pages 404 on client-side nav into a non-existent route | Low | Low | All persona routes are SSG'd (real files); `<ClientRouter />` only intercepts links pointing at existing routes; external links open normally |
| Mobile carousel — touch drag conflicts with vertical page scroll | Medium | High | Embla's `dragFree: true` + horizontal axis only; iOS Safari test in Phase F is non-negotiable |
| Persona accent color contrast (esp. Curator oxblood on cream) | Low | Medium | Run axe-core or Lighthouse a11y on every persona route; target WCAG AA on body text (4.5:1) and AAA on critical text where possible; brass `--accent-secondary` reserved for non-text accents only |

## 13. Success metrics

- **Lighthouse ≥ 95** on Performance + Accessibility for ALL four persona routes (Chrome stable, mobile emulation, 4G throttle)
- **Bundle budget:** ≤ 35 KB gz incremental JS across all 4 personas (estimate: ~31 KB)
- **2-click reachability:** every persona is reachable in ≤ 2 clicks from any page (top nav = 1 click; from a deep `/projects/[slug]` = nav back, nav forward = 2)
- **Mobile carousel:** drag works on iOS Safari 18+ and Android Chrome; tested manually in Phase F
- **No-JS usability:** each persona route shows something useful with JavaScript disabled (Coder static cards, Traveler native horizontal scroll-snap, Curator full content, Maker static grid)
- **Persona-add cost:** adding a 5th persona (e.g., "Writer", "Cook") can be done in **< 4 hours**: 1 registry entry + 1 tokens file + 1 content collection + 1 component folder + 1 page file. This is the modularity-keystone success metric.
- **No regressions on v2 win:** LIVE feed, manifesto essay, easter eggs all still work; recruiter-credibility signal from v2 stays intact

## 14. Open questions (not blocking; resolve during build)

1. Does `/changelog` reuse the `essays` collection or get its own? (Lean: its own — entries are shorter, more like commits than essays.)
2. Should Curator's `<QuoteRotator />` recompute on the client (`<script>` block on `DOMContentLoaded`) for true daily rotation, or stay at build-cadence-only? (Lean: build-cadence; redeploy weekly anyway.)
3. Maker's empty state — show the queue list inline below the empty placeholder, or hide queue until first shipped build exists? (Lean: show queue; it's the only signal.)
4. Should the Traveler timeline reverse direction in RTL locales? (Defer; site is English-only for now.)
5. Persona-specific 404s vs the shared JSON 404? (Lean: shared — consistency wins over cleverness.)
6. View-transitions `transition:animate="fade"` duration tuning — 200ms or 300ms? (Test in Phase F.)
7. Should each persona expose its content collection as a JSON API (`/places.json`, `/books.json`)? (Defer; nice for Tools-section / Obsidian-import; no current consumer.)
8. Light/dark for non-Coder personas — Maker is already dark; do Traveler and Curator get dark variants? (Defer; light-only at launch; can add per-persona dark tokens later — registry doesn't need to change.)
9. Should `<Polaroid />` rotation jitter be deterministic (hash slug) or random per-render? (Spec'd as deterministic to keep SSR/hydration matched.)

## 15. Self-review log

- ✅ **Placeholders / TODOs:** Self-grepped this document for `TODO` and `TBD` — zero matches. Open questions are explicitly flagged in §14 as non-blocking.
- ✅ **Internal consistency:**
  - §4 registry shape (`PersonaDef`) matches the per-persona token file paths in §7.1 (`tokensHref: 'personas/<id>.css'`)
  - §5 component prop interfaces (`CollectionEntry<"places">`, `CollectionEntry<"books">`, `CollectionEntry<"builds">`) match the collection names defined in §6
  - §6 Zod schema field names (`yearMonth`, `status`, `priority`, `shippedDate`, `quote.text`) match the field accesses described in §5 component contracts (`TravelTimeline` sorts by `yearMonth`; `QuoteRotator` reads `quote.text`; `MakerGrid` filters by `status` and sorts by `shippedDate`)
  - §8 motion table covers every interactive pattern named in §5
  - §10 phases reference exactly the deliverables introduced in §4–§9
- ✅ **Scope:** Single implementation cycle (Phase A–G, 7–9 working days). Decomposition not required; phases are independently shippable on `v2` branch with feature flags if needed (PersonaLayout can ship Coder-only first, then add routes incrementally).
- ✅ **Ambiguity:** Each decision in §2 has a "Rationale" column. The Curator quote-rotation cadence (deterministic-by-build vs client-daily) is explicitly resolved in §5.3 (chosen: build-cadence). The 5th persona's location in the nav order is explicitly deferred to whoever adds the 5th persona — registry's array order is the single source of truth.
