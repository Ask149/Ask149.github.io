# Portfolio v4 — Hybrid-Atelier Multi-Persona Design (spec)

**Date:** 2026-05-17
**Supersedes:** `2026-05-17-portfolio-v3-multi-persona-design.md` (v3, publication-grade editorial — visually rejected)
**Status:** Design locked after the `vi-hybrid-*` mockup round. Implementation pending a `writing-plans` pass, then `executing-plans`.
**Owner:** Ashish Kshirsagar
**Repo:** `Ask149/ask149.github.io` (work branch: `v4`; cutover target: `main`)
**Visual ground truth (LOCKED):** `~/Projects/active/ask149.github.io/.superpowers/static/aesthetics/`
- `vi-hybrid-workshop.html` — §1 Workshop (Coder)
- `vi-hybrid-travel.html` — §2 Voyages (Traveler) — *the signature page*
- `vi-hybrid-curio.html` — §3 Curio (Curator)
- `vi-hybrid-atelier.html` — §4 Atelier (Maker)
- `index.html` — mockup index, with v's annotated notes

> Read those four pages before reading this spec. They are the contract. This document tells the build agent how to ship them.

---

## 1. Why we're doing this (v4)

v3 was publication-grade editorial — clean, Newsreader-bodied, restrained. The user rejected it after a week of mockup iteration as "too magazine, not enough me." v4 is the **hybrid-atelier** direction that finally got an unambiguous yes: an Anton-headline / Cormorant-Garamond-body / JetBrains-Mono-meta / Caveat-accent type system shared across four persona pages, each with its own background, accent color, and decorative motif — collectively a **day-cycle** (morning → afternoon → evening → late night). The plumbing v3 designed (persona registry, content collections, layout chrome, View Transitions, `client:visible` islands, Cloudflare-Worker feed) is right and survives mostly unchanged. What gets thrown out is every pixel of the v3 visual layer plus the v3 Traveler pattern (shadcn carousel) — Voyages is rebuilt from scratch as a fixed-position world-map + floating-polaroid slideshow + bottom timeline carousel + diary card. Voyages is the showcase page; the other three personas are designed to support it without competing.

This spec is an **extension+rebuild**: v3's IA, modularity keystones, and stack carry forward. The presentation layer, the Traveler interaction model, the resume route, and a new AI-paragraph generation script are net-new.

## 2. Decisions locked

| # | Decision | Value | Rationale |
|---|---|---|---|
| 1 | Inheritance from v3 | Astro 4.10 + React islands + TS, Cloudflare Worker feed, `LiveFeed.tsx`, `essays` + `projects` collections, persona registry pattern, content-collection idea | v4 is a visual rebuild on a working spine |
| 2 | Persona count at launch | 4 — Workshop / Voyages / Curio / Atelier | Same four surfaces as v3; renamed labels match the hybrid aesthetic |
| 3 | Route shape | `/` (Workshop), `/traveler`, `/curate`, `/made`, plus new `/resume` | Routes preserved from v3 so any inbound links still resolve; the URL semantics are still Coder/Traveler/Curator/Maker even though the *labels* read Workshop/Voyages/Curio/Atelier |
| 4 | Typography (shared) | Anton (display) · Cormorant Garamond + italic (body) · JetBrains Mono (meta / labels) · Caveat (hand-lettered accents) | All four pages load the same four Google Fonts — single `<link>` shared via layout |
| 5 | Day-cycle palette (per-persona bg + accent) | Workshop: pale-sage gradient + copper; Voyages: warm-cream gradient + red; Curio: parchment gradient + oxblood/brass; Atelier: deep-navy gradient + amber | See §2 of brief + §7 below; one CSS file per persona |
| 6 | Texture / decoration per page | Workshop: 30px graph-paper grid + faint engineering schematic SVG; Voyages: graph-paper (lighter) + world-map SVG + floating polaroids + map pins; Curio: vertical book-spine stripes + ornamental SVG flourishes; Atelier: cyan blueprint grid + technical drawings SVG + amber radial glow top-right | Mockups define exact opacity/sizing; copy literally |
| 7 | Voyages interaction model | Fixed-position world-map SVG bg · animated red map pins at visited places · 7 floating polaroid `.photo-float` cards (12s `float-cycle` keyframe, staggered delays) · mid-page diary card with A.K./AI toggle · fixed bottom timeline carousel | This is the showcase; see §8 |
| 8 | Shared chrome | TopNav (Anton brand + 4 tabs + `↓ resume` link + version stamp) and FooterStatus (single line) — both rebuilt for hybrid aesthetic | One `PersonaLayout.astro` wraps every persona page |
| 9 | Resume page (NEW) | `/resume` — HTML render of resume in hybrid aesthetic + three PDF download buttons (SWE primary, MLE, Systems) | Recruiter-credibility win; PDFs in `public/resume/` |
| 10 | AI paragraph generation (NEW) | `scripts/generate-paragraphs.ts` — build-time Node script calling Anthropic API (Claude Sonnet) per place entry; idempotent; cached in the `.md` itself | One paragraph per place, A.K. or AI marker; ~$0.01 / place |
| 11 | Photo workflow (NEW) | File-based: user drops Google-Photos exports into `public/photos/<place-slug>/`, build-time script reads filenames, Voyages picks 5–10 at random per active trip | No Google Photos API in v4.1 — deferred to v4.2; documented in §11 + §16 |
| 12 | Hydration strategy | `client:visible` for any React island; Workshop's LiveFeed + Voyages' diary/timeline state are the only hydration sites; Curio + /resume are zero-JS pure Astro | Above-fold paint stays HTML-only; LCP locked to the Anton headline |
| 13 | View Transitions | Astro `<ClientRouter />` for tab nav; tab-pill morph via `transition:name="tab-pill"` | Carried verbatim from v3 §9 |
| 14 | Modularity keystone | Persona registry at `src/personas/registry.ts` (v3 file survives; only labels/blurb/tokensHref strings update) | Adding a 5th persona = registry entry + tokens file + component folder + (optional) content collection — still ≤4hr |
| 15 | Theme tokens | One CSS file per persona under `src/styles/personas/<id>.css` exposing `--bg-from`, `--bg-to`, `--fg`, `--muted`, `--accent`, `--rule`, `--surface`, plus persona-specific extras (e.g. Curio `--brass`, Atelier `--amber`) | Mirrors mockup `:root` blocks 1-for-1 |
| 16 | Bundle budgets | `/` `/traveler` `/made` ≤ 70 KB gz (React runtime is fixed at ~42.7 KB so this is realistic); `/curate` ≤ 10 KB gz (zero JS); `/resume` ≤ 8 KB gz; Lighthouse perf ≥ 90 and a11y ≥ 95 on all routes | Revised from v3's overly optimistic 35 KB target; honest |
| 17 | Reduced motion | `@media (prefers-reduced-motion: reduce)`: kill `float-cycle`, kill pin pulse, snap timeline (no smooth scroll), hold one polaroid statically per trip | Mockups don't address this; building it in from day 1 |
| 18 | Migration plan | v3 work tree → archive branch `v3-publication-grade` (user commits); fresh `v4` branch off `main`; persona components and persona token CSS get replaced wholesale; content schemas extended | See §13 |
| 19 | Cutover | Merge `v4` → `main` after Phase H polish; v3 archive branch + old Jekyll branch both preserved | Same approach as v2/v3 |
| 20 | Branding strings | TopNav brand reads **ASHISH K.** in Anton; tab labels lowercase mono: `workshop · voyages · curio · atelier`; version stamp `ver. XIV · §N` per page | Direct from mockups |

## 3. Information architecture

### 3.1 Route map

| Route | Persona | Type | Hydration |
|---|---|---|---|
| `/` | §1 Workshop (Coder) | Persona landing | `client:visible` (LiveFeed + ProjectGrid) |
| `/traveler` | §2 Voyages (Traveler) | Persona landing | `client:visible` (FloatingPhotos, Timeline, DiaryCard) |
| `/curate` | §3 Curio (Curator) | Persona landing | none — pure Astro |
| `/made` | §4 Atelier (Maker) | Persona landing | `client:visible` (only if AnimatePresence exists; else pure Astro) |
| `/resume` | shared (NEW v4) | HTML render + PDF downloads | none — pure Astro |
| `/feed` `/feed.json` | shared | Off-nav / API proxy | Inherits v3 |
| `/now` `/uses` | shared | Off-nav | Inherits v3 |
| `/writing` `/writing/[slug]` | shared | Essay index + MDX render | Inherits v3 |
| `/projects` `/projects/[slug]` | shared | Project deep-dives | Inherits v3 |
| `/changelog` | shared | Off-nav (footer link) | static |
| `/agents` `/sudo` `/cost` | shared | Easter eggs | Inherits v3 |
| `/404` | shared | JSON-styled error | Inherits v3 |

The four primary persona routes plus `/resume` are the **only top-nav-discoverable surfaces**. Everything else is off-nav, linked from footer or essay content. No mega-menu.

### 3.2 Per-persona content inventory (mapped to mockups)

**§1 Workshop (`/`)** — see `vi-hybrid-workshop.html`
- Top strip with `● LIVE` feed-strip showing one most-recent agent event + link `/changelog → +47 words today`
- Hero: eyebrow `~ §1 · the workshop ~` · `VIBE-CODING / WITH 4 AGENTS.` (line 2 gradient span) · italic Cormorant sub · 3-stat meta row
- `→ §1.2 · selected work` projects grid — 3 cards (`001 · ACTIVE`, `002 · SHIPPED`, `003 · ONGOING`) with Cormorant title, italic Cormorant desc, Mono chips, Caveat scribble `~ shipped today` rotated -2deg on featured card
- Footer: 3-column Mono status line

**§2 Voyages (`/traveler`)** — see `vi-hybrid-travel.html` — **the showcase**
- Fixed world-map SVG bg (continents stylized, dashed latitude guides)
- 4 fixed map pins (Seattle 720d, Tempe 670d, SF 95d, Pune home) with pulsing rings
- 7 floating polaroids (`.pf-1` … `.pf-7`) with staggered animation-delays (0s, 2.5s, 5s, 7.5s, 1.2s, 4s, 8.5s) cycling on a 12s `float-cycle` keyframe
- Top strip same as Workshop, `voyages` tab active
- Hero: eyebrow `~ §2 · the voyages ~` · `TRAVEL / DIARIES.` · italic sub · 4-stat meta (places, photos, countries, last)
- Mid-page **diary card** — current trip (`SEATTLE.`) in Anton 3rem · dates italic · paragraph in Cormorant 1.1rem 1.65 line-height · A.K./AI toggle + stats footer
- Fixed bottom **timeline carousel** with 8 trips, active one (`Seattle 2024 · Microsoft`) gets a double-ring pulse

**§3 Curio (`/curate`)** — see `vi-hybrid-curio.html`
- Hero: eyebrow `~ §3 · the cabinet of curiosities ~` · `<em>Curio</em> / & KEEPING.` (mixed Cormorant italic + Anton — the only persona where the headline uses italic) · italic sub · 3-stat meta
- `→ §3.1 · now reading` card — 110px cover + info column with title (Cormorant 1.8rem bold), italic author, oxblood-left-border block-quote, brass `quote-meta` page+progress line
- `→ §3.2 · recently finished` list — 3 rows with Mono numbers in brass, Cormorant title + italic author, Mono rating + month in brass
- Ornamental SVG flourishes top-left + bottom-right corners (rotated 180deg)
- Footer: same 3-col status line

**§4 Atelier (`/made`)** — see `vi-hybrid-atelier.html`
- Hero: eyebrow `~ §4 · the workbench, late ~` · `MADE / BY HAND.` · italic sub · 3-stat meta (0 shipped / 3 queued / 1 on the bench)
- `→ §4.1 · current builds` — 3 dashed-border placeholder cards with tiny inline SVG dashed-icon (keyboard / pen-rest / circuit) and `FIG.N · placeholder` mono caption. When a build ships, the dashed card becomes solid amber-bordered with gradient bg
- `→ §4.2 · build queue` — list of 3 queued items (P7, P6, P5) with priority chip · Cormorant title · italic Cormorant blurb · Mono status right-aligned
- Background: blueprint grid + amber radial glow top-right + faint technical-drawings SVG (split keyboard, pen rest, weather station) at 12% opacity
- Footer same

**`/resume`** (NEW)
- Top strip identical to other pages, `↓ resume` link in active state
- Hero: eyebrow `~ the résumé ~` · `ASHISH / KSHIRSAGAR.` · italic sub `The longer story is in the four sections above. This is the one-page version.`
- **Three big PDF download buttons** stacked or row-aligned, each labeled `↓ SWE.pdf` (primary, copper-bg) / `↓ MLE.pdf` / `↓ Systems.pdf` in JetBrains Mono uppercase, ~0.8rem with file-size suffix in muted color
- **HTML rendering** of resume content below (sectioned: Now, Experience, Education, Selected Work, Skills, Contact) — Cormorant body, Anton section headers, Mono dates and locations
- Pure SSG, no JS, no client-side rendering of any kind

### 3.3 Shared chrome (rebuilt for v4)

**TopNav** (one `TopNav.astro` rendered by `PersonaLayout.astro`):
- Layout: `display:flex; justify-content:space-between; padding:1.2rem 2.5rem` with `backdrop-filter: blur(8px)` and a `rgba(...,0.7)` background tinted by `--bg-from`
- Left: `<span class="brand">ASHISH K.</span>` — Anton 0.95rem letter-spacing 0.05em, color `var(--fg)`
- Middle: 4 tabs, `display:flex; gap:1.5rem`, Mono 0.65rem uppercase letter-spacing 0.18em. Inactive `color: var(--muted)`. Active `color: var(--accent); border-bottom: 1px solid var(--accent); padding-bottom: 0.1rem`. Tabs link to `/`, `/traveler`, `/curate`, `/made`
- Right cluster: `↓ resume` link (Mono, accent color) + `ver. XIV · §N` stamp (Mono, muted)
- The active tab is detected from `Astro.url.pathname` against the registry — no manual flag per page

**FooterStatus** (one `FooterStatus.astro`):
- Three Mono columns: `set in Anton · Cormorant Garamond · JetBrains Mono` · `last entry · <relative time>` (from git or content collection mtime) · `§N / p. <pseudo-page>` where the page number is a fun computed string per persona (Workshop=47, Voyages=82, Curio=23, Atelier=7 — purely cosmetic, see registry)
- Workshop also embeds the `feed-strip` ABOVE the hero (not part of the footer) — `● LIVE` + last agent event + link to `/changelog`. That's a separate component (`LiveStrip.astro`), only mounted on `/`

## 4. The persona registry (modularity keystone — UNCHANGED FROM v3)

The v3 file `src/personas/registry.ts` survives. Only the **strings** change. Adding a 5th persona is still: (a) registry entry, (b) tokens CSS file, (c) component folder, (d) optional content collection. Nothing else.

```ts
// src/personas/registry.ts — v4 updates (TYPE shape from v3 unchanged)

export const PERSONAS = [
  {
    id: "coder",
    sectionNumber: 1,
    label: "workshop",                // v4: lowercase, hybrid-aesthetic
    longLabel: "the workshop",        // for hero eyebrow `~ §1 · the workshop ~`
    route: "/",
    blurb: "shipping with agents in parallel",
    tokensHref: "personas/coder.css",
    accentHex: "#8b5a2a",             // copper — referenced by hover states in shared chrome
    pseudoPage: 47,
    collection: "projects",
    transitionMode: "morph",
    heroLoader: () => import("../components/coder/WorkshopHero.astro"),
  },
  {
    id: "traveler",
    sectionNumber: 2,
    label: "voyages",
    longLabel: "the voyages",
    route: "/traveler",
    blurb: "a map of the places I keep returning to in pieces",
    tokensHref: "personas/traveler.css",
    accentHex: "#c64a3c",
    pseudoPage: 82,
    collection: "places",
    transitionMode: "morph",
    heroLoader: () => import("../components/traveler/VoyagesHero.astro"),
  },
  {
    id: "curate",
    sectionNumber: 3,
    label: "curio",
    longLabel: "the cabinet of curiosities",
    route: "/curate",
    blurb: "books, quotes, the small obsessions",
    tokensHref: "personas/curate.css",
    accentHex: "#7a2828",
    pseudoPage: 23,
    collection: "books",
    transitionMode: "fade",
    heroLoader: () => import("../components/curate/CurioHero.astro"),
  },
  {
    id: "made",
    sectionNumber: 4,
    label: "atelier",
    longLabel: "the workbench, late",
    route: "/made",
    blurb: "physical things — soldered, sawn, sketched",
    tokensHref: "personas/made.css",
    accentHex: "#d97e3f",
    pseudoPage: 7,
    collection: "builds",
    transitionMode: "fade",
    heroLoader: () => import("../components/made/AtelierHero.astro"),
  },
] as const;
```

> **Numbering note:** v3 used `§1 / §2 / §3 / §6` (the `§6` was a wink at Maker being aspirational). v4 collapses to `§1 / §2 / §3 / §4` because the mockups use it; cleaner and less self-conscious. `[orchestrator's call]`

`getPersonaByRoute()` and `getActivePersona()` helpers are unchanged from v3.

## 5. Component contracts

Every component below lives under `src/components/<persona-id>/`. Components from sibling personas may **never** import each other; cross-persona imports trip an ESLint rule (`no-restricted-imports` configured in §10 phases).

### 5.1 Shared chrome — `src/layouts/PersonaLayout.astro`

```ts
interface Props {
  personaId: PersonaId;          // looked up against the registry
  title: string;                  // <title>
  description?: string;           // <meta name=description>
  showLiveStrip?: boolean;        // Workshop only; defaults to id === "coder"
  ogImage?: string;
}
```

Renders: `<html data-persona={personaId}>` (so the `:root[data-persona="..."]` CSS scoping in tokens files binds) → `<head>` with Google-Fonts preconnect + the four font families in a single stylesheet link → `<body>` containing `<TopNav>` → optional `<LiveStrip>` → `<slot />` → `<FooterStatus>` → `<ClientRouter />` for view transitions.

### 5.2 `TopNav.astro` and `FooterStatus.astro`

```ts
// TopNav.astro
interface Props {
  activeId: PersonaId;
}
// Reads PERSONAS from registry, renders 4 anchors + resume link + version stamp.
// No props beyond activeId.

// FooterStatus.astro
interface Props {
  activeId: PersonaId;
  lastEditISO?: string;  // from git or content mtime; falls back to build date
}
```

### 5.3 `LiveStrip.astro` (Workshop only)

```ts
interface Props {}
// Server-renders a placeholder ("● LIVE · loading…") and mounts a tiny `client:idle` island
// that pulls one most-recent event from /feed.json (Cloudflare Worker, unchanged from v3).
// Reuses LiveFeed.tsx internals but with a `compact` prop showing only the latest event.
```

Reference: `vi-hybrid-workshop.html` lines 75–79.

### 5.4 Workshop — `src/components/coder/`

`WorkshopHero.astro` — props `{ stats: { activeProjects: number; events: number; commits: number } }`. Renders eyebrow + Anton headline + italic sub + meta row. Matches mockup lines 82–90.

`ProjectGrid.astro` — props `{ projects: CollectionEntry<"projects">[] }`. Server-renders the 3-col card grid (`grid-template-columns: repeat(3, 1fr); gap: 1.2rem`). Each card uses `.proj-num`, `.proj h3`, `.proj .desc`, `.proj .chips` per mockup lines 33–40. The first card may include a `.scribble` Caveat overlay (rotated -2deg) — driven by a `featured?: boolean` flag in project frontmatter.

`TagFilter.tsx` (`client:visible`) — React island carried over from v3; small chip strip that toggles `data-state="on|off"` on `.chip` elements via DOM (no re-render). Keep it under 4 KB gz.

### 5.5 Voyages — `src/components/traveler/`

`VoyagesHero.astro` — props `{ stats: { places: number; photos: number; countries: number; last: string } }`. Mockup lines 136–146.

`WorldMap.astro` — pure SVG, no props. Inlined directly from `vi-hybrid-travel.html` lines 84–106 (continents path data + latitude guides). `position: fixed; inset: 0; z-index: 0; opacity: 0.55`.

`MapPins.astro` — props `{ pins: Array<{ slug: string; label: string; coords: { leftPct: number; topPct: number }; duration?: string }> }`. For v4.1, **coords are hand-picked per place entry** (frontmatter `mapCoords: { leftPct: 14, topPct: 33 }`). Optional `geo: [lat, lng]` field is reserved for v4.2 auto-projection.

`FloatingPhotos.tsx` (`client:visible`) — props `{ photos: Array<{ src: string; caption: string; slotIndex: 1..7 }>; activePlaceSlug: string }`. Renders 7 `.photo-float` divs with the `pf-N` class to inherit position/rotation/animation-delay from the persona CSS. Each div contains `<img class="img" src={src} loading="lazy">` and `<div class="cap">{caption}</div>`. The component is "JS" only because it picks photos from a manifest at hydration time — the animation itself is pure CSS `float-cycle 12s ease-in-out infinite`. Photo selection: pick 7 from the active place's `public/photos/<slug>/` folder if it has ≥7, otherwise spill into adjacent trips. See §8.

`DiaryCard.tsx` (`client:visible`) — props `{ place: CollectionEntry<"places">; mode: "auto" | "static" }`. Renders the mid-page card (mockup lines 149–158). The A.K./AI toggle is **visual only in v4.1** — it shows which mode the stored paragraph was authored in (see §10). State: `activePlaceSlug` is shared with `Timeline` via a tiny event-emitter (no Redux/Zustand — just a `CustomEvent('voyages:select', {detail: slug})` dispatched on `document`).

`Timeline.tsx` (`client:visible`) — props `{ trips: CollectionEntry<"places">[] }`. Renders the fixed-bottom horizontal scroll-snap carousel (mockup lines 161–173). Click on a trip dispatches `voyages:select` with that slug; `DiaryCard` listens. Active trip detection: `intersectionObserver` watching each `.trip` element against the timeline track center.

```ts
// shared event protocol (Voyages-internal only)
interface VoyagesSelectEvent extends CustomEvent<{ slug: string }> {}
document.addEventListener("voyages:select", (e: VoyagesSelectEvent) => { ... });
```

### 5.6 Curio — `src/components/curate/`

All pure Astro, **zero JS budget**.

`CurioHero.astro` — props `{ stats: { booksThisYear: number; onShelf: number; current: string } }`. Notable: the `<h1>` mixes an inline Cormorant italic `<em>` with the Anton wordmark (`<em>Curio</em><br/><span>& KEEPING.</span>`). See mockup line 87.

`NowReading.astro` — props `{ book: CollectionEntry<"books"> }`. Renders the 110px-cover-plus-info-column card (mockup lines 96–107). Cover is either `book.data.cover` (Astro image) or the fallback Cormorant-italic placeholder card (`<div class="nr-cover"><div class="title">…</div></div>`). The block-quote pulls `book.data.quote.text` and `book.data.quote.page`.

`FinishedList.astro` — props `{ books: CollectionEntry<"books">[] }`. Renders the 3-row list (mockup lines 109–116). Mono number + Cormorant title with italic author span + brass-colored rating+date.

`OrnamentCorners.astro` — pure inline SVG, no props. Two `.ornament` divs (top-left, bottom-right rotated 180deg) carrying flourish paths from mockup lines 51–71.

### 5.7 Atelier — `src/components/made/`

`AtelierHero.astro` — props `{ stats: { shipped: number; queued: number; onBench: number } }`. Mockup lines 83–92.

`BackgroundSchematic.astro` — pure SVG, no props. Inlined technical-drawings (split keyboard, pen rest, weather station) from mockup lines 48–69, at 12% opacity.

`BuildPlaceholders.astro` — props `{ builds: CollectionEntry<"builds">[] }`. Renders the 3-card grid. For each card slot: if a corresponding shipped build exists (`status === "shipped"`), render `<ShippedCard build={…}>` with amber border + gradient; otherwise render the dashed placeholder with its dashed-icon SVG and `FIG.N · placeholder` caption.

`BuildQueue.astro` — props `{ queued: CollectionEntry<"builds">[] }`. Renders the priority-sorted list (mockup lines 118–125). 4-column grid: `60px 1fr 2fr 100px`.

> No React island at launch — Atelier ships as pure Astro. Once a build ships, the dashed → solid transition can be enhanced with `motion`'s `<AnimatePresence>` (deferred to v4.2). `[orchestrator's call]`

### 5.8 Resume — `src/pages/resume.astro` + `src/components/resume/`

`ResumeHero.astro` — props `{ name: string; tagline: string }`. Same hero scaffold as personas, neutral accent (copper-ish — use Workshop's `--accent` so chrome stays consistent).

`PDFDownloads.astro` — props `{ variants: Array<{ id: "swe"|"mle"|"systems"; label: string; href: string; sizeKB: number; primary?: boolean }> }`. Renders three `<a download>` buttons. Primary (SWE) gets `background: var(--accent); color: #fefdf8`. Secondaries get `border: 1px solid var(--rule); background: var(--surface)`. Each button shows: arrow-down glyph + label (`SWE.pdf` etc.) in JetBrains Mono uppercase + size suffix (`· 142 KB`) in muted color.

`ResumeBody.astro` — props `{ data: ResumeData }` where `ResumeData` is a typed object with sections: `now`, `experience`, `education`, `selectedWork`, `skills`, `contact`. The source of truth is **`src/content/resume.ts`** — a single typed TS file the user maintains by hand (NOT parsed from LaTeX). Anton section headers, Cormorant body, Mono dates+locations. Each `experience` entry has: company / title / dates / location / 2–4 bullet lines.

```ts
// src/content/resume.ts
export interface ResumeData {
  name: string;
  tagline: string;
  now: string;                     // 1-paragraph "what I'm doing right now"
  experience: Array<{
    company: string;
    title: string;
    dates: string;
    location: string;
    bullets: string[];
  }>;
  education: Array<{ school: string; degree: string; dates: string; honors?: string }>;
  selectedWork: Array<{ title: string; url?: string; blurb: string }>;
  skills: { primary: string[]; secondary: string[] };
  contact: { email: string; github: string; linkedin: string; twitter?: string };
}

export const resume: ResumeData = { /* user-maintained */ };
```

> **Why not parse `resume_swe.tex`?** LaTeX parsing is fragile, and the SWE/MLE/Systems PDFs already differ substantively. The HTML resume is the *one* canonical web-readable version (SWE-leaning), and the PDFs are the per-variant artifacts.

## 6. Content collection schemas

`essays` and `projects` are unchanged from v3. The three v3-introduced collections get extended for v4.

### 6.1 `places` (extended)

```ts
// src/content/config.ts
const places = defineCollection({
  type: "content",
  schema: ({ image }) => z.object({
    // ── v3 fields ─────────────────────────────────────────────
    title: z.string(),
    country: z.string(),
    countryCode: z.string().length(2),
    airportCode: z.string().length(3).optional(),
    yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    cover: image().optional(),
    coverAlt: z.string().default(""),
    durationDays: z.number().int().positive().optional(),
    reason: z.enum(["leisure","work","transit","family","wedding"]).default("leisure"),
    favorite: z.boolean().default(false),
    draft: z.boolean().default(false),

    // ── v4 additions ──────────────────────────────────────────
    /** Build-time AI-generated or hand-written reflective paragraph (100–150 words). */
    paragraph: z.string().optional(),
    /** Author marker — informs the A.K./AI visual toggle in DiaryCard */
    paragraphAuthor: z.enum(["ak", "ai"]).optional(),
    /** Folder under public/photos/ — defaults to entry slug if omitted */
    photoFolder: z.string().optional(),
    /** Hand-tuned (leftPct, topPct) on the world-map SVG; required if you want a pin */
    mapCoords: z.object({ leftPct: z.number(), topPct: z.number() }).optional(),
    /** Optional caption template for floating polaroids ("market run", "first ferry", etc.) */
    photoCaptions: z.array(z.string()).optional(),
    /** Optional real lat/lng — reserved for v4.2 auto-projection */
    geo: z.tuple([z.number(), z.number()]).optional(),
  }),
});
```

Sort: `yearMonth` desc (most-recent first in the bottom timeline scrolls L→R; *active* trip is the one with the latest `yearMonth` unless overridden by URL hash `#trip=<slug>`).

### 6.2 `books` (unchanged from v3)

See v3 §6.2. No v4 changes.

### 6.3 `builds` (unchanged from v3 — but bench state added)

```ts
// add to the enum:
status: z.enum(["queued", "building", "shipped", "abandoned", "on-bench"]),
```

`on-bench` powers the Atelier hero stat `1 on the bench` and shows a distinct icon in `BuildPlaceholders`.

## 7. Theming + tokens (UPDATED for v4)

Each persona owns one file. All four use the same 7-token shape (`--bg-from`, `--bg-to`, `--fg`, `--muted`, `--accent`, `--rule`, `--surface`) plus persona extras. Tokens are scoped via `:root[data-persona="<id>"]` so the `PersonaLayout` sets `data-persona` on `<html>` and the correct file is loaded by `tokensHref`.

### 7.1 `src/styles/personas/coder.css` (Workshop)

```css
:root[data-persona="coder"] {
  --bg-from: #e8e5d8;
  --bg-to: #d8d3c0;
  --fg: #1f2418;
  --muted: #5a5848;
  --accent: #8b5a2a;        /* copper */
  --rule: rgba(31, 36, 24, 0.18);
  --surface: rgba(254, 250, 240, 0.55);
}
body[data-persona="coder"] {
  background: linear-gradient(180deg, var(--bg-from) 0%, var(--bg-to) 100%);
  color: var(--fg);
}
body[data-persona="coder"]::before {
  content: "";
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(31,36,24,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31,36,24,0.08) 1px, transparent 1px);
  background-size: 30px 30px;
  pointer-events: none; z-index: 1;
}
/* Schematic SVG, project cards, scribble, etc. — port from mockup lines 22–40 */
```

### 7.2 `src/styles/personas/traveler.css` (Voyages)

```css
:root[data-persona="traveler"] {
  --bg-from: #f6e8c8;
  --bg-mid:  #efdbb0;
  --bg-to:   #e8c98a;
  --fg: #2a2418;
  --muted: #4a3422;
  --accent: #c64a3c;        /* red */
  --pin: #c64a3c;
  --rule: rgba(74, 60, 42, 0.2);
  --surface: rgba(254, 250, 240, 0.92);
}
body[data-persona="traveler"] {
  background: linear-gradient(180deg, var(--bg-from) 0%, var(--bg-mid) 60%, var(--bg-to) 100%);
  color: var(--fg);
  min-height: 100vh; overflow-x: hidden; position: relative;
}
body[data-persona="traveler"]::before { /* 30px graph-paper grid, opacity 0.05 — mockup line 8 */ }
.map-wrap { position: fixed; inset: 0; display: grid; place-items: center; z-index: 0; opacity: 0.55; pointer-events: none; }
.pin { position: fixed; width: 12px; height: 12px; z-index: 4; }
/* …port lines 17–82 of vi-hybrid-travel.html verbatim… */
```

### 7.3 `src/styles/personas/curate.css` (Curio)

```css
:root[data-persona="curate"] {
  --bg-from: #f0e4cf;
  --bg-to:   #e6d6b5;
  --fg: #2a1818;
  --muted: #6a4a3a;
  --accent: #7a2828;        /* oxblood */
  --brass: #b89968;          /* secondary accent */
  --rule: rgba(42, 24, 24, 0.18);
  --surface: rgba(254, 250, 240, 0.7);
}
body[data-persona="curate"] {
  background: linear-gradient(180deg, var(--bg-from) 0%, var(--bg-to) 100%);
  color: var(--fg);
}
body[data-persona="curate"]::before {
  content: ""; position: fixed; inset: 0;
  background-image: repeating-linear-gradient(90deg, transparent 0, transparent 28px,
    rgba(42,24,24,0.05) 28px, rgba(42,24,24,0.05) 29px);
  pointer-events: none; z-index: 1;
}
/* now-reading card, finished list, ornament corners — port mockup lines 31–48 */
```

### 7.4 `src/styles/personas/made.css` (Atelier)

```css
:root[data-persona="made"] {
  --bg-from: #0e1320;
  --bg-to:   #1a2638;
  --fg: #f0e6d0;
  --muted: rgba(240, 230, 208, 0.65);
  --accent: #d97e3f;        /* amber */
  --amber-bright: #f0c468;
  --rule: rgba(240, 230, 208, 0.15);
  --surface: rgba(26, 38, 56, 0.55);
}
body[data-persona="made"] {
  background: linear-gradient(180deg, var(--bg-from) 0%, var(--bg-to) 100%);
  color: var(--fg);
}
body[data-persona="made"]::before { /* cyan 30px blueprint grid — mockup line 24 */ }
body[data-persona="made"]::after  { /* amber radial glow top-right — mockup line 25 */ }
.ph-card { aspect-ratio: 4/3; border: 1.5px dashed rgba(217,126,63,0.5); background: var(--surface); }
.ph-card.shipped { border: 1.5px solid rgba(217,126,63,0.8); background: linear-gradient(135deg, rgba(217,126,63,0.15), rgba(26,38,56,0.4)); }
/* …port lines 26–46… */
```

### 7.5 Typography reset (shared)

`src/styles/global.css` resets margins, loads the four Google fonts in one `<link>`, and exposes utility classes:

```css
@import url("https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@500;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap");
:root { font-family: 'Cormorant Garamond', serif; }
.t-display { font-family: 'Anton', sans-serif; letter-spacing: -0.04em; line-height: 0.84; }
.t-mono    { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.18em; text-transform: uppercase; }
.t-hand    { font-family: 'Caveat', cursive; }
```

> Cormorant Garamond + italic = two weights (400 reg + 400 ital + 600 reg + 700 reg + 500 ital). All four families loaded together = ~110 KB woff2 — see §14 risk.

## 8. Travel page interaction model (THE SHOWCASE)

This is the single most-detailed section because Voyages is the page that earned the user's yes. See `vi-hybrid-travel.html` for the exact visual target.

### 8.1 Component composition

```
<PersonaLayout personaId="traveler">
  <WorldMap />            {/* fixed bg svg, z=0, opacity 0.55 */}
  <MapPins pins={…} />    {/* fixed pins, z=4, computed from places where mapCoords is set */}
  <FloatingPhotos client:visible photos={…} activePlaceSlug={active.slug} />  {/* z=5, 7 polaroids */}
  <VoyagesHero stats={…} />
  <DiaryCard client:visible place={active} />     {/* z=10, mid-page */}
  <Timeline client:visible trips={trips} />        {/* z=15, fixed bottom */}
</PersonaLayout>
```

### 8.2 Active trip selection

- Default active trip = most recent (`yearMonth` desc, first non-draft entry)
- URL hash override: `/traveler#trip=2024-08-seattle` → `Timeline` reads on mount, dispatches `voyages:select`
- Click on a `Timeline` trip → dispatches `voyages:select` with that slug
- `DiaryCard` listens on `document.addEventListener('voyages:select', …)` and swaps content (fade-cross 200ms)
- `FloatingPhotos` also listens; rebuilds its 7-photo selection from the new active place's folder

```ts
// pseudo
function setActivePlace(slug: string) {
  document.dispatchEvent(new CustomEvent("voyages:select", { detail: { slug } }));
}
```

### 8.3 Floating photos engine

7 slot positions are **hard-coded in CSS** (`.pf-1`…`.pf-7`) with predetermined `top/left/right/width/--r/animation-delay`. The TS only decides which photo file fills each slot.

```ts
// FloatingPhotos.tsx
interface Photo { src: string; caption: string }
interface Props {
  /** Pre-built manifest: per place, the list of photo URLs from public/photos/<slug>/ */
  manifest: Record<string, Photo[]>;
  /** Initial active place slug — overridden on voyages:select */
  initialSlug: string;
}

function pickSeven(manifest, activeSlug): Photo[] {
  const primary = manifest[activeSlug] ?? [];
  if (primary.length >= 7) return shuffle(primary).slice(0, 7);
  // Spill into adjacent trips (newest → oldest, skipping active)
  const others = Object.entries(manifest)
    .filter(([k]) => k !== activeSlug)
    .flatMap(([, v]) => v);
  return [...primary, ...shuffle(others)].slice(0, 7);
}
```

Manifest is generated at build time (`scripts/build-photo-manifest.ts`) by walking `public/photos/` and emitting `src/data/photoManifest.json`. Captions: if `places/<slug>.md` has `photoCaptions[]`, zip them to photos in order; otherwise fall back to caption-from-filename (`pune-marketplace.jpg` → "pune marketplace").

`.photo-float` divs each carry an `<img>` with `loading="lazy"` and `decoding="async"`. The animation keyframe `float-cycle` is unchanged from mockup.

**Reduced motion path:** when `matchMedia("(prefers-reduced-motion: reduce)")` matches, animation is disabled and only ONE polaroid is shown statically (slot `pf-3`, centered-ish). The other six are `display: none`.

### 8.4 Map pin positioning

Each place's `mapCoords: { leftPct, topPct }` maps to inline `style="left: {leftPct}%; top: {topPct}%"` on a `<div class="pin">`. The `.pin-label` is a Mono uppercase string `<PLACE> · <durationDays>d` (or `· home` if `reason === "family"`). Active place's pin gets a stronger pulse (`box-shadow: 0 0 0 6px rgba(74,52,34,0.18)`).

> v4.1 stays hand-tuned coordinates. v4.2 will project real `geo: [lat, lng]` onto the stylized SVG — but the stylized SVG isn't a real equirectangular projection, so we'd need a transform table. Deferred.

### 8.5 Timeline carousel

`overflow-x: auto; scrollbar-width: none;` on `.timeline-track`. Each `.trip` is `min-width: 130px; flex-shrink: 0; cursor: pointer; padding-top: 1.8rem`. Active trip has the double-ring pulse. On click → `voyages:select`. On horizontal scroll (mouse wheel + drag), the trip whose center is closest to the viewport center becomes a *focused* preview (faint highlight) but the *active* (diary-card-binding) only swaps on click.

`IntersectionObserver` configures the scroll-snap, with `scroll-snap-type: x mandatory` on the track and `scroll-snap-align: center` on each `.trip`.

### 8.6 Diary card

Pure render of `place.data.paragraph` (text), `place.data.title` uppercased + period as Anton headline, `place.data.yearMonth` formatted into "June 2024 → May 2026 · 720 days · N photographs". The A.K./AI toggle reads `place.data.paragraphAuthor`:

```tsx
<div class="toggle">
  <span class={author === "ak" ? "on" : ""}>A.K.</span>
  <span class={author === "ai" ? "on" : ""}>AI</span>
</div>
```

It is **not** clickable in v4.1 — it's a state indicator, not a switch. Clickable variant deferred (would need dual-paragraph storage).

## 9. Resume page + PDF integration

### 9.1 File layout

```
public/resume/
  Ashish_Kshirsagar_SWE.pdf           # primary, 142 KB
  Ashish_Kshirsagar_MLE.pdf
  Ashish_Kshirsagar_Systems.pdf
src/content/resume.ts                 # typed source-of-truth for HTML render
src/pages/resume.astro                # the route
src/components/resume/
  ResumeHero.astro
  PDFDownloads.astro
  ResumeBody.astro
scripts/sync-resume-pdfs.sh           # one-liner: cp ~/Projects/active/resume/pdfs/*.pdf public/resume/
```

### 9.2 Sync workflow

User regenerates PDFs in `~/Projects/active/resume/` (LaTeX) and runs `bun run sync:resume` (script alias for `bash scripts/sync-resume-pdfs.sh`). Script copies the three PDFs into `public/resume/`. It does NOT touch `src/content/resume.ts` — that file is hand-edited.

> Naming convention is **fixed**: `Ashish_Kshirsagar_<Variant>.pdf` with `Variant ∈ {SWE, MLE, Systems}`. If user adds a new variant, the registry in `PDFDownloads.astro` props gets one more entry.

### 9.3 HTML render contract

The `/resume` page is pure SSG, `<8 KB gz`, no React. It uses the Workshop palette (copper accent) for visual continuity with the rest of the site — `/resume` carries `data-persona="coder"` for token scoping.

Section order: Now → Experience (most-recent first) → Education → Selected Work → Skills → Contact. Anton 2.5rem section headers, Cormorant 1.05rem body, Mono dates+locations 0.75rem.

## 10. AI paragraph generation script

### 10.1 Location and shape

`scripts/generate-paragraphs.ts` — TypeScript, executed via `bun run generate:paragraphs`.

```ts
// pseudo
import { Anthropic } from "@anthropic-ai/sdk";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const PLACES_DIR = "src/content/places";

for (const file of readdirSync(PLACES_DIR).filter((f) => f.endsWith(".md"))) {
  const fullPath = join(PLACES_DIR, file);
  const raw = readFileSync(fullPath, "utf8");
  const parsed = matter(raw);

  // Idempotency: if paragraph already exists AND was AI-authored, skip.
  // If A.K.-authored, NEVER overwrite — author wins.
  if (parsed.data.paragraph && parsed.data.paragraphAuthor !== "ai") continue;
  if (parsed.data.paragraph && parsed.data.paragraphAuthor === "ai") continue;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",        // or current Sonnet at script-run time
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `Write a 100–150 word reflective paragraph in first person, ` +
               `warm but not saccharine, about a stay in ${parsed.data.title}, ` +
               `${parsed.data.country}, during ${parsed.data.yearMonth}, ` +
               `reason: ${parsed.data.reason}, duration: ${parsed.data.durationDays ?? "unknown"} days. ` +
               `Tone: Cormorant Garamond italic — measured, observational, slightly ` +
               `melancholic. No clichés about "finding myself" or "the journey". ` +
               `Use sensory detail: weather, food, one small repeated ritual. ` +
               `End on a single image, not a moral.`,
    }],
  });

  const paragraph = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  parsed.data.paragraph = paragraph;
  parsed.data.paragraphAuthor = "ai";
  writeFileSync(fullPath, matter.stringify(parsed.content, parsed.data));
  console.log(`✓ ${file}: ${paragraph.split(" ").length} words`);
}
```

### 10.2 Behavior

- **Idempotent.** Re-running the script does NOT regenerate paragraphs that exist. User can force regeneration by deleting the `paragraph` field from the .md.
- **Author wins.** If `paragraphAuthor === "ak"`, the script never overwrites. The user owns their own words forever.
- **API key.** `ANTHROPIC_API_KEY` from env. Documented in `README.md` + `~/.config/opencode/CREDENTIALS.md`. Last-4-chars referenced only.
- **Cost.** ~400 input tokens + ~200 output tokens per place. Sonnet 4 pricing (May 2026): $3/M input, $15/M output → ~$0.01 per place. 12 places → $0.12. Trivial.
- **CI consideration.** Script is run **locally**, not in the Pages deploy. The build pipeline assumes paragraphs already exist in `.md`. If a paragraph is missing at build time, DiaryCard shows a placeholder ("paragraph forthcoming") rather than failing the build.
- **v4.2 enhancement:** include thumbnail data-URLs of 3 representative photos in the prompt for richer multimodal context. Skipped in v4.1.

## 11. Google Photos file workflow

### 11.1 User-facing instructions (write into `README.md` Travel section)

1. In Google Photos, select an album for a trip → ⋮ menu → Download all → unzip locally
2. Create folder `public/photos/<place-slug>/` where `<place-slug>` matches the `.md` filename in `src/content/places/`
3. Drop the photos in. Any extension Astro can serve (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`)
4. Filenames are free-form. The build-time `build:photo-manifest` script reads filenames into `caption` fallbacks (`pune-marketplace.jpg` → `pune marketplace`)
5. Run `bun run build:photo-manifest` to regenerate `src/data/photoManifest.json`. Or it runs automatically as a `prebuild` step

### 11.2 Manifest script

`scripts/build-photo-manifest.ts`:

```ts
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "public/photos";
const manifest: Record<string, Array<{ src: string; caption: string }>> = {};

for (const slug of readdirSync(ROOT)) {
  const dir = join(ROOT, slug);
  if (!statSync(dir).isDirectory()) continue;
  const files = readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f));
  manifest[slug] = files.map((f) => ({
    src: `/photos/${slug}/${f}`,
    caption: f.replace(/\.\w+$/, "").replace(/[-_]/g, " "),
  }));
}

writeFileSync("src/data/photoManifest.json", JSON.stringify(manifest, null, 2));
```

### 11.3 No API integration in v4.1

The Google Photos Library API is OAuth-only, requires app-verification, and the *Photos Picker* API (Mar 2025+) requires user-interactive picking — neither fits a static SSG. Defer to v4.2. Tombstoned in §16.

## 12. Implementation phases (A → H)

These are high-level; the architect's `writing-plans` pass turns them into numbered, mechanically-executable steps.

| Phase | Scope | Output |
|---|---|---|
| **A. Foundation tweaks** | Update registry strings, swap persona token CSS files (4×), rebuild `PersonaLayout` + `TopNav` + `FooterStatus` to hybrid aesthetic, wire Google-Fonts `<link>`, set up `data-persona` attribute, ensure `<ClientRouter />` still functions | Old persona pages still render but with v4 chrome + tokens — pre-content rebuild |
| **B. Workshop rebuild** | New `WorkshopHero`, `LiveStrip`, port `ProjectGrid` to mockup styles, port `TagFilter` island | `/` matches `vi-hybrid-workshop.html` |
| **C. Voyages rebuild** | Inline `WorldMap` SVG, `MapPins`, `VoyagesHero`, `FloatingPhotos` (React island), `DiaryCard`, `Timeline`, extend `places` schema, hand-tune `mapCoords` on 4 starter places, build photo-manifest script | `/traveler` matches `vi-hybrid-travel.html` |
| **D. Curio rebuild** | `CurioHero` (mixed italic+Anton), `NowReading`, `FinishedList`, `OrnamentCorners`, port `books` collection seed entries | `/curate` matches `vi-hybrid-curio.html`, zero JS |
| **E. Atelier rebuild** | `AtelierHero`, `BackgroundSchematic`, `BuildPlaceholders`, `BuildQueue`, extend `builds` schema with `on-bench`, port 3 queue seed entries | `/made` matches `vi-hybrid-atelier.html` |
| **F. Resume page** | `src/content/resume.ts` hand-authored, `ResumeHero` + `PDFDownloads` + `ResumeBody`, `scripts/sync-resume-pdfs.sh`, drop initial 3 PDFs | `/resume` ships |
| **G. AI paragraph + photos** | `scripts/generate-paragraphs.ts`, `scripts/build-photo-manifest.ts`, `prebuild` hook in `package.json`, README docs, run once locally to populate paragraphs on existing places | All 4+ places have paragraphs; manifest exists |
| **H. Polish + Lighthouse + cutover** | `prefers-reduced-motion` paths, ESLint cross-persona-import rule, Lighthouse runs, bundle analysis (`astro build --analyze`), 404 page, View Transitions test on Safari, cutover merge `v4` → `main` | Live; archived v3 branch |

**Estimated total:** 7–9 working days of focused agent work; compressible to 1–2 long sessions if Phase C is decomposed well.

## 13. Migration plan from v3

These are **user-run** (orchestrator surfaces them as steps; user executes — branch ops are denied to bash agents).

```bash
# 1. Archive v3 work-in-progress
cd ~/Projects/active/ask149.github.io
git status                                          # confirm dirty tree from v3 work
git checkout -b v3-publication-grade
git add -A
git commit -m "archive: v3 publication-grade design (rejected — pre-v4 hybrid pivot)"
git push -u origin v3-publication-grade

# 2. Branch v4 off main
git checkout main
git checkout -b v4

# 3. (optional cherry) keep v3 things that still apply (persona registry shape, content schemas)
git checkout v3-publication-grade -- src/personas/registry.ts src/content/config.ts

# 4. Start Phase A
```

During implementation, the build agent will:
- **Delete** entire dirs `src/components/{coder,traveler,curate,made}/` (any v3-built component files inside)
- **Replace** all four files in `src/styles/personas/*.css` wholesale
- **Replace** `src/layouts/PersonaLayout.astro`, `src/components/TopNav.astro`, `src/components/FooterStatus.astro` (or wherever they live)
- **Add** `src/pages/resume.astro`, `src/content/resume.ts`, `public/resume/`, `src/components/resume/`
- **Add** `scripts/generate-paragraphs.ts`, `scripts/build-photo-manifest.ts`, `scripts/sync-resume-pdfs.sh`
- **Add** `src/data/photoManifest.json` (generated)
- **Extend** `src/content/config.ts` `places` schema with v4 fields; existing place .md entries are forward-compatible (all new fields optional)

**Cutover:** after Phase H verification, `git checkout main && git merge --no-ff v4` → push → GitHub Pages rebuilds. v3 archive branch + the Jekyll v1 archive remain.

## 14. Risks + mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **Font payload weight.** 4 families (Anton + Cormorant Garamond 4 weights + JetBrains Mono 2 weights + Caveat 2 weights) ≈ 110 KB woff2 over the wire | High | LCP slip below Lighthouse 90 | Use `display=swap`, preconnect, subset to Latin-only via `&subset=latin`, host fonts on Cloudflare via Google's CDN (default). Budget for ≤120 KB font total. If still failing Lighthouse, self-host the two weights actually used at LCP (Anton + Cormorant 400) |
| 2 | **React runtime baseline.** `client:visible` on Voyages drags ~42.7 KB gz for React even before persona code. `/curate` stays JS-free; the 70 KB budget is for islanded routes only | High | Bundle budget breach | Keep React-island components small (<5 KB each gz). If `/traveler` slips, consider replacing React in `FloatingPhotos`/`Timeline`/`DiaryCard` with a Preact compat layer (`@astrojs/preact` brings 4 KB instead of 42 KB) — `[orchestrator's call]` for the architect plan |
| 3 | **Floating-photo perf.** 7 simultaneous polaroids with image decoding + CSS animation on a fixed-position bg could hit 60fps issues on low-end phones | Medium | jank, scroll lag | Lazy-load + `decoding="async"`. Cap polaroid width at 180px so files stay <40 KB. Use `will-change: transform, opacity` only on the visible polaroids. Profile on iPhone 12 baseline |
| 4 | **Anthropic API key handling.** `ANTHROPIC_API_KEY` lives in env, not in repo | Low (script is local-only) | Key leak if user mis-runs in CI | Document `.env.local` pattern. README warns against running `generate:paragraphs` in CI. Add `.env*` to `.gitignore` (likely already there). Reference last-4 in CREDENTIALS.md |
| 5 | **PDF download UX.** Browsers may inline-display PDFs instead of downloading | Medium | broken affordance | `<a href="…" download="Ashish_Kshirsagar_SWE.pdf">` forces download. Test Safari, Chrome, Firefox. Add explicit `Content-Disposition: attachment` via `public/_headers` (Cloudflare Pages / GitHub Pages: not supported on GH Pages — accept Safari inline-view fallback) |
| 6 | **Hand-tuned `mapCoords` brittleness.** If the world-map SVG is ever redrawn, all 12 place pins must be re-tuned | Low | annoying rework | Comment in `places/*.md`: `# mapCoords are positions on the stylized SVG in src/components/traveler/WorldMap.astro; re-tune if that SVG changes`. Reserved `geo` field unlocks v4.2 auto-projection |
| 7 | **AI paragraph quality drift.** Sonnet may produce "moral-ending" reflective slop the user finds embarrassing | Medium | every entry sounds AI-written | Prompt explicitly bans clichés + moral endings (see §10.1). Author always wins. User reviews each generated paragraph and flips `paragraphAuthor` to `ak` after editing |
| 8 | **View Transitions on Safari < 18.** Tab morph won't animate | Low (Safari 18 is 1.5 years old by 2026-05) | minor visual degradation | Astro's `<ClientRouter />` already falls back to instant nav. Accept |
| 9 | **Reduced-motion path completeness.** Easy to forget a corner | Medium | accessibility regression | Phase H checklist explicitly includes reduced-motion audit on all 4 personas |
| 10 | **Resume.ts drift from PDFs.** HTML render and PDF content diverge over time | Medium | "which is current?" confusion | Add `lastUpdated: "2026-05-17"` field on `resume.ts`, surface in `ResumeHero`. Sync ritual: any LaTeX edit → re-export PDFs + update `resume.ts` in same commit |

## 15. Success metrics

| Metric | Target | How measured |
|---|---|---|
| Lighthouse perf (`/`, `/traveler`, `/made`) | ≥ 90 | `lighthouse-ci` on built artifact, mobile preset |
| Lighthouse perf (`/curate`, `/resume`) | ≥ 95 | same |
| Lighthouse a11y (all routes) | ≥ 95 | same |
| Lighthouse best-practices (all routes) | ≥ 95 | same |
| Bundle gz (`/` `/traveler` `/made`) | ≤ 70 KB each | `astro build --analyze` |
| Bundle gz (`/curate`) | ≤ 10 KB | same |
| Bundle gz (`/resume`) | ≤ 8 KB | same |
| Modularity | Adding a 5th persona ≤ 4 hr | A registry entry + tokens CSS + component folder + (optional) collection should be the entire diff. No edits to `PersonaLayout`, `TopNav`, `FooterStatus` |
| LCP element | Anton headline `<h1>` | Lighthouse trace screenshot |
| CLS | < 0.05 | Lighthouse trace |
| AI paragraph cost | ≤ $0.25 for full place catalog (≤25 places) | sum the `usage` blocks from Anthropic responses |
| Travel page interaction smoothness | 60 fps polaroid cycle on M-class laptops + iPhone 12 | manual profiling in Phase H |

## 16. Open questions (non-blocking; resolve during build)

1. **Should `/resume` show all three PDFs by default, or only SWE with MLE+Systems behind a "alt variants" disclosure?** `[orchestrator's call: show all three. The whole point is recruiter-credibility for different role types — burying them is hostile.]`
2. **`§N` numbering: 1/2/3/4 (v4 default) or keep v3's whimsy 1/2/3/6?** `[orchestrator's call: 1/2/3/4 — matches mockups; less self-conscious.]`
3. **`TopNav` on mobile (< 640px).** Mockups are desktop-only. Hamburger? Horizontal scroll? `[orchestrator's call: horizontal scroll, no hamburger — 4 short labels (`workshop voyages curio atelier`) fit in 320px-wide row at Mono 0.65rem.]`
4. **Diary card position on Voyages: relative-flow or fixed?** `[orchestrator's call: relative-flow (as in mockup — `position: relative; margin: 2rem 2.5rem`). Fixed would crowd the floating polaroids.]`
5. **Should `paragraphAuthor` default to `"ak"` or be required?** `[orchestrator's call: optional, undefined = "ak" (the human is the default; AI is the marked case).]`
6. **Custom domain (ashishk.in?).** Brought up in v2; still deferred. `gh-pages` URL fine for v4.1
7. **`/feed` UI redesign.** v3 inherited v2's feed page; v4 should pick up the hybrid aesthetic. *Deferred to a v4.1.1 polish PR — not blocking the cutover*
8. **Photos with EXIF GPS.** Could auto-derive `geo` for places. `[orchestrator's call: deferred. EXIF parsing in build adds a dep; v4.1 stays hand-keyed.]`
9. **Dark mode toggle.** v3 had a light/dark toggle. v4 personas have *baked-in* moods (Workshop pale, Atelier dark) — a global toggle would fight the day-cycle. `[orchestrator's call: drop the dark-mode toggle in v4. The day-cycle IS the mood differentiation.]`

### Tombstoned (deferred to v4.2 or later)

- Google Photos Library API / Picker API integration
- Dual-paragraph storage (separate `paragraphAk` + `paragraphAi` fields with clickable A.K./AI toggle that swaps stored text)
- Real geo→SVG auto-projection for map pins
- Custom domain
- Dark mode toggle
- `<AnimatePresence>` cross-fade for Atelier "build ships" transition
- Per-place sub-route (`/traveler/seattle`) with full-bleed photo gallery — interesting but Voyages already does the job
- A "now playing" Spotify integration for Curio
- Smell-the-page olfactory integration (joke)

## 17. Self-review log

Self-review pass at end of drafting:

1. **Placeholder scan** — no `[TODO]`, `[lorem]`, or `[…]` placeholders remain. Bracketed `[orchestrator's call]` markers are intentional (they flag opinionated decisions the user didn't lock).
2. **Internal consistency** —
   - Registry §4 routes match §3.1 route map ✓
   - Registry `id` values (`coder`, `traveler`, `curate`, `made`) match component folder names in §5 ✓
   - `tokensHref` values in §4 match §7 token file names ✓
   - `collection` values in §4 match §6 collection definitions ✓
   - `--accent` values per persona in §7 match the §2 day-cycle table ✓
   - Mockup line-number references all verified against the four `vi-hybrid-*.html` files ✓
3. **Scope** — v4.1 covers: 4 persona rebuilds + `/resume` + AI paragraph script + photo manifest + reduced-motion + migration. Everything beyond that is in §16 tombstone or open-questions. No scope creep.
4. **Ambiguity** — every component contract has a TypeScript `interface Props`. Every locked decision is in §2 table. Every deferred decision is marked.
5. **Modularity claim** — independently verified: a hypothetical "Music" 5th persona would need (a) `PERSONAS[].push({ id: "music", … })`, (b) `src/styles/personas/music.css`, (c) `src/components/music/MusicHero.astro` + body components, (d) `src/content/songs` collection. No edits to `PersonaLayout`, `TopNav`, `FooterStatus`, any sibling persona file. Estimated 3–4 hr. Claim holds.
6. **Bundle math** — Workshop = React (42.7) + LiveFeed (~8) + TagFilter (~3) + ProjectGrid hydration glue (~2) + Astro CSR runtime (~7) ≈ 63 KB gz. Voyages = React (42.7) + FloatingPhotos (~5) + Timeline (~4) + DiaryCard (~3) + Astro CSR runtime (~7) ≈ 62 KB gz. Both under 70 KB ✓. Atelier zero-JS or minimal (≤10 KB). Curio + Resume zero-JS ✓.
7. **Migration story** — user-run commands in §13 are sane, denylist-compatible (no destructive ops). v3 archive branch preserves rejected design as history.
8. **Risk coverage** — top three risks (font weight, React baseline, photo perf) all have explicit mitigations + fallback plans.
9. **Acceptance for handoff** — `writing-plans` agent can pick this up and produce a numbered, mechanically-executable plan. Component contracts have prop types. Phase boundaries (A–H) are crisp. Mockup HTML files are the visual contract.

---

**End of v4 spec.** Next step: user reviews → `writing-plans` agent decomposes Phases A–H into numbered steps → `executing-plans` ships.
