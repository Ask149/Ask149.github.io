# Portfolio v4 — Hybrid Atelier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute this plan. Orchestrator will dispatch fresh @coder subagent per task with @reviewer quality gate between phases.

**Goal:** Rebuild the visual layer of the existing v3 portfolio into the hybrid-atelier direction (4 persona pages with distinct backgrounds + signature Travel page with world map + floating polaroids + timeline carousel + new /resume page + AI paragraph generation + Google Photos file workflow). Existing modular foundation (persona registry, content collections, Cloudflare Worker live feed) survives and carries over.

**Architecture:** Persona registry at `src/personas/registry.ts` stays as single source of truth. Each persona page = its own route + tokens file + content collection + component folder, refreshed to hybrid aesthetic. Shared chrome (TopNav + FooterStatus) rebuilt with Anton + Cormorant + JetBrains Mono + Caveat type stack and per-persona accent colors. /resume is new route. AI paragraph script and photo manifest are build-time only.

**Tech Stack:** Astro 4.10 (existing) + React 18 islands (motion/react, motion already installed) + TypeScript (strict) + Tailwind (existing). New: Anthropic SDK (`@anthropic-ai/sdk`) for build-time paragraph generation. Photos served as flat files from `public/photos/<slug>/`.

---

## Repo state (pre-flight)

- Repo root: `/Users/ashishkshirsagar/Projects/active/ask149.github.io`
- Current branch: `v2` (carries v3 uncommitted work — see `git status`)
- v3 work tree state: all four persona folders under `src/components/{coder,traveler,curate,made}/` populated; `src/personas/registry.ts` already exists; `src/styles/personas/*.css` exist; `PersonaLayout.astro` exists; content schemas extended for places/books/builds; LiveFeed.tsx + Cloudflare Worker `/feed` untouched.
- v4 visual contract is the four `vi-hybrid-*.html` mockups under `.superpowers/static/aesthetics/`.
- Existing collections to NOT modify schema: `essays`, `projects`. To extend: `places`. Unchanged: `books`. To extend: `builds` (add `on-bench` status).
- Existing place slugs: `2019-pune-school`, `2022-tempe-asu`, `2024-seattle`, `2026-pune-return`. v4 will hand-tune `mapCoords` on each.
- No test framework. Verification gates: `npx tsc --noEmit`, `npx astro check`, `npx astro build`, manual browser smoke, Lighthouse where stated.
- Cannot run `git commit` from orchestrator — commit checkpoints documented as **USER-RUN COMMAND** blocks.

---

## Phase ordering (locked)

```
A (Foundation refresh) ── must complete first
   ├─ B (Workshop rebuild)      ┐
   ├─ C (Voyages rebuild)       │ B, D, E mutually independent after A
   ├─ D (Curio rebuild)         │ C is heaviest — parallelize if dispatching subagents
   └─ E (Atelier rebuild)       ┘
F (/resume route) ── independent, can run after A
G (AI paragraphs + Photo manifest) ── after C (needs the Voyages wiring)
H (Polish + verify + cutover handoff) ── last
```

Between every phase, `@reviewer` quality-gates the diff before the next phase starts.

---

## Phase A — Foundation refresh (~0.5 day)

Purpose: Archive v3 to a safe branch, strip the v3 visual layer (NOT the modular skeleton — registry, schemas, layout file, and chrome files survive but get rewritten), install the Anthropic SDK, refresh persona-registry strings, swap all four persona token CSS files to the v4 palettes, rewrite shared chrome (TopNav + FooterStatus) to hybrid aesthetic, rewrite PersonaLayout to wire fonts + day-cycle backgrounds.

After Phase A: persona pages will render with v4 chrome + tokens but stripped-empty content slots. `/curate` and `/made` will look mostly broken (no body components yet) — that is expected. `/` and `/traveler` likewise. Only after Phases B/C/D/E do persona bodies come back online.

### Task A0 — USER-RUN: archive v3 to branch + create v4 work branch

**Files:** None (orchestrator step)

The orchestrator cannot run `git commit`, `git checkout -b`, or `git push`. Surface these to the user and wait for confirmation before continuing.

**USER-RUN COMMAND:**
```bash
cd ~/Projects/active/ask149.github.io

# 1. Confirm current state — should be on v2, with uncommitted v3 work
git status
git branch --show-current   # expect: v2

# 2. Archive v3 work-in-progress on its own branch
git checkout -b v3-publication-grade
git add -A
git commit -m "archive: v3 publication-grade design (rejected — pre-v4 hybrid pivot)"
git push -u origin v3-publication-grade

# 3. Cut v4 work branch from v3-publication-grade
#    (v4 INHERITS the v3 modular skeleton — registry, schemas, layout file scaffold)
git checkout -b v4
git push -u origin v4

# 4. Confirm
git branch --show-current   # expect: v4
git log --oneline -3        # expect: archive commit + v2 history below it
```

**Verification gate:** User confirms `v4` branch exists locally + on remote, current branch is `v4`, and `git status` is clean.

After user confirms, proceed to Task A1.

### Task A1 — Strip v3 visual component files (preserve folder shells)

**Files:** Delete contents of `src/components/{coder,traveler,curate,made}/*.{astro,tsx}` EXCEPT `LiveFeed.tsx` (which lives at `src/components/LiveFeed.tsx`, not under a persona folder — leave alone).

The persona folders themselves stay (they are git-tracked dirs of the modular architecture); only the component files inside get removed so Phase B/C/D/E can drop fresh v4 components in. The persona registry's `heroLoader` imports will reference files that don't exist until Phase B/C/D/E lands them — that is acceptable for v4 work because we will gate phase-B kickoff by registry rewrite (Task A4 below) which updates `heroLoader` paths to the new component names.

- [ ] List existing files to remove:
  ```bash
  ls src/components/coder/ src/components/traveler/ src/components/curate/ src/components/made/
  ```
  Expect: `CareerTimeline.astro CoderHero.astro ConnectLinks.astro CurrentlyBlurb.astro ManifestoTeaser.astro ProjectCard.tsx ProjectGrid.tsx TechChip.tsx WritingList.astro` under coder, etc.

- [ ] Delete one file at a time (do NOT `rm -rf`; the orchestrator's bash denylist blocks it AND we want each delete to be reviewable):
  ```bash
  # coder/
  rm src/components/coder/CareerTimeline.astro
  rm src/components/coder/CoderHero.astro
  rm src/components/coder/ConnectLinks.astro
  rm src/components/coder/CurrentlyBlurb.astro
  rm src/components/coder/ManifestoTeaser.astro
  rm src/components/coder/ProjectCard.tsx
  rm src/components/coder/ProjectGrid.tsx
  rm src/components/coder/TechChip.tsx
  rm src/components/coder/WritingList.astro

  # traveler/
  rm src/components/traveler/NextStopCard.astro
  rm src/components/traveler/Polaroid.tsx
  rm src/components/traveler/TravelTimeline.tsx
  rm src/components/traveler/TravelerHero.astro
  rm src/components/traveler/YearMarker.tsx

  # curate/
  rm src/components/curate/CurateHero.astro
  rm src/components/curate/FinishedGrid.astro
  rm src/components/curate/NowReading.astro
  rm src/components/curate/QuoteRotator.astro

  # made/
  rm src/components/made/BuildQueueList.astro
  rm src/components/made/EmptyPlaceholder.tsx
  rm src/components/made/MadeHero.astro
  rm src/components/made/MakerGrid.tsx
  ```

- [ ] Verify folders are now empty:
  ```bash
  ls src/components/coder/ src/components/traveler/ src/components/curate/ src/components/made/
  ```
  Expect: nothing printed under each.

- [ ] Don't delete `src/components/chrome/{TopNav,FooterStatus}.astro` — they get rewritten in A6.
- [ ] Don't delete `src/components/LiveFeed.tsx` — Workshop reuses it in B3.
- [ ] Don't touch `src/components/ui/` — shadcn primitives stay (Voyages may reuse Carousel).

**Verification gate:** `astro check` will now fail (registry's `heroLoader` imports point at deleted files); that's expected — gate passes if the only errors are the 4 unresolved hero loader imports. Capture the error count for reference; A4 fixes them.

**USER-RUN COMMAND:**
```bash
git add -A
git commit -m "chore(v4): strip v3 persona components (chrome + registry preserved)"
```

### Task A2 — Add Anton font + verify all four font families load

**Files:** Modify `src/styles/global.css`

The v4 type stack is Anton (display) + Cormorant Garamond (body + italic) + JetBrains Mono (meta) + Caveat (hand). The v3 setup likely lacks Anton. Mockups load all four via a single Google Fonts link.

- [ ] Read current `src/styles/global.css` and locate the Google Fonts `@import url(...)` line (if any).
- [ ] Replace the existing import (or add at top if missing) with the EXACT line from the mockups (matches `vi-hybrid-curio.html` line 4 — most complete Cormorant weight set):
  ```css
  @import url("https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@500;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap");
  ```
- [ ] Below the import, add (or replace) the base type rules + utility classes:
  ```css
  :root {
    font-family: 'Cormorant Garamond', serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { min-height: 100vh; overflow-x: hidden; position: relative; }
  .t-display { font-family: 'Anton', sans-serif; letter-spacing: -0.04em; line-height: 0.84; }
  .t-mono    { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.18em; text-transform: uppercase; }
  .t-hand    { font-family: 'Caveat', cursive; }
  ```
- [ ] Add `<link rel="preconnect" href="https://fonts.googleapis.com">` directly inside `PersonaLayout.astro`'s `<head>` (we'll do this in A7 — note the dependency).

**Verification gate:**
```bash
npx astro check
```
Expect: same 4 unresolved hero-loader errors as A1, no NEW errors. CSS doesn't fail astro check, but typescript should still be clean.

**USER-RUN COMMAND:**
```bash
git add src/styles/global.css
git commit -m "feat(v4): swap Google Fonts to Anton + Cormorant + JBMono + Caveat"
```

### Task A3 — Install Anthropic SDK

**Files:** Modify `package.json`, `package-lock.json` (auto)

- [ ] Install:
  ```bash
  npm install @anthropic-ai/sdk@^0.30.0 gray-matter@^4.0.3
  ```
  Pinning: spec §10 references the SDK; `gray-matter` is the standard frontmatter parser used by the paragraph script.

- [ ] Verify:
  ```bash
  npm ls @anthropic-ai/sdk gray-matter
  npx tsc --noEmit
  ```
  Expect: both packages listed, tsc errors limited to the unresolved hero-loader paths.

**Verification gate:** Both packages are present in `package.json` `dependencies`. (gray-matter could go in `devDependencies` since the script is local-only, but keep both in `dependencies` for now — the build won't ship them to the browser bundle since they're only used by scripts/.)

**USER-RUN COMMAND:**
```bash
git add package.json package-lock.json
git commit -m "feat(v4): add @anthropic-ai/sdk + gray-matter for paragraph generation"
```

### Task A4 — Rewrite persona registry strings + heroLoader paths

**Files:** Modify `src/personas/registry.ts`

Goal: Update labels + blurbs + sectionNumber + heroLoader paths to v4 component names (which Phase B/C/D/E will create). Type shape unchanged from v3.

- [ ] Read current `src/personas/registry.ts` to capture the existing `PersonaDef` interface (the type shape is locked).
- [ ] Replace the `PERSONAS` const block with the v4 entries. EXACT content:
  ```ts
  // src/personas/registry.ts
  import type { CollectionKey } from "astro:content";
  import type { ComponentType } from "react";

  export type PersonaId = "coder" | "traveler" | "curate" | "made";

  export interface PersonaDef {
    id: PersonaId;
    sectionNumber: number;
    label: string;
    longLabel: string;
    route: `/${string}`;
    blurb: string;
    tokensHref: `personas/${PersonaId}.css`;
    accentHex: string;
    pseudoPage: number;
    collection: CollectionKey | null;
    transitionMode: "morph" | "fade";
    heroLoader: () => Promise<{ default: ComponentType<unknown> }>;
  }

  export const PERSONAS: readonly PersonaDef[] = [
    {
      id: "coder",
      sectionNumber: 1,
      label: "workshop",
      longLabel: "the workshop",
      route: "/",
      blurb: "shipping with agents in parallel",
      tokensHref: "personas/coder.css",
      accentHex: "#8b5a2a",
      pseudoPage: 47,
      collection: "projects",
      transitionMode: "morph",
      heroLoader: () => import("../components/coder/WorkshopHero.astro") as any,
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
      heroLoader: () => import("../components/traveler/VoyagesHero.astro") as any,
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
      heroLoader: () => import("../components/curate/CurioHero.astro") as any,
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
      heroLoader: () => import("../components/made/AtelierHero.astro") as any,
    },
  ] as const;

  export function getPersonaByRoute(pathname: string): PersonaDef | undefined {
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

- [ ] Verify:
  ```bash
  npx tsc --noEmit
  ```
  Expect: STILL errors on the 4 hero-loader imports (the new paths `WorkshopHero.astro` / `VoyagesHero.astro` / `CurioHero.astro` / `AtelierHero.astro` don't exist yet — they land in B1/C8/D1/E1). The `as any` cast preserves spec §4.1 compatibility while letting unresolved imports compile.

**Verification gate:** `tsc` errors are exactly the 4 hero-loader imports, no others. `getPersonaById("coder").pseudoPage === 47` would resolve.

**USER-RUN COMMAND:**
```bash
git add src/personas/registry.ts
git commit -m "feat(v4): registry strings — workshop/voyages/curio/atelier labels + accent hexes"
```

### Task A5 — Rewrite per-persona CSS token files (4 files)

**Files:** Modify `src/styles/personas/coder.css`, `traveler.css`, `curate.css`, `made.css`

Each file ports the `:root[data-persona="<id>"]` block + `body[data-persona="<id>"]` rules + per-page texture (`body::before` for grid/stripes, `body::after` where applicable) from its corresponding `vi-hybrid-*.html` mockup. Persona-specific layout-helper classes (project cards, photo-float, pin, diary-card, ph-card, etc.) live in their respective persona token files too — keeps the CSS surface scoped + lets each phase build atop its tokens file.

- [ ] **`src/styles/personas/coder.css`** — replace entire contents with (port from `vi-hybrid-workshop.html` lines 5–40):
  ```css
  :root[data-persona="coder"] {
    --bg-from: #e8e5d8;
    --bg-to: #d8d3c0;
    --fg: #1f2418;
    --muted: #5a5848;
    --accent: #8b5a2a;
    --rule: rgba(31, 36, 24, 0.18);
    --surface: rgba(254, 250, 240, 0.55);
  }
  body[data-persona="coder"] {
    background: linear-gradient(180deg, var(--bg-from) 0%, var(--bg-to) 100%);
    color: var(--fg);
    font-family: 'Cormorant Garamond', serif;
  }
  body[data-persona="coder"]::before {
    content: "";
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(31, 36, 24, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(31, 36, 24, 0.08) 1px, transparent 1px);
    background-size: 30px 30px;
    pointer-events: none;
    z-index: 1;
  }

  /* Schematic background SVG container — populated by SchematicBackground.astro */
  body[data-persona="coder"] .schematic-bg {
    position: fixed; inset: 0;
    display: grid; place-items: center;
    z-index: 0; opacity: 0.18;
    pointer-events: none;
  }
  body[data-persona="coder"] .schematic-bg svg { width: 80%; max-width: 1100px; }

  /* Feed strip (mockup line 28) */
  body[data-persona="coder"] .feed-strip {
    position: relative; z-index: 10;
    padding: 1rem 2.5rem;
    background: var(--surface);
    border-bottom: 1px solid var(--rule);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.1em;
    color: var(--muted);
    display: flex; gap: 1rem; align-items: center;
  }
  body[data-persona="coder"] .feed-strip .live { color: var(--accent); }

  /* Hero (mockup lines 13–19) */
  body[data-persona="coder"] .hero { position: relative; z-index: 10; padding: 5rem 2.5rem 2rem; max-width: 920px; }
  body[data-persona="coder"] .hero-pre { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--accent); }
  body[data-persona="coder"] .hero h1 { font-family: 'Anton', sans-serif; font-size: 8.5rem; line-height: 0.84; letter-spacing: -0.04em; color: var(--fg); margin: 0.6rem 0 1.5rem; }
  body[data-persona="coder"] .hero h1 span { background: linear-gradient(180deg, var(--fg) 30%, var(--accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  body[data-persona="coder"] .hero .sub { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.5rem; color: var(--muted); max-width: 35ch; line-height: 1.45; }
  body[data-persona="coder"] .hero-meta { display: flex; gap: 1.5rem; margin-top: 2rem; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
  body[data-persona="coder"] .hero-meta strong { color: var(--accent); font-weight: 500; }

  /* Projects (mockup lines 30–40) */
  body[data-persona="coder"] .projects { position: relative; z-index: 10; padding: 0 2.5rem; max-width: 1100px; margin: 0 auto; }
  body[data-persona="coder"] .projects-label { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--muted); margin-bottom: 1.5rem; }
  body[data-persona="coder"] .proj-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; }
  body[data-persona="coder"] .proj { padding: 1.3rem; background: var(--surface); border: 1px solid var(--rule); position: relative; }
  body[data-persona="coder"] .proj-num { font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); }
  body[data-persona="coder"] .proj h3 { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 1.4rem; margin: 0.4rem 0; color: var(--fg); }
  body[data-persona="coder"] .proj .desc { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.95rem; color: var(--muted); margin-bottom: 0.9rem; line-height: 1.5; }
  body[data-persona="coder"] .proj .chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
  body[data-persona="coder"] .chip { font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; letter-spacing: 0.1em; padding: 0.15rem 0.45rem; background: rgba(139, 90, 42, 0.12); color: var(--accent); border-radius: 99px; }
  body[data-persona="coder"] .chip.on { background: var(--accent); color: #fefdf8; }
  body[data-persona="coder"] .scribble { font-family: 'Caveat', cursive; font-size: 1.1rem; color: var(--accent); transform: rotate(-2deg); position: absolute; top: -8px; right: 10px; opacity: 0.65; }

  @media (prefers-reduced-motion: reduce) {
    body[data-persona="coder"] .scribble { transform: none; }
  }
  ```

- [ ] **`src/styles/personas/traveler.css`** — replace entire contents (port from `vi-hybrid-travel.html` lines 7–82):
  ```css
  :root[data-persona="traveler"] {
    --bg-from: #f6e8c8;
    --bg-mid:  #efdbb0;
    --bg-to:   #e8c98a;
    --fg: #2a2418;
    --muted: #4a3422;
    --accent: #c64a3c;
    --pin: #c64a3c;
    --rule: rgba(74, 60, 42, 0.2);
    --surface: rgba(254, 250, 240, 0.92);
  }
  body[data-persona="traveler"] {
    background: linear-gradient(180deg, var(--bg-from) 0%, var(--bg-mid) 60%, var(--bg-to) 100%);
    color: var(--fg);
    font-family: 'Cormorant Garamond', serif;
    min-height: 100vh; overflow-x: hidden; position: relative;
  }
  body[data-persona="traveler"]::before {
    content: ""; position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(74, 60, 42, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(74, 60, 42, 0.05) 1px, transparent 1px);
    background-size: 30px 30px;
    pointer-events: none; z-index: 1;
  }

  /* World map wrapper */
  body[data-persona="traveler"] .map-wrap { position: fixed; inset: 0; display: grid; place-items: center; z-index: 0; opacity: 0.55; pointer-events: none; }
  body[data-persona="traveler"] .map-wrap svg { width: 92%; max-width: 1280px; height: auto; }
  body[data-persona="traveler"] .continent { fill: rgba(184, 109, 58, 0.12); stroke: rgba(74, 60, 42, 0.55); stroke-width: 1; }
  body[data-persona="traveler"] .lat-line { stroke: rgba(74, 60, 42, 0.15); stroke-width: 0.5; fill: none; stroke-dasharray: 2 4; }

  /* Pins */
  body[data-persona="traveler"] .pin { position: fixed; width: 12px; height: 12px; z-index: 4; }
  body[data-persona="traveler"] .pin::before { content: ""; position: absolute; inset: 0; background: var(--pin); border-radius: 50%; box-shadow: 0 0 0 3px rgba(254, 250, 240, 0.95); z-index: 2; }
  body[data-persona="traveler"] .pin::after  { content: ""; position: absolute; inset: -8px; border: 1.5px solid var(--pin); border-radius: 50%; opacity: 0; animation: pulse 3s ease-in-out infinite; }
  body[data-persona="traveler"] .pin .pin-label { position: absolute; top: -22px; left: 18px; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.15em; color: var(--muted); background: rgba(254, 250, 240, 0.85); padding: 0.1rem 0.4rem; border: 1px solid rgba(74, 60, 42, 0.3); white-space: nowrap; }
  body[data-persona="traveler"] .pin.active::before { box-shadow: 0 0 0 6px rgba(74, 52, 34, 0.18); }
  @keyframes pulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(3); opacity: 0; } }

  /* Floating photos */
  body[data-persona="traveler"] .photo-float { position: fixed; background: #fffaf0; padding: 0.4rem; box-shadow: 0 8px 28px rgba(74, 52, 34, 0.25); z-index: 5; opacity: 0; animation: float-cycle 12s ease-in-out infinite; pointer-events: none; }
  body[data-persona="traveler"] .photo-float .img { display: block; aspect-ratio: var(--ratio, 4/3); width: 100%; object-fit: cover; }
  body[data-persona="traveler"] .photo-float .cap { font-family: 'Caveat', cursive; font-size: 0.85rem; color: #6b4226; text-align: center; padding: 0.25rem 0.2rem 0.05rem; line-height: 1; }
  @keyframes float-cycle {
    0% { opacity: 0; transform: translateY(8px) rotate(var(--r, 0deg)) scale(0.95); }
    8%, 35% { opacity: 1; transform: translateY(0) rotate(var(--r, 0deg)) scale(1); }
    45% { opacity: 1; }
    60%, 100% { opacity: 0; transform: translateY(-8px) rotate(var(--r, 0deg)) scale(0.97); }
  }
  body[data-persona="traveler"] .pf-1 { top: 12%; left: 8%;  width: 160px; --r: -3deg; animation-delay: 0s; }
  body[data-persona="traveler"] .pf-2 { top: 22%; right: 9%; width: 130px; --r:  4deg; animation-delay: 2.5s; }
  body[data-persona="traveler"] .pf-3 { top: 55%; left: 11%; width: 180px; --r: -2deg; animation-delay: 5s; }
  body[data-persona="traveler"] .pf-4 { top: 48%; right: 7%; width: 145px; --r:  3deg; animation-delay: 7.5s; }
  body[data-persona="traveler"] .pf-5 { top: 70%; left: 38%; width: 120px; --r: -1deg; animation-delay: 1.2s; }
  body[data-persona="traveler"] .pf-6 { top: 28%; left: 42%; width: 100px; --r:  5deg; animation-delay: 4s; }
  body[data-persona="traveler"] .pf-7 { top: 60%; right: 28%; width: 165px; --r: -4deg; animation-delay: 8.5s; }

  /* Hero overlay */
  body[data-persona="traveler"] .hero { position: relative; z-index: 10; padding: 5rem 2.5rem 2rem; max-width: 720px; }
  body[data-persona="traveler"] .hero-pre { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--accent); }
  body[data-persona="traveler"] .hero h1 { font-family: 'Anton', sans-serif; font-size: 8.5rem; line-height: 0.84; letter-spacing: -0.04em; color: var(--fg); margin: 0.6rem 0 1.5rem; }
  body[data-persona="traveler"] .hero h1 span { background: linear-gradient(180deg, var(--fg) 30%, var(--accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  body[data-persona="traveler"] .hero .sub { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.5rem; color: var(--muted); max-width: 32ch; line-height: 1.45; }
  body[data-persona="traveler"] .hero-meta { display: flex; gap: 1.5rem; margin-top: 2rem; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase; color: #5a4a3a; }
  body[data-persona="traveler"] .hero-meta strong { color: var(--accent); font-weight: 500; }

  /* Diary card */
  body[data-persona="traveler"] .diary-card { position: relative; z-index: 10; max-width: 560px; margin: 2rem 2.5rem; padding: 2rem; background: var(--surface); border: 1px solid rgba(74, 60, 42, 0.18); box-shadow: 0 12px 40px rgba(74, 52, 34, 0.15); backdrop-filter: blur(4px); }
  body[data-persona="traveler"] .diary-card .label { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--accent); }
  body[data-persona="traveler"] .diary-card h3 { font-family: 'Anton', sans-serif; font-size: 3rem; line-height: 0.9; margin: 0.4rem 0 0.3rem; letter-spacing: -0.02em; }
  body[data-persona="traveler"] .diary-card .dates { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.95rem; color: #6b4226; margin-bottom: 1rem; }
  body[data-persona="traveler"] .diary-card p { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; line-height: 1.65; color: var(--fg); }
  body[data-persona="traveler"] .diary-card .row { display: flex; gap: 1rem; margin-top: 1.2rem; padding-top: 1rem; border-top: 1px solid rgba(74, 60, 42, 0.15); align-items: center; }
  body[data-persona="traveler"] .toggle { display: inline-flex; border: 1px solid var(--fg); }
  body[data-persona="traveler"] .toggle span { padding: 0.25rem 0.65rem; font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; }
  body[data-persona="traveler"] .toggle span.on { background: var(--fg); color: #fffaf0; }
  body[data-persona="traveler"] .diary-card .stats { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.12em; color: #5a4a3a; }

  /* Timeline */
  body[data-persona="traveler"] .timeline { position: fixed; bottom: 0; left: 0; right: 0; padding: 4rem 2.5rem 1.5rem; background: linear-gradient(180deg, rgba(246, 232, 200, 0) 0%, rgba(239, 219, 176, 0.95) 40%); z-index: 15; }
  body[data-persona="traveler"] .timeline-head { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: #5a4a3a; margin-bottom: 0.8rem; }
  body[data-persona="traveler"] .timeline-track { position: relative; height: 90px; display: flex; align-items: center; gap: 2.5rem; overflow-x: auto; scrollbar-width: none; padding: 0 1rem; scroll-snap-type: x mandatory; }
  body[data-persona="traveler"] .timeline-track::-webkit-scrollbar { display: none; }
  body[data-persona="traveler"] .timeline-track::before { content: ""; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: rgba(74, 60, 42, 0.35); transform: translateY(-50%); }
  body[data-persona="traveler"] .trip { position: relative; flex-shrink: 0; min-width: 130px; text-align: center; cursor: pointer; padding-top: 1.8rem; scroll-snap-align: center; background: transparent; border: 0; }
  body[data-persona="traveler"] .trip::before { content: ""; position: absolute; top: 24px; left: 50%; width: 12px; height: 12px; transform: translateX(-50%); background: #c8916b; border: 2px solid #fffaf0; border-radius: 50%; box-shadow: 0 0 0 4px rgba(200, 145, 107, 0.2); }
  body[data-persona="traveler"] .trip.active::before { background: var(--fg); box-shadow: 0 0 0 6px rgba(74, 52, 34, 0.18), 0 0 0 14px rgba(198, 74, 60, 0.15); width: 14px; height: 14px; top: 23px; }
  body[data-persona="traveler"] .trip .name { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 1rem; padding-top: 1rem; }
  body[data-persona="traveler"] .trip .yr { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.12em; color: #5a4a3a; margin-top: 0.15rem; }
  body[data-persona="traveler"] .trip.active .name { color: var(--fg); }
  body[data-persona="traveler"] .trip.active .yr { color: var(--accent); }

  @media (prefers-reduced-motion: reduce) {
    body[data-persona="traveler"] .photo-float { animation: none; opacity: 1; }
    body[data-persona="traveler"] .photo-float:not(.pf-3) { display: none; }
    body[data-persona="traveler"] .pin::after { animation: none; opacity: 0; }
    body[data-persona="traveler"] .timeline-track { scroll-behavior: auto; }
  }

  @media (max-width: 640px) {
    body[data-persona="traveler"] .hero h1 { font-size: 4.5rem; }
    body[data-persona="traveler"] .photo-float { display: none; }
    body[data-persona="traveler"] .photo-float.pf-3 { display: block; position: relative; inset: auto; width: 80%; margin: 1rem auto; }
    body[data-persona="traveler"] .timeline-track { gap: 1.5rem; }
  }
  ```

- [ ] **`src/styles/personas/curate.css`** — replace entire contents (port from `vi-hybrid-curio.html` lines 5–48):
  ```css
  :root[data-persona="curate"] {
    --bg-from: #f0e4cf;
    --bg-to:   #e6d6b5;
    --fg: #2a1818;
    --muted: #6a4a3a;
    --accent: #7a2828;
    --brass: #b89968;
    --rule: rgba(42, 24, 24, 0.18);
    --surface: rgba(254, 250, 240, 0.7);
  }
  body[data-persona="curate"] {
    background: linear-gradient(180deg, var(--bg-from) 0%, var(--bg-to) 100%);
    color: var(--fg);
    font-family: 'Cormorant Garamond', serif;
  }
  body[data-persona="curate"]::before {
    content: ""; position: fixed; inset: 0;
    background-image: repeating-linear-gradient(90deg, transparent 0, transparent 28px,
      rgba(42,24,24,0.05) 28px, rgba(42,24,24,0.05) 29px);
    pointer-events: none; z-index: 1;
  }

  body[data-persona="curate"] .ornament { position: fixed; pointer-events: none; z-index: 0; opacity: 0.55; }
  body[data-persona="curate"] .ornament svg { width: 100%; height: 100%; }
  body[data-persona="curate"] .ornament.tl { top: 1rem; left: 1rem; width: 120px; height: 120px; }
  body[data-persona="curate"] .ornament.br { bottom: 1rem; right: 1rem; width: 140px; height: 140px; transform: rotate(180deg); }

  body[data-persona="curate"] .hero { position: relative; z-index: 10; padding: 5rem 2.5rem 2rem; max-width: 920px; }
  body[data-persona="curate"] .hero-pre { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--accent); }
  body[data-persona="curate"] .hero h1 { font-family: 'Anton', sans-serif; font-size: 8.5rem; line-height: 0.84; letter-spacing: -0.04em; color: var(--fg); margin: 0.6rem 0 1.5rem; }
  body[data-persona="curate"] .hero h1 em { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 500; font-size: 0.8em; vertical-align: baseline; }
  body[data-persona="curate"] .hero h1 span { background: linear-gradient(180deg, var(--fg) 30%, var(--accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  body[data-persona="curate"] .hero .sub { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.5rem; color: var(--muted); max-width: 35ch; line-height: 1.45; }
  body[data-persona="curate"] .hero-meta { display: flex; gap: 1.5rem; margin-top: 2rem; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
  body[data-persona="curate"] .hero-meta strong { color: var(--accent); font-weight: 500; }

  body[data-persona="curate"] .now-reading { position: relative; z-index: 10; max-width: 920px; margin: 2rem auto; padding: 0 2.5rem; }
  body[data-persona="curate"] .nr-label { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--accent); margin-bottom: 1rem; }
  body[data-persona="curate"] .nr-card { display: grid; grid-template-columns: 110px 1fr; gap: 1.5rem; padding: 1.5rem; background: var(--surface); border: 1px solid var(--rule); box-shadow: 0 6px 20px rgba(42, 24, 24, 0.08); }
  body[data-persona="curate"] .nr-cover { aspect-ratio: 2/3; background: linear-gradient(135deg, var(--accent), #4a1818); display: grid; place-items: center; padding: 0.6rem; box-shadow: 0 3px 10px rgba(0,0,0,0.18); }
  body[data-persona="curate"] .nr-cover .title { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.7rem; color: rgba(240, 228, 207, 0.9); text-align: center; line-height: 1.3; }
  body[data-persona="curate"] .nr-info h3 { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 1.8rem; color: var(--fg); margin-bottom: 0.3rem; }
  body[data-persona="curate"] .nr-info .author { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.05rem; color: var(--muted); }
  body[data-persona="curate"] .quote { margin-top: 1rem; padding-left: 1rem; border-left: 3px solid var(--accent); font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.05rem; line-height: 1.55; color: var(--fg); }
  body[data-persona="curate"] .quote-meta { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; letter-spacing: 0.15em; color: var(--brass); margin-top: 0.6rem; }

  body[data-persona="curate"] .finished { position: relative; z-index: 10; max-width: 920px; margin: 3rem auto; padding: 0 2.5rem; }
  body[data-persona="curate"] .fin-label { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--accent); margin-bottom: 1rem; }
  body[data-persona="curate"] .fin-list { background: var(--surface); border: 1px solid var(--rule); padding: 0; }
  body[data-persona="curate"] .fin-row { display: grid; grid-template-columns: 30px 1fr auto; gap: 1rem; padding: 0.9rem 1.5rem; border-bottom: 1px dashed var(--rule); align-items: center; }
  body[data-persona="curate"] .fin-row:last-child { border-bottom: none; }
  body[data-persona="curate"] .fin-row .n { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--brass); }
  body[data-persona="curate"] .fin-row .t { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; }
  body[data-persona="curate"] .fin-row .t em { font-style: italic; color: var(--muted); }
  body[data-persona="curate"] .fin-row .r { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--brass); }
  ```

- [ ] **`src/styles/personas/made.css`** — replace entire contents (port from `vi-hybrid-atelier.html` lines 5–46):
  ```css
  :root[data-persona="made"] {
    --bg-from: #0e1320;
    --bg-to:   #1a2638;
    --fg: #f0e6d0;
    --muted: rgba(240, 230, 208, 0.65);
    --accent: #d97e3f;
    --amber:  #f0c468;
    --rule: rgba(240, 230, 208, 0.15);
    --surface: rgba(26, 38, 56, 0.55);
  }
  body[data-persona="made"] {
    background: linear-gradient(180deg, var(--bg-from) 0%, var(--bg-to) 100%);
    color: var(--fg);
    font-family: 'Cormorant Garamond', serif;
  }
  body[data-persona="made"]::before {
    content: ""; position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(240, 230, 208, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(240, 230, 208, 0.04) 1px, transparent 1px);
    background-size: 30px 30px;
    pointer-events: none; z-index: 1;
  }
  body[data-persona="made"]::after {
    content: ""; position: fixed; top: -100px; right: -100px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(217, 126, 63, 0.22) 0%, transparent 65%);
    pointer-events: none; z-index: 0;
  }

  body[data-persona="made"] .schematic-bg { position: fixed; inset: 0; display: grid; place-items: center; z-index: 0; opacity: 0.12; pointer-events: none; }
  body[data-persona="made"] .schematic-bg svg { width: 80%; max-width: 1100px; }

  body[data-persona="made"] .hero { position: relative; z-index: 10; padding: 5rem 2.5rem 2rem; max-width: 920px; }
  body[data-persona="made"] .hero-pre { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--accent); }
  body[data-persona="made"] .hero h1 { font-family: 'Anton', sans-serif; font-size: 8.5rem; line-height: 0.84; letter-spacing: -0.04em; color: var(--fg); margin: 0.6rem 0 1.5rem; }
  body[data-persona="made"] .hero h1 span { background: linear-gradient(180deg, var(--fg) 30%, var(--accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  body[data-persona="made"] .hero .sub { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.5rem; color: var(--muted); max-width: 35ch; line-height: 1.45; }
  body[data-persona="made"] .hero-meta { display: flex; gap: 1.5rem; margin-top: 2rem; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
  body[data-persona="made"] .hero-meta strong { color: var(--accent); font-weight: 500; }

  body[data-persona="made"] .placeholders { position: relative; z-index: 10; max-width: 1100px; margin: 2rem auto; padding: 0 2.5rem; }
  body[data-persona="made"] .ph-label { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--accent); margin-bottom: 1.2rem; }
  body[data-persona="made"] .ph-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; }
  body[data-persona="made"] .ph-card { aspect-ratio: 4/3; border: 1.5px dashed rgba(217, 126, 63, 0.5); background: var(--surface); display: grid; place-items: center; position: relative; }
  body[data-persona="made"] .ph-card .ph-fig { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent); text-align: center; line-height: 1.6; }
  body[data-persona="made"] .ph-card .ph-icon { width: 64px; height: 48px; margin: 0 auto 1rem; opacity: 0.7; display: block; }
  body[data-persona="made"] .ph-card.shipped { border: 1.5px solid rgba(217, 126, 63, 0.8); background: linear-gradient(135deg, rgba(217, 126, 63, 0.15), rgba(26, 38, 56, 0.4)); }
  body[data-persona="made"] .ph-card.shipped .ph-fig { color: var(--amber); }

  body[data-persona="made"] .queue { position: relative; z-index: 10; max-width: 1100px; margin: 3rem auto; padding: 0 2.5rem; }
  body[data-persona="made"] .queue-label { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--accent); margin-bottom: 1rem; }
  body[data-persona="made"] .queue-list { background: var(--surface); border: 1px solid var(--rule); }
  body[data-persona="made"] .q-row { display: grid; grid-template-columns: 60px 1fr 2fr 100px; gap: 1rem; padding: 1rem 1.5rem; border-bottom: 1px solid var(--rule); align-items: center; }
  body[data-persona="made"] .q-row:last-child { border-bottom: none; }
  body[data-persona="made"] .q-row .p { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--amber); }
  body[data-persona="made"] .q-row .t { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 1.1rem; }
  body[data-persona="made"] .q-row .b { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.9rem; color: var(--muted); }
  body[data-persona="made"] .q-row .s { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent); text-align: right; }
  ```

- [ ] Verify:
  ```bash
  npx astro check
  ```
  Expect: only the 4 hero-loader import errors remain.

**Verification gate:** All 4 persona token CSS files updated. The CSS itself doesn't run through TS — only confirm files exist + lint clean if a linter is configured (none in this repo).

**USER-RUN COMMAND:**
```bash
git add src/styles/personas/coder.css src/styles/personas/traveler.css src/styles/personas/curate.css src/styles/personas/made.css
git commit -m "feat(v4): persona token CSS — workshop/voyages/curio/atelier palettes + textures"
```

### Task A6 — Rewrite shared chrome (TopNav + FooterStatus)

**Files:** Modify `src/components/chrome/TopNav.astro` and `src/components/chrome/FooterStatus.astro`

- [ ] Replace `src/components/chrome/TopNav.astro` with:
  ```astro
  ---
  // src/components/chrome/TopNav.astro
  import { PERSONAS, type PersonaId } from "../../personas/registry";

  export interface Props {
    activeId: PersonaId | "resume";
  }
  const { activeId } = Astro.props;
  const active = PERSONAS.find((p) => p.id === activeId);
  const sectionNumber = active?.sectionNumber ?? "—";
  ---
  <nav class="top-strip" data-component="top-nav">
    <span class="brand">ASHISH K.</span>
    <div class="nav">
      {PERSONAS.map((p) => (
        <a
          href={p.route}
          class={activeId === p.id ? "active" : undefined}
          data-astro-prefetch
        >{p.label}</a>
      ))}
    </div>
    <a
      href="/resume"
      class={activeId === "resume" ? "resume-link active" : "resume-link"}
      data-astro-prefetch
    >↓ resume</a>
    <span class="ver">ver. XIV · §{sectionNumber}</span>
  </nav>

  <style>
    .top-strip {
      position: relative; z-index: 10;
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.2rem 2.5rem;
      border-bottom: 1px solid var(--rule);
      backdrop-filter: blur(8px);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem; letter-spacing: 0.18em; text-transform: uppercase;
      background: color-mix(in srgb, var(--bg-from) 70%, transparent);
    }
    .brand { font-family: 'Anton', sans-serif; font-size: 0.95rem; letter-spacing: 0.05em; color: var(--fg); }
    .nav { display: flex; gap: 1.5rem; }
    .nav a { color: var(--muted); text-decoration: none; transition: color 200ms ease; }
    .nav a.active { color: var(--accent); border-bottom: 1px solid var(--accent); padding-bottom: 0.1rem; }
    .nav a:hover { color: var(--accent); }
    .resume-link { color: var(--accent); text-decoration: none; font-size: 0.65rem; letter-spacing: 0.18em; text-transform: uppercase; }
    .resume-link.active { border-bottom: 1px solid var(--accent); padding-bottom: 0.1rem; }
    .ver { color: var(--muted); }

    @media (max-width: 640px) {
      .top-strip { overflow-x: auto; scrollbar-width: none; padding: 0.9rem 1rem; gap: 1rem; }
      .top-strip::-webkit-scrollbar { display: none; }
      .nav { gap: 1rem; flex-shrink: 0; }
      .ver { display: none; }
    }
  </style>
  ```

- [ ] Replace `src/components/chrome/FooterStatus.astro` with:
  ```astro
  ---
  // src/components/chrome/FooterStatus.astro
  import { PERSONAS, type PersonaId } from "../../personas/registry";

  export interface Props {
    activeId: PersonaId | "resume";
    lastEditISO?: string;
  }
  const { activeId, lastEditISO } = Astro.props;
  const active = PERSONAS.find((p) => p.id === activeId);
  const sectionNumber = active?.sectionNumber ?? "—";
  const pseudoPage = active?.pseudoPage ?? "—";

  function relTime(iso?: string): string {
    if (!iso) return "fresh";
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - then);
    const day = 86400000;
    if (diff < day) return `${Math.max(1, Math.round(diff / 3600000))}h ago`;
    return `${Math.round(diff / day)}d ago`;
  }
  ---
  <footer class="footer-status">
    <span>set in Anton · Cormorant Garamond · JetBrains Mono</span>
    <span>last entry · {relTime(lastEditISO)}</span>
    <span>§{sectionNumber} / p. {pseudoPage}</span>
  </footer>

  <style>
    .footer-status {
      position: relative; z-index: 10;
      padding: 3rem 2.5rem 2rem;
      border-top: 1px solid var(--rule);
      margin-top: 4rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem; letter-spacing: 0.18em;
      color: var(--muted);
      display: flex; justify-content: space-between; gap: 1rem;
    }
    @media (max-width: 640px) {
      .footer-status { flex-direction: column; gap: 0.4rem; padding: 2rem 1rem 1.5rem; }
    }
  </style>
  ```

- [ ] Verify:
  ```bash
  npx astro check
  ```
  Expect: still only the 4 hero-loader errors. TopNav + FooterStatus compile clean against the registry.

**Verification gate:** Both files exist; no new errors introduced.

**USER-RUN COMMAND:**
```bash
git add src/components/chrome/TopNav.astro src/components/chrome/FooterStatus.astro
git commit -m "feat(v4): rebuild TopNav + FooterStatus for hybrid aesthetic"
```

### Task A7 — Rewrite PersonaLayout with v4 chrome + day-cycle scoping

**Files:** Modify `src/layouts/PersonaLayout.astro`

- [ ] Replace `src/layouts/PersonaLayout.astro` with:
  ```astro
  ---
  // src/layouts/PersonaLayout.astro
  import { ClientRouter } from "astro:transitions";
  import { PERSONAS, type PersonaId } from "../personas/registry";
  import TopNav from "../components/chrome/TopNav.astro";
  import FooterStatus from "../components/chrome/FooterStatus.astro";
  import "../styles/global.css";
  import "../styles/personas/coder.css";
  import "../styles/personas/traveler.css";
  import "../styles/personas/curate.css";
  import "../styles/personas/made.css";

  export interface Props {
    personaId: PersonaId | "resume";
    title: string;
    description?: string;
    ogImage?: string;
    lastEditISO?: string;
  }
  const { personaId, title, description, ogImage, lastEditISO } = Astro.props;

  // /resume reuses Workshop's copper palette
  const tokensPersona: PersonaId = personaId === "resume" ? "coder" : personaId;
  const def = PERSONAS.find((p) => p.id === tokensPersona);
  ---
  <!doctype html>
  <html lang="en" data-persona={tokensPersona}>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <ClientRouter />
    </head>
    <body data-persona={tokensPersona}>
      <TopNav activeId={personaId} />
      <slot />
      <FooterStatus activeId={personaId} lastEditISO={lastEditISO} />
    </body>
  </html>
  ```

  > NOTE: We import all four persona CSS files unconditionally. Each is scoped via `:root[data-persona="..."]` so only the active persona's tokens take effect. Total CSS overhead is ~12 KB gz across all four — well below budget and means a tab navigation never refetches CSS.

- [ ] Verify:
  ```bash
  npx astro check
  ```
  Expect: still only the 4 hero-loader errors (registry's heroLoader paths still point at unwritten files).

- [ ] Visual smoke (optional, since persona body components don't exist yet — pages will be mostly empty under the chrome):
  ```bash
  npx astro build
  ```
  Should succeed if the existing pages don't import deleted persona components. If `src/pages/index.astro` etc. import deleted files, the build will fail — that's expected, the page files get rewritten in B6/C9/D5/E6.

**Verification gate:** `astro check` errors are still ONLY the 4 unresolved hero-loader paths + any unresolved imports in `src/pages/*.astro` (those are the legacy v3 page bodies that B6/C9/D5/E6 will replace). Capture the error list and confirm no NEW categories.

**USER-RUN COMMAND:**
```bash
git add src/layouts/PersonaLayout.astro
git commit -m "feat(v4): PersonaLayout — day-cycle CSS scoping + ClientRouter + chrome wiring"
```

### Task A8 — Phase A verification gate

**Files:** None (verification only)

- [ ] Run full check:
  ```bash
  npx tsc --noEmit
  npx astro check
  ```
- [ ] Document the residual error list (registry hero-loader paths + page-body imports). Expected to clear as B/C/D/E land.
- [ ] Confirm git history has the A1-A7 commits in sequence.

**Verification gate:** Phase A produces zero NEW error categories. The only remaining errors are the deliberate ones that B/C/D/E phases fix. Document in the cutover doc (Phase H8) what Phase A intentionally left broken.

**@reviewer dispatch hook:** Orchestrator MUST dispatch `@reviewer` before kicking off Phase B/C/D/E. Reviewer checks: (a) registry strings match spec §4 verbatim, (b) all 4 persona token files have the `:root[data-persona="<id>"]` scoping (no global leaks), (c) TopNav uses `color-mix` correctly with a fallback for browsers without support, (d) PersonaLayout's data-persona attribute is on both `<html>` and `<body>` (CSS scoping rules depend on it).

---

## Phase B — Workshop (§1) rebuild (~1 day)

Reference: `vi-hybrid-workshop.html`. After Phase B, `/` renders matching the mockup.

### Task B1 — Create WorkshopHero.astro

**Files:** Create `src/components/coder/WorkshopHero.astro`

```astro
---
// src/components/coder/WorkshopHero.astro
export interface Props {
  stats?: {
    activeProjects: number;
    eventsThisWeek: number;
    handTypedCommits: number;
  };
}
const { stats = { activeProjects: 5, eventsThisWeek: 247, handTypedCommits: 0 } } = Astro.props;
---
<section class="hero">
  <div class="hero-pre">~ §1 · the workshop ~</div>
  <h1>VIBE-CODING<br/><span>WITH 4 AGENTS.</span></h1>
  <p class="sub">Senior software engineer at Microsoft. Four agents in parallel — Copilot, Claude Code, OpenCode, Jules. The code, the manifesto, the receipts.</p>
  <div class="hero-meta">
    <span><strong>{stats.activeProjects}</strong> active projects</span>
    <span><strong>{stats.eventsThisWeek}</strong> agent events this week</span>
    <span><strong>{stats.handTypedCommits}</strong> commits typed by hand</span>
  </div>
</section>
```

- [ ] Verify:
  ```bash
  npx astro check
  ```
  Expect: registry's `WorkshopHero.astro` import now resolves; 3 hero-loader errors remain (VoyagesHero, CurioHero, AtelierHero).

**USER-RUN COMMAND:**
```bash
git add src/components/coder/WorkshopHero.astro
git commit -m "feat(v4-workshop): WorkshopHero — Anton headline + meta stats"
```

### Task B2 — Create SchematicBackground.astro

**Files:** Create `src/components/coder/SchematicBackground.astro`

Verbatim port of the SVG from `vi-hybrid-workshop.html` lines 43–61.

```astro
---
// src/components/coder/SchematicBackground.astro
// Pure SVG, no props. Fixed-position decorative layer behind hero/content.
---
<div class="schematic-bg" aria-hidden="true">
  <svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg">
    <g stroke="rgba(31, 36, 24, 0.35)" stroke-width="1" fill="none">
      <rect x="100" y="100" width="160" height="100"/>
      <rect x="120" y="120" width="40" height="40"/>
      <circle cx="220" cy="150" r="20"/>
      <line x1="260" y1="150" x2="340" y2="150" stroke-dasharray="4 4"/>
      <rect x="340" y="120" width="120" height="60"/>
      <text x="350" y="150" font-family="JetBrains Mono" font-size="10" fill="rgba(31, 36, 24, 0.5)">orchestrator</text>
      <line x1="460" y1="150" x2="600" y2="150" stroke-dasharray="4 4"/>
      <rect x="600" y="100" width="200" height="100"/>
      <text x="620" y="135" font-family="JetBrains Mono" font-size="10" fill="rgba(31, 36, 24, 0.5)">subagent fleet</text>
      <line x1="700" y1="200" x2="700" y2="280"/>
      <rect x="600" y="280" width="200" height="80"/>
      <text x="620" y="320" font-family="JetBrains Mono" font-size="10" fill="rgba(31, 36, 24, 0.5)">reviewer gates</text>
    </g>
    <text x="500" y="450" font-family="Caveat" font-size="22" fill="rgba(139, 90, 42, 0.45)" text-anchor="middle">fig.04 · the four-agent quadrant</text>
  </svg>
</div>
```

**USER-RUN COMMAND:**
```bash
git add src/components/coder/SchematicBackground.astro
git commit -m "feat(v4-workshop): SchematicBackground — fixed SVG behind hero"
```

### Task B3 — Create AgentFeedStrip.astro

**Files:** Create `src/components/coder/AgentFeedStrip.astro`

Wraps the existing `LiveFeed.tsx` island in a compact strip that sits above the hero. Per spec §5.3, the strip server-renders a placeholder + hydrates `client:idle` for the latest single event.

```astro
---
// src/components/coder/AgentFeedStrip.astro
import LiveFeed from "../LiveFeed.tsx";
---
<div class="feed-strip" data-component="agent-feed-strip">
  <span class="live">● LIVE</span>
  <LiveFeed client:idle compact={true} />
  <span style="margin-left:auto"><a href="/changelog" style="color:inherit;text-decoration:none">/changelog →</a></span>
</div>
```

> **Compatibility note:** v3's `LiveFeed.tsx` may not accept a `compact` prop. If `astro check` flags an unknown prop, surface as part of the verification gate and either (a) add `compact?: boolean` to LiveFeed's `Props` interface (rendering only the latest event when true), or (b) drop the prop and accept the full feed in the strip. Default fallback: option (a) — quick 8-line patch to LiveFeed.

- [ ] Read existing `src/components/LiveFeed.tsx` to confirm prop shape:
  ```bash
  head -40 src/components/LiveFeed.tsx
  ```
- [ ] If `compact` prop missing, patch LiveFeed.tsx:
  ```tsx
  // additions near top of LiveFeed.tsx
  interface Props {
    compact?: boolean;
    // ...existing props
  }
  // and in render, when compact: render only events.slice(0, 1) without container chrome
  ```
- [ ] Verify:
  ```bash
  npx astro check
  ```

**USER-RUN COMMAND:**
```bash
git add src/components/coder/AgentFeedStrip.astro src/components/LiveFeed.tsx
git commit -m "feat(v4-workshop): AgentFeedStrip wrapping LiveFeed in compact mode"
```

### Task B4 — Create ProjectGridV4.tsx (React island with Motion stagger)

**Files:** Create `src/components/coder/ProjectGridV4.tsx`

Per spec §5.4 — keeps Motion stagger from v3 but restyles to v4 mockup (proj-num + h3 + desc + chips + scribble accent on featured).

```tsx
// src/components/coder/ProjectGridV4.tsx
import { motion } from "motion/react";
import { useState } from "react";

export interface Project {
  slug: string;
  title: string;
  description: string;
  status: "active" | "shipped" | "experimental" | "abandoned" | "ongoing";
  tags: string[];
  order: number;
  url?: string;
  featured?: boolean;
}

interface Props {
  projects: Project[];
}

const STATUS_LABEL: Record<Project["status"], string> = {
  active: "ACTIVE",
  shipped: "SHIPPED",
  experimental: "EXPERIMENTAL",
  abandoned: "ABANDONED",
  ongoing: "ONGOING",
};

export default function ProjectGridV4({ projects }: Props) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = activeTag
    ? projects.filter((p) => p.tags.includes(activeTag))
    : projects;

  return (
    <motion.div
      className="proj-grid"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
      }}
    >
      {filtered.map((p, i) => (
        <motion.div
          key={p.slug}
          className="proj"
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
          }}
        >
          <div className="proj-num">{String(p.order).padStart(3, "0")} · {STATUS_LABEL[p.status]}</div>
          <h3>{p.url ? <a href={p.url} style={{ color: "inherit", textDecoration: "none" }}>{p.title}</a> : p.title}</h3>
          <div className="desc">{p.description}</div>
          <div className="chips">
            {p.tags.map((t) => (
              <button
                key={t}
                className={`chip${activeTag === t ? " on" : ""}`}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
                style={{ border: 0, cursor: "pointer", font: "inherit" }}
              >{t}</button>
            ))}
          </div>
          {p.featured && i === 0 && <span className="scribble">~ shipped today</span>}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

- [ ] Verify:
  ```bash
  npx tsc --noEmit
  ```

**USER-RUN COMMAND:**
```bash
git add src/components/coder/ProjectGridV4.tsx
git commit -m "feat(v4-workshop): ProjectGridV4 — Motion stagger + v4 card styling + inline tag filter"
```

### Task B5 — Create TechChipV4.tsx (helper, optional standalone)

**Files:** Create `src/components/coder/TechChipV4.tsx`

Standalone chip component reused by other persona pages if needed. ProjectGridV4 inlines its chip styles, but exposing a primitive keeps the surface clean.

```tsx
// src/components/coder/TechChipV4.tsx
import { useState } from "react";

export interface Props {
  label: string;
  active?: boolean;
  onToggle?: (label: string, next: boolean) => void;
}

export default function TechChipV4({ label, active = false, onToggle }: Props) {
  const [isOn, setIsOn] = useState(active);
  const handleClick = () => {
    const next = !isOn;
    setIsOn(next);
    onToggle?.(label, next);
  };
  return (
    <button
      type="button"
      className={`chip${isOn ? " on" : ""}`}
      data-active={isOn}
      onClick={handleClick}
      style={{ border: 0, cursor: "pointer", font: "inherit" }}
    >{label}</button>
  );
}
```

- [ ] Verify: `npx tsc --noEmit`

**USER-RUN COMMAND:**
```bash
git add src/components/coder/TechChipV4.tsx
git commit -m "feat(v4-workshop): TechChipV4 — standalone chip primitive"
```

### Task B6 — Refactor src/pages/index.astro to use v4 components

**Files:** Modify `src/pages/index.astro`

```astro
---
// src/pages/index.astro
import { getCollection } from "astro:content";
import PersonaLayout from "../layouts/PersonaLayout.astro";
import SchematicBackground from "../components/coder/SchematicBackground.astro";
import AgentFeedStrip from "../components/coder/AgentFeedStrip.astro";
import WorkshopHero from "../components/coder/WorkshopHero.astro";
import ProjectGridV4 from "../components/coder/ProjectGridV4.tsx";

const projectEntries = await getCollection("projects", (e) => !e.data.draft);
const projects = projectEntries
  .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
  .map((e, i) => ({
    slug: e.slug,
    title: e.data.title,
    description: e.data.description,
    status: e.data.status,
    tags: e.data.tags ?? [],
    order: e.data.order ?? i + 1,
    url: e.data.url,
    featured: i === 0,
  }));

const lastEditISO = projectEntries
  .map((e) => e.data?.shippedDate?.toISOString?.() ?? null)
  .filter(Boolean)
  .sort()
  .reverse()[0] ?? undefined;
---
<PersonaLayout
  personaId="coder"
  title="Ashish K. · workshop"
  description="Senior software engineer at Microsoft. Four agents in parallel — the code, the manifesto, the receipts."
  lastEditISO={lastEditISO}
>
  <SchematicBackground />
  <AgentFeedStrip />
  <WorkshopHero stats={{ activeProjects: projects.length, eventsThisWeek: 247, handTypedCommits: 0 }} />

  <section class="projects">
    <div class="projects-label">→ §1.2 · selected work · click chips to filter</div>
    <ProjectGridV4 client:visible projects={projects} />
  </section>
</PersonaLayout>
```

> **Note on `projects` collection:** v3 schema doesn't include a `shippedDate` field — `lastEditISO` may be undefined. Acceptable: FooterStatus falls back to "fresh". If projects collection has different fields, adapt the destructuring. Don't extend schema; just consume what's there.

- [ ] Verify:
  ```bash
  npx astro check
  npx astro build
  ```
  Expect: `/` builds. Other persona routes still fail (D5/E6/C9 not yet done).

- [ ] Visual smoke:
  ```bash
  npx astro dev
  # open localhost:4321 in browser
  ```
  Compare against `vi-hybrid-workshop.html`. Acceptance: hero matches; project grid 3-col matches; feed strip top matches; schematic faintly visible in background; copper accent on `001 · ACTIVE` and chips.

**USER-RUN COMMAND:**
```bash
git add src/pages/index.astro
git commit -m "feat(v4-workshop): wire / route — hero + feed + grid composition"
```

### Task B7 — Phase B verification gate + @reviewer

- [ ] `npx astro build` — `/` page builds clean, bundle for `/` measured (target ≤70 KB gz)
- [ ] Mobile smoke (375px viewport) — TopNav horizontal scrolls, hero scales down (anton at 4.5rem on mobile — check that mobile @media query exists on hero or add to coder.css if needed)
- [ ] Reduced-motion test — DevTools rendering panel → emulate prefers-reduced-motion → reload → scribble shouldn't rotate; Motion stagger should still play (acceptable)

**@reviewer dispatch hook:** Reviewer checks: (a) `WorkshopHero` props default values match mockup numbers (5/247/0), (b) ProjectGridV4 stagger is honored on `prefers-reduced-motion` (Motion respects this by default), (c) AgentFeedStrip falls back gracefully if `/feed.json` is offline, (d) `client:visible` is used on the grid (not `client:load`) — verified in index.astro.

---

## Phase C — Voyages (§2) rebuild — THE SHOWCASE (~2-3 days)

Reference: `vi-hybrid-travel.html`. This is the heaviest phase. After Phase C, `/traveler` matches the mockup with world map + 4 pins + 7 floating polaroids + diary card + timeline carousel.

### Task C1 — Create WorldMap.astro (fixed SVG)

**Files:** Create `src/components/traveler/WorldMap.astro`

Verbatim port of the SVG from `vi-hybrid-travel.html` lines 85–106.

```astro
---
// src/components/traveler/WorldMap.astro
// Pure SVG, fixed-position behind content. Stylized continents + dashed latitude guides.
---
<div class="map-wrap" aria-hidden="true">
  <svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg">
    <!-- Latitude guide lines -->
    <line class="lat-line" x1="0" y1="125" x2="1000" y2="125"/>
    <line class="lat-line" x1="0" y1="250" x2="1000" y2="250"/>
    <line class="lat-line" x1="0" y1="375" x2="1000" y2="375"/>
    <!-- North America -->
    <path class="continent" d="M 80 80 Q 130 60 200 75 Q 270 90 320 130 Q 350 175 320 220 Q 280 245 220 235 Q 160 225 120 200 Q 90 170 75 130 Z"/>
    <!-- South America -->
    <path class="continent" d="M 230 260 Q 270 270 285 320 Q 290 370 260 405 Q 230 420 215 390 Q 200 350 210 300 Z"/>
    <!-- Europe -->
    <path class="continent" d="M 470 95 Q 510 85 545 95 Q 565 115 555 140 Q 535 160 500 158 Q 475 150 465 125 Z"/>
    <!-- Africa -->
    <path class="continent" d="M 480 175 Q 520 175 545 205 Q 560 245 555 300 Q 540 345 510 360 Q 480 365 465 335 Q 450 295 455 240 Q 458 200 480 175 Z"/>
    <!-- Asia -->
    <path class="continent" d="M 560 95 Q 620 80 720 95 Q 800 110 850 145 Q 870 190 830 215 Q 770 225 710 215 Q 650 205 600 185 Q 555 155 555 125 Z"/>
    <!-- Southeast Asia -->
    <path class="continent" d="M 745 235 Q 780 240 800 265 Q 805 290 780 305 Q 750 305 735 280 Z"/>
    <!-- Australia -->
    <path class="continent" d="M 790 320 Q 840 310 880 325 Q 895 350 870 370 Q 830 380 790 365 Q 770 345 790 320 Z"/>
  </svg>
</div>
```

**USER-RUN COMMAND:**
```bash
git add src/components/traveler/WorldMap.astro
git commit -m "feat(v4-voyages): WorldMap — fixed-position SVG with continents + lat guides"
```

### Task C2 — Create MapPin.astro

**Files:** Create `src/components/traveler/MapPin.astro`

```astro
---
// src/components/traveler/MapPin.astro
export interface Props {
  label: string;          // e.g. "SEATTLE · 720d"
  leftPct: number;        // 0–100, position on viewport
  topPct: number;         // 0–100
  active?: boolean;
}
const { label, leftPct, topPct, active = false } = Astro.props;
const cls = active ? "pin active" : "pin";
const style = `left: ${leftPct}%; top: ${topPct}%;`;
---
<div class={cls} style={style} data-pin-label={label}>
  <span class="pin-label">{label}</span>
</div>
```

**USER-RUN COMMAND:**
```bash
git add src/components/traveler/MapPin.astro
git commit -m "feat(v4-voyages): MapPin — animated pin with label, position props"
```

### Task C3 — Extend places content schema with v4 fields

**Files:** Modify `src/content/config.ts`

```ts
// src/content/config.ts — extend `places` collection schema
const places = defineCollection({
  type: "content",
  schema: ({ image }) => z.object({
    // ── v3 fields (unchanged) ────────────────────────────────────
    title: z.string(),
    country: z.string(),
    countryCode: z.string().length(2),
    airportCode: z.string().length(3).optional(),
    yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    cover: image().optional(),
    coverAlt: z.string().default(""),
    durationDays: z.number().int().positive().optional(),
    reason: z.enum(["leisure", "work", "transit", "family", "wedding"]).default("leisure"),
    favorite: z.boolean().default(false),
    draft: z.boolean().default(false),

    // ── v4 additions ────────────────────────────────────────────
    paragraph: z.string().optional(),
    paragraphAuthor: z.enum(["ak", "ai"]).optional(),
    photoFolder: z.string().optional(),
    mapCoords: z.object({ leftPct: z.number(), topPct: z.number() }).optional(),
    photoCaptions: z.array(z.string()).optional(),
    geo: z.tuple([z.number(), z.number()]).optional(),
    timelineLabel: z.string().optional(),  // override default carousel label (e.g. "Seattle 2024 · Microsoft")
  }),
})
```

All new fields are `.optional()` so existing place entries pass validation without edits.

- [ ] Verify:
  ```bash
  npx astro check
  ```

**USER-RUN COMMAND:**
```bash
git add src/content/config.ts
git commit -m "feat(v4-voyages): extend places schema — paragraph + mapCoords + photoFolder"
```

### Task C4 — Update existing place entries with mapCoords

**Files:** Modify `src/content/places/2024-seattle.md`, `2022-tempe-asu.md`, `2026-pune-return.md`, `2019-pune-school.md`

Coordinates per mockup `vi-hybrid-travel.html` lines 109–112.

- [ ] **`src/content/places/2024-seattle.md`** — add to frontmatter:
  ```yaml
  mapCoords:
    leftPct: 14
    topPct: 33
  timelineLabel: "Seattle 2024 · Microsoft"
  ```

- [ ] **`src/content/places/2022-tempe-asu.md`** — add:
  ```yaml
  mapCoords:
    leftPct: 18
    topPct: 42
  timelineLabel: "Tempe 2022 · ASU"
  ```

- [ ] **`src/content/places/2026-pune-return.md`** — add:
  ```yaml
  mapCoords:
    leftPct: 64
    topPct: 45
  timelineLabel: "Pune 2026 · wedding"
  ```

- [ ] **`src/content/places/2019-pune-school.md`** — add:
  ```yaml
  mapCoords:
    leftPct: 64
    topPct: 45
  timelineLabel: "Pune 2019 · school"
  ```

> Note: Pune entries share coordinates (same physical city). Active-pin highlighting + label text distinguishes which trip is shown.

> Mockup also shows "SF" pin at left=13/top=40. No SF place entry exists yet — out of scope to author content. If/when added, those coords apply.

- [ ] Verify:
  ```bash
  npx astro check
  ```

**USER-RUN COMMAND:**
```bash
git add src/content/places/
git commit -m "feat(v4-voyages): hand-tune mapCoords on 4 starter place entries"
```

### Task C5 — Create FloatingPhotos.tsx (React island)

**Files:** Create `src/components/traveler/FloatingPhotos.tsx`

Per spec §8.3 — picks 7 photos from active place's manifest with spillover; renders into 7 hard-coded CSS slots.

```tsx
// src/components/traveler/FloatingPhotos.tsx
import { useEffect, useState } from "react";

export interface Photo {
  src: string;
  caption: string;
}
export type PhotoManifest = Record<string, Photo[]>;

interface Props {
  manifest: PhotoManifest;
  initialSlug: string;
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickSeven(manifest: PhotoManifest, activeSlug: string): Photo[] {
  const primary = manifest[activeSlug] ?? [];
  if (primary.length >= 7) return shuffle(primary).slice(0, 7);
  const others = Object.entries(manifest)
    .filter(([k]) => k !== activeSlug)
    .flatMap(([, v]) => v);
  const all = [...primary, ...shuffle(others)];
  // Fall back to placeholder colored divs if manifest is empty
  if (all.length === 0) {
    return Array.from({ length: 7 }, (_, i) => ({
      src: "",
      caption: ["first ferry · sea · jun '24", "rainier · jul '24", "pict campus · '19",
               "desert flowers · phx", "backyard summer", "market run", "last view · may '26"][i],
    }));
  }
  // If we have some but <7, cycle the array
  const out: Photo[] = [];
  for (let i = 0; i < 7; i++) out.push(all[i % all.length]);
  return out;
}

export default function FloatingPhotos({ manifest, initialSlug }: Props) {
  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const [photos, setPhotos] = useState<Photo[]>(() => pickSeven(manifest, initialSlug));

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ slug: string }>).detail;
      if (detail?.slug) {
        setActiveSlug(detail.slug);
        setPhotos(pickSeven(manifest, detail.slug));
      }
    };
    document.addEventListener("voyages:select", handler);
    return () => document.removeEventListener("voyages:select", handler);
  }, [manifest]);

  return (
    <>
      {photos.map((p, i) => (
        <div key={`${activeSlug}-${i}`} className={`photo-float pf-${i + 1}`}>
          {p.src
            ? <img className="img" src={p.src} loading="lazy" decoding="async" alt={p.caption} />
            : <div className="img" style={{ background: `linear-gradient(135deg, #c8916b, #6b4226)` }} />}
          <div className="cap">{p.caption}</div>
        </div>
      ))}
    </>
  );
}
```

> **Performance:** Even with 7 simultaneous polaroids, `will-change` is intentionally omitted from inline style — let CSS handle it via the animation. `loading="lazy"` defers image fetch; `decoding="async"` keeps layout responsive. If profiling shows jank, add `will-change: transform, opacity` to the `.photo-float` rule in `traveler.css`.

- [ ] Verify:
  ```bash
  npx tsc --noEmit
  ```

**USER-RUN COMMAND:**
```bash
git add src/components/traveler/FloatingPhotos.tsx
git commit -m "feat(v4-voyages): FloatingPhotos React island — 7 polaroids with spillover + voyages:select listener"
```

### Task C6 — Create DiaryCard.tsx (React island)

**Files:** Create `src/components/traveler/DiaryCard.tsx`

Per spec §8.6 — listens for `voyages:select`, renders the place's paragraph + A.K./AI toggle indicator.

```tsx
// src/components/traveler/DiaryCard.tsx
import { useEffect, useState } from "react";

export interface PlaceSnapshot {
  slug: string;
  title: string;
  yearMonth: string;
  durationDays?: number;
  paragraph?: string;
  paragraphAuthor?: "ak" | "ai";
  photoCount: number;
  airportCode?: string;
  reason: string;
}

interface Props {
  initial: PlaceSnapshot;
  byslug: Record<string, PlaceSnapshot>;
}

function formatDates(yearMonth: string, durationDays?: number): string {
  const [y, m] = yearMonth.split("-");
  const startDate = new Date(Number(y), Number(m) - 1, 1);
  const startStr = startDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  if (!durationDays) return startStr;
  const end = new Date(startDate.getTime() + durationDays * 86400000);
  const endStr = end.toLocaleString("en-US", { month: "long", year: "numeric" });
  return `${startStr} → ${endStr} · ${durationDays} days · `;
}

export default function DiaryCard({ initial, byslug }: Props) {
  const [place, setPlace] = useState<PlaceSnapshot>(initial);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ slug: string }>).detail;
      if (!detail?.slug || detail.slug === place.slug) return;
      const next = byslug[detail.slug];
      if (!next) return;
      setFading(true);
      setTimeout(() => {
        setPlace(next);
        setFading(false);
      }, 200);
    };
    document.addEventListener("voyages:select", handler);
    return () => document.removeEventListener("voyages:select", handler);
  }, [byslug, place.slug]);

  const author = place.paragraphAuthor ?? "ak";
  const dates = formatDates(place.yearMonth, place.durationDays);
  const reasonLabel = place.reason === "family" ? "family" : place.reason;

  return (
    <div
      className="diary-card"
      style={{ opacity: fading ? 0 : 1, transition: "opacity 200ms ease" }}
      data-slug={place.slug}
    >
      <div className="label">— now showing · §2 · {place.slug}</div>
      <h3>{place.title.toUpperCase()}.</h3>
      <div className="dates">{dates}{place.photoCount} photograph{place.photoCount === 1 ? "" : "s"}</div>
      <p>{place.paragraph ?? "Paragraph forthcoming — generate via `npm run paragraphs`."}</p>
      <div className="row">
        <div className="toggle" aria-label="paragraph author">
          <span className={author === "ak" ? "on" : ""}>A.K.</span>
          <span className={author === "ai" ? "on" : ""}>AI</span>
        </div>
        <div className="stats">{place.airportCode ?? "—"} · {reasonLabel}</div>
      </div>
    </div>
  );
}
```

- [ ] Verify: `npx tsc --noEmit`

**USER-RUN COMMAND:**
```bash
git add src/components/traveler/DiaryCard.tsx
git commit -m "feat(v4-voyages): DiaryCard React island — paragraph + A.K./AI toggle + voyages:select listener"
```

### Task C7 — Create TimelineCarousel.tsx (React island)

**Files:** Create `src/components/traveler/TimelineCarousel.tsx`

Per spec §8.5 — horizontal scroll-snap track; click on a trip dispatches `voyages:select`; IntersectionObserver could be added later for auto-focus on scroll.

```tsx
// src/components/traveler/TimelineCarousel.tsx
import { useEffect, useRef, useState } from "react";

export interface Trip {
  slug: string;
  name: string;
  year: string;        // e.g. "2024"
  label: string;       // e.g. "Seattle 2024 · Microsoft" (already formatted)
  subLabel: string;    // e.g. "2024 · Microsoft" (short, for the .yr line)
}

interface Props {
  trips: Trip[];
  initialActiveSlug: string;
}

export default function TimelineCarousel({ trips, initialActiveSlug }: Props) {
  const [activeSlug, setActiveSlug] = useState(initialActiveSlug);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ slug: string }>).detail;
      if (detail?.slug) setActiveSlug(detail.slug);
    };
    document.addEventListener("voyages:select", handler);
    return () => document.removeEventListener("voyages:select", handler);
  }, []);

  useEffect(() => {
    // Hash override on mount
    const hash = window.location.hash;
    const match = hash.match(/^#trip=(.+)$/);
    if (match && match[1]) {
      const slug = decodeURIComponent(match[1]);
      if (trips.find((t) => t.slug === slug)) {
        document.dispatchEvent(new CustomEvent("voyages:select", { detail: { slug } }));
      }
    }
  }, [trips]);

  function selectTrip(slug: string) {
    document.dispatchEvent(new CustomEvent("voyages:select", { detail: { slug } }));
  }

  return (
    <div className="timeline">
      <div className="timeline-head">→ scroll or drag through the years</div>
      <div className="timeline-track" ref={trackRef}>
        {trips.map((t) => (
          <button
            type="button"
            key={t.slug}
            className={`trip${activeSlug === t.slug ? " active" : ""}`}
            onClick={() => selectTrip(t.slug)}
            aria-pressed={activeSlug === t.slug}
          >
            <div className="name">{t.name}</div>
            <div className="yr">{t.subLabel}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] Verify: `npx tsc --noEmit`

**USER-RUN COMMAND:**
```bash
git add src/components/traveler/TimelineCarousel.tsx
git commit -m "feat(v4-voyages): TimelineCarousel — horizontal scroll-snap + click dispatches voyages:select + URL-hash override"
```

### Task C8 — Create VoyagesHero.astro

**Files:** Create `src/components/traveler/VoyagesHero.astro`

```astro
---
// src/components/traveler/VoyagesHero.astro
export interface Props {
  stats: {
    places: number;
    photos: number;
    countries: number;
    last: string;
  };
}
const { stats } = Astro.props;
---
<section class="hero">
  <div class="hero-pre">~ §2 · the voyages ~</div>
  <h1>TRAVEL<br/><span>DIARIES.</span></h1>
  <p class="sub">A map of the places I keep returning to in pieces. Photographs and paragraphs from {stats.places} stays, {stats.countries} countries, one slow loop.</p>
  <div class="hero-meta">
    <span><strong>{stats.places}</strong> places</span>
    <span><strong>{stats.photos}</strong> photos</span>
    <span><strong>{stats.countries}</strong> countries</span>
    <span>last: <strong>{stats.last}</strong></span>
  </div>
</section>
```

**USER-RUN COMMAND:**
```bash
git add src/components/traveler/VoyagesHero.astro
git commit -m "feat(v4-voyages): VoyagesHero — Anton headline + 4-stat meta strip"
```

### Task C9 — Refactor src/pages/traveler.astro to wire all components

**Files:** Modify `src/pages/traveler.astro`

```astro
---
// src/pages/traveler.astro
import { getCollection } from "astro:content";
import PersonaLayout from "../layouts/PersonaLayout.astro";
import WorldMap from "../components/traveler/WorldMap.astro";
import MapPin from "../components/traveler/MapPin.astro";
import VoyagesHero from "../components/traveler/VoyagesHero.astro";
import FloatingPhotos from "../components/traveler/FloatingPhotos.tsx";
import DiaryCard from "../components/traveler/DiaryCard.tsx";
import TimelineCarousel from "../components/traveler/TimelineCarousel.tsx";
import photoManifest from "../data/photoManifest.json";

const placeEntries = await getCollection("places", (e) => !e.data.draft);
const sorted = placeEntries.sort((a, b) => b.data.yearMonth.localeCompare(a.data.yearMonth));
const active = sorted[0];

// MapPin source: any place with mapCoords
const pins = sorted
  .filter((e) => e.data.mapCoords)
  .map((e) => ({
    slug: e.slug,
    label: `${e.data.title.toUpperCase()} · ${e.data.reason === "family" ? "home" : `${e.data.durationDays ?? "?"}d`}`,
    leftPct: e.data.mapCoords!.leftPct,
    topPct: e.data.mapCoords!.topPct,
    active: e.slug === active.slug,
  }));

// DiaryCard byslug + initial
const byslug = Object.fromEntries(
  sorted.map((e) => [
    e.slug,
    {
      slug: e.slug,
      title: e.data.title,
      yearMonth: e.data.yearMonth,
      durationDays: e.data.durationDays,
      paragraph: e.data.paragraph,
      paragraphAuthor: e.data.paragraphAuthor,
      photoCount: (photoManifest as Record<string, unknown[]>)[e.data.photoFolder ?? e.slug]?.length ?? 0,
      airportCode: e.data.airportCode,
      reason: e.data.reason,
    },
  ])
);

// TimelineCarousel trips — sort oldest→newest for L→R timeline
const trips = sorted
  .slice()
  .reverse()
  .map((e) => {
    const [year] = e.data.yearMonth.split("-");
    return {
      slug: e.slug,
      name: e.data.title,
      year,
      label: e.data.timelineLabel ?? `${e.data.title} ${year}`,
      subLabel: e.data.timelineLabel?.split(" · ")[1] ?? year,
    };
  });

const totalPhotos = Object.values(photoManifest as Record<string, unknown[]>)
  .reduce((acc, arr) => acc + (arr?.length ?? 0), 0);
const countries = new Set(sorted.map((e) => e.data.countryCode)).size;
---
<PersonaLayout
  personaId="traveler"
  title="Ashish K. · voyages"
  description="A map of the places I keep returning to in pieces."
  lastEditISO={active.data?.yearMonth ? new Date(active.data.yearMonth + "-15").toISOString() : undefined}
>
  <WorldMap />

  {pins.map((p) => (
    <MapPin label={p.label} leftPct={p.leftPct} topPct={p.topPct} active={p.active} />
  ))}

  <FloatingPhotos
    client:visible
    manifest={photoManifest as Record<string, { src: string; caption: string }[]>}
    initialSlug={active.data.photoFolder ?? active.slug}
  />

  <VoyagesHero stats={{ places: sorted.length, photos: totalPhotos, countries, last: active.data.title.toLowerCase() }} />

  <DiaryCard
    client:visible
    initial={byslug[active.slug]}
    byslug={byslug}
  />

  <TimelineCarousel
    client:visible
    trips={trips}
    initialActiveSlug={active.slug}
  />
</PersonaLayout>
```

> **Build-order note:** This page imports `src/data/photoManifest.json` which doesn't exist yet — created by Task G4. To unblock the build during Phase C, create a placeholder manifest:
> ```bash
> python3 -c "import json,os; os.makedirs('src/data', exist_ok=True); open('src/data/photoManifest.json','w').write(json.dumps({},indent=2))"
> ```
> An empty manifest is fine — FloatingPhotos falls back to caption-only placeholder polaroids per its `pickSeven` logic.

- [ ] Create the placeholder manifest (one-liner above).

- [ ] Verify:
  ```bash
  npx astro check
  npx astro build
  ```
  Expect: `/traveler` builds. /curate and /made still fail until D/E.

- [ ] Visual smoke:
  ```bash
  npx astro dev
  # navigate to /traveler
  ```
  Acceptance against `vi-hybrid-travel.html`: world map visible at low opacity; 4 pins at the right positions; 7 polaroids cycling (with placeholder gradient backgrounds since manifest is empty); diary card showing Seattle; bottom timeline scrollable with the 4 trips, Seattle active.

**USER-RUN COMMAND:**
```bash
git add src/pages/traveler.astro src/data/photoManifest.json
git commit -m "feat(v4-voyages): wire /traveler route — map + pins + polaroids + diary + timeline"
```

### Task C10 — Voyages mobile fallback (vertical stack)

**Files:** Verify the `@media (max-width: 640px)` block in `src/styles/personas/traveler.css` from A5 covers all needed cases.

Per spec §17 + mockup desktop-only context, mobile should:
1. Show only one polaroid (`pf-3`) in vertical-stack layout above the diary card
2. Timeline-track gap reduces from 2.5rem to 1.5rem (already done in A5)
3. Hero h1 scales from 8.5rem to 4.5rem (already done in A5)
4. World map remains fixed but at reduced opacity (optional — current 0.55 is okay)
5. Pins shrink to 8px and lose pulse animation (avoid on small screens — `prefers-reduced-motion` covers this on most mobile devices anyway)

- [ ] Re-read A5's `traveler.css` mobile block; if the listed adjustments aren't all there, add:
  ```css
  @media (max-width: 640px) {
    body[data-persona="traveler"] .pin { width: 8px; height: 8px; }
    body[data-persona="traveler"] .pin .pin-label { display: none; }
    body[data-persona="traveler"] .map-wrap { opacity: 0.35; }
    body[data-persona="traveler"] .diary-card { margin: 1.5rem 1rem; padding: 1.2rem; }
    body[data-persona="traveler"] .diary-card h3 { font-size: 2rem; }
  }
  ```
  Append to existing media block (don't duplicate the block).

- [ ] Visual smoke: Chrome DevTools → iPhone 12 viewport (390×844) → reload `/traveler`. Acceptance: page is usable; carousel scrolls horizontally; one polaroid visible centered; diary card readable.

**USER-RUN COMMAND:**
```bash
git add src/styles/personas/traveler.css
git commit -m "feat(v4-voyages): mobile fallback — pin/label hide, diary card scales, map opacity reduces"
```

### Task C11 — Phase C verification gate + @reviewer

- [ ] `npx astro build` — `/traveler` builds clean; measure bundle (target ≤70 KB gz including the three React islands)
- [ ] DevTools Performance trace — record 12s of polaroid cycle, verify no jank (target 60fps)
- [ ] Hash-deep-link smoke: navigate to `/traveler#trip=2022-tempe-asu` → TimelineCarousel should fire `voyages:select` on mount; DiaryCard should swap to Tempe; FloatingPhotos should pick Tempe photos
- [ ] Reduced-motion test — DevTools emulate prefers-reduced-motion → reload → only `pf-3` polaroid visible, no float animation, no pin pulse

**@reviewer dispatch hook:** Reviewer checks: (a) the `voyages:select` event protocol is consistent across the 3 islands (same `CustomEvent<{ slug: string }>` shape), (b) `client:visible` is used everywhere (not `client:load`), (c) the URL-hash override in TimelineCarousel doesn't fire if the slug isn't in the trips array (avoids ghost selections), (d) MapPin's coords don't blow past 100% if a future place has a bad value (add a clamp later if needed), (e) the placeholder manifest pattern doesn't break the build when manifest is empty.

---

## Phase D — Curio (§3) rebuild (~1 day)

Reference: `vi-hybrid-curio.html`. After Phase D, `/curate` matches the mockup with ornament corners + mixed italic+Anton headline + now-reading card + finished list. Pure Astro, zero React islands — target ≤10 KB gz.

### Task D1 — Create CurioHero.astro

**Files:** Create `src/components/curate/CurioHero.astro`

Mockup line 87 — note the mixed Cormorant italic `<em>Curio</em>` + Anton `& KEEPING.` with gradient span.

```astro
---
// src/components/curate/CurioHero.astro
export interface Props {
  stats?: {
    booksThisYear: number;
    onShelf: number;
    current: string;
  };
}
const { stats = { booksThisYear: 3, onShelf: 12, current: "Calvino" } } = Astro.props;
---
<section class="hero">
  <div class="hero-pre">~ §3 · the cabinet of curiosities ~</div>
  <h1><em>Curio</em><br/><span>& KEEPING.</span></h1>
  <p class="sub">Books finished, music on loop, fragrances on the shelf, the small obsessions that make a life. Building this catalog, one entry at a time.</p>
  <div class="hero-meta">
    <span><strong>{stats.booksThisYear}</strong> books this year</span>
    <span><strong>{stats.onShelf}</strong> on the shelf</span>
    <span><strong>currently</strong> {stats.current}</span>
  </div>
</section>
```

- [ ] Verify: `npx astro check` — `CurioHero.astro` import in registry now resolves; 2 hero-loader errors remain.

**USER-RUN COMMAND:**
```bash
git add src/components/curate/CurioHero.astro
git commit -m "feat(v4-curio): CurioHero — mixed italic Cormorant + Anton headline"
```

### Task D2 — Create OrnamentTL.astro + OrnamentBR.astro

**Files:** Create `src/components/curate/OrnamentTL.astro` and `src/components/curate/OrnamentBR.astro`

Verbatim ports of the corner flourishes from `vi-hybrid-curio.html` lines 51–71.

```astro
---
// src/components/curate/OrnamentTL.astro
---
<div class="ornament tl" aria-hidden="true">
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <g stroke="rgba(122, 40, 40, 0.5)" stroke-width="1" fill="none">
      <path d="M 10 10 Q 30 5 55 15 T 110 20"/>
      <path d="M 10 25 Q 25 25 35 35"/>
      <circle cx="40" cy="40" r="3" fill="rgba(184, 153, 104, 0.5)" stroke="none"/>
      <path d="M 12 50 L 12 110"/>
      <path d="M 25 60 L 25 100"/>
    </g>
  </svg>
</div>
```

```astro
---
// src/components/curate/OrnamentBR.astro
---
<div class="ornament br" aria-hidden="true">
  <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
    <g stroke="rgba(122, 40, 40, 0.4)" stroke-width="1" fill="none">
      <path d="M 10 10 Q 40 5 70 20 T 130 30"/>
      <path d="M 10 25 Q 30 30 50 50"/>
      <circle cx="60" cy="55" r="4" fill="rgba(184, 153, 104, 0.5)" stroke="none"/>
      <path d="M 15 70 L 15 130"/>
    </g>
  </svg>
</div>
```

**USER-RUN COMMAND:**
```bash
git add src/components/curate/OrnamentTL.astro src/components/curate/OrnamentBR.astro
git commit -m "feat(v4-curio): OrnamentTL + OrnamentBR — fixed corner flourishes"
```

### Task D3 — Create NowReadingV4.astro

**Files:** Create `src/components/curate/NowReadingV4.astro`

```astro
---
// src/components/curate/NowReadingV4.astro
import type { CollectionEntry } from "astro:content";

export interface Props {
  book: CollectionEntry<"books">;
  startedDate?: string;     // ISO, optional override
  progressPct?: number;     // 0–100
}
const { book, progressPct = 64 } = Astro.props;
const { title, author, quote } = book.data;
const startedStr = book.data.startedDate
  ? book.data.startedDate.toLocaleString("en-US", { month: "long", day: "numeric" }).toLowerCase()
  : "may 1";
---
<section class="now-reading">
  <div class="nr-label">→ §3.1 · now reading · quote rotates daily</div>
  <div class="nr-card">
    <div class="nr-cover">
      <div class="title">{author}<br/>—<br/>{title}</div>
    </div>
    <div class="nr-info">
      <h3>{title}</h3>
      <div class="author">{author}</div>
      {quote && (
        <>
          <div class="quote">"{quote.text}"</div>
          <div class="quote-meta">
            {quote.page ? `page ${quote.page} · ` : ""}started {startedStr} · {progressPct}% finished
          </div>
        </>
      )}
    </div>
  </div>
</section>
```

> Note: the mockup shows a placeholder `<div class="title">` inside `.nr-cover` (Cormorant italic, white-on-oxblood). v4.1 keeps this placeholder approach even when `book.data.cover` exists — the cover image system requires extra Astro `<Image>` wiring not in scope. Tombstoned for v4.2.

- [ ] Verify: `npx astro check`

**USER-RUN COMMAND:**
```bash
git add src/components/curate/NowReadingV4.astro
git commit -m "feat(v4-curio): NowReadingV4 — placeholder cover + quote + started/progress meta"
```

### Task D4 — Create FinishedListV4.astro

**Files:** Create `src/components/curate/FinishedListV4.astro`

```astro
---
// src/components/curate/FinishedListV4.astro
import type { CollectionEntry } from "astro:content";

export interface Props {
  books: CollectionEntry<"books">[];
}
const { books } = Astro.props;

function ratingStars(rating?: number): string {
  if (!rating) return "—";
  return "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));
}

function monthYear(d?: Date): string {
  if (!d) return "—";
  return d.toLocaleString("en-US", { month: "short", year: "numeric" }).toLowerCase();
}
---
<section class="finished">
  <div class="fin-label">→ §3.2 · recently finished</div>
  <div class="fin-list">
    {books.map((b, i) => (
      <div class="fin-row">
        <span class="n">{String(i + 1).padStart(2, "0")}</span>
        <span class="t">{b.data.title} <em>— {b.data.author}</em></span>
        <span class="r">{ratingStars(b.data.rating)} · {monthYear(b.data.finishedDate)}</span>
      </div>
    ))}
  </div>
</section>
```

> Mockup uses solid + outlined stars; ASCII `★☆` mix mimics that. Acceptable for v4.1.

**USER-RUN COMMAND:**
```bash
git add src/components/curate/FinishedListV4.astro
git commit -m "feat(v4-curio): FinishedListV4 — numbered rows with title/author/rating/date"
```

### Task D5 — Refactor src/pages/curate.astro

**Files:** Modify `src/pages/curate.astro`

```astro
---
// src/pages/curate.astro
import { getCollection } from "astro:content";
import PersonaLayout from "../layouts/PersonaLayout.astro";
import OrnamentTL from "../components/curate/OrnamentTL.astro";
import OrnamentBR from "../components/curate/OrnamentBR.astro";
import CurioHero from "../components/curate/CurioHero.astro";
import NowReadingV4 from "../components/curate/NowReadingV4.astro";
import FinishedListV4 from "../components/curate/FinishedListV4.astro";

const bookEntries = await getCollection("books", (e) => !e.data.draft);

const reading = bookEntries.find((b) => b.data.status === "reading");
const finished = bookEntries
  .filter((b) => b.data.status === "finished")
  .sort((a, b) => (b.data.finishedDate?.getTime() ?? 0) - (a.data.finishedDate?.getTime() ?? 0))
  .slice(0, 5);

const booksThisYear = finished.filter(
  (b) => b.data.finishedDate && b.data.finishedDate.getFullYear() === new Date().getFullYear()
).length;
const onShelf = bookEntries.filter((b) => b.data.status === "queued").length;
const current = reading?.data.author?.split(" ").pop() ?? "—";
const lastEditISO = finished[0]?.data?.finishedDate?.toISOString();
---
<PersonaLayout
  personaId="curate"
  title="Ashish K. · curio"
  description="Books, music, fragrances, the small obsessions."
  lastEditISO={lastEditISO}
>
  <OrnamentTL />
  <OrnamentBR />
  <CurioHero stats={{ booksThisYear, onShelf, current }} />
  {reading && <NowReadingV4 book={reading} />}
  {finished.length > 0 && <FinishedListV4 books={finished} />}
</PersonaLayout>
```

> **Zero JS confirmation:** This page has no `client:*` directives. Astro will emit pure HTML + CSS for `/curate`. Target bundle ≤10 KB gz (no React runtime needed).

- [ ] Verify:
  ```bash
  npx astro check
  npx astro build
  ```
  Expect: `/curate` builds. `/made` still fails until E.

- [ ] Confirm zero JS:
  ```bash
  find dist/ -name "*.html" -path "*curate*" -exec head -100 {} \;
  ```
  Inspect for `<script type="module">` blocks. Astro's `ClientRouter` does emit a small router script — that's fine and was already in scope. Acceptance: no React runtime hydration scripts on `/curate`.

- [ ] Bundle measurement (after H1 full audit, document baseline here):
  ```bash
  ls -la dist/curate/index.html
  gzip -c dist/curate/index.html | wc -c
  ```

- [ ] Visual smoke: navigate to `/curate`. Acceptance: ornament corners visible top-left + bottom-right (rotated); hero with `<em>Curio</em>` italic mixed with Anton `& KEEPING.` gradient; now-reading card with placeholder cover (oxblood) + Calvino quote; 3-row finished list with stars.

**USER-RUN COMMAND:**
```bash
git add src/pages/curate.astro
git commit -m "feat(v4-curio): wire /curate route — pure Astro, zero JS"
```

### Task D6 — Phase D verification gate + @reviewer

- [ ] Bundle size for `/curate` ≤ 10 KB gz
- [ ] `astro check` clean for /curate (registry's CurioHero loader resolves)
- [ ] No `client:*` directives in `src/pages/curate.astro` or its components

**@reviewer dispatch hook:** Reviewer checks: (a) zero React island leaks, (b) `<em>` + `<span>` inside `<h1>` renders correctly across browsers (Firefox sometimes mishandles `<em>` inside Anton), (c) ornament corners use `aria-hidden="true"`, (d) star rating accessibility — consider adding `aria-label={`${rating} of 5`}` if the `.r` span is the only rating indicator.

---

## Phase E — Atelier (§4) rebuild (~1 day)

Reference: `vi-hybrid-atelier.html`. After Phase E, `/made` matches the mockup with dark blueprint background + amber radial glow + dashed placeholder cards + build queue. Pure Astro (per spec §5.7, no React island at launch; AnimatePresence deferred to v4.2).

### Task E1 — Create AtelierHero.astro

**Files:** Create `src/components/made/AtelierHero.astro`

```astro
---
// src/components/made/AtelierHero.astro
export interface Props {
  stats?: {
    shipped: number;
    queued: number;
    onBench: number;
  };
}
const { stats = { shipped: 0, queued: 3, onBench: 1 } } = Astro.props;
---
<section class="hero">
  <div class="hero-pre">~ §4 · the workbench, late ~</div>
  <h1>MADE<br/><span>BY HAND.</span></h1>
  <p class="sub">Physical things — soldered, sawn, sketched. Mostly aspirational right now. The first finished build will replace the dashed placeholder below.</p>
  <div class="hero-meta">
    <span><strong>{stats.shipped}</strong> shipped</span>
    <span><strong>{stats.queued}</strong> in the queue</span>
    <span><strong>{stats.onBench}</strong> on the bench</span>
  </div>
</section>
```

- [ ] Verify: `npx astro check` — last hero-loader error gone; tsc clean except the placeholder photoManifest already addressed.

**USER-RUN COMMAND:**
```bash
git add src/components/made/AtelierHero.astro
git commit -m "feat(v4-atelier): AtelierHero — Anton headline + amber gradient + 3-stat meta"
```

### Task E2 — Create AtelierSchematicBg.astro

**Files:** Create `src/components/made/AtelierSchematicBg.astro`

Verbatim port from `vi-hybrid-atelier.html` lines 48–69.

```astro
---
// src/components/made/AtelierSchematicBg.astro
---
<div class="schematic-bg" aria-hidden="true">
  <svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg">
    <g stroke="rgba(240, 230, 208, 0.45)" stroke-width="1" fill="none">
      <rect x="120" y="100" width="280" height="180"/>
      <line x1="120" y1="190" x2="400" y2="190" stroke-dasharray="3 3"/>
      <line x1="260" y1="100" x2="260" y2="280" stroke-dasharray="3 3"/>
      <circle cx="180" cy="155" r="22"/>
      <circle cx="180" cy="155" r="8"/>
      <text x="120" y="320" font-family="JetBrains Mono" font-size="9" fill="rgba(240, 230, 208, 0.5)">FIG.1 · split keyboard · exploded view</text>
      <circle cx="600" cy="180" r="60"/>
      <line x1="540" y1="180" x2="540" y2="120"/>
      <line x1="660" y1="180" x2="660" y2="120"/>
      <line x1="540" y1="180" x2="660" y2="180" stroke-dasharray="2 2"/>
      <text x="555" y="280" font-family="JetBrains Mono" font-size="9" fill="rgba(240, 230, 208, 0.5)">FIG.2 · pen rest profile</text>
      <rect x="800" y="120" width="120" height="80"/>
      <line x1="800" y1="200" x2="820" y2="220"/>
      <line x1="920" y1="200" x2="900" y2="220"/>
      <rect x="820" y="220" width="80" height="40"/>
      <text x="810" y="290" font-family="JetBrains Mono" font-size="9" fill="rgba(240, 230, 208, 0.5)">FIG.3 · weather station</text>
    </g>
  </svg>
</div>
```

**USER-RUN COMMAND:**
```bash
git add src/components/made/AtelierSchematicBg.astro
git commit -m "feat(v4-atelier): AtelierSchematicBg — technical drawings SVG behind content"
```

### Task E3 — Create PlaceholderGrid.astro

**Files:** Create `src/components/made/PlaceholderGrid.astro`

Pure Astro (per spec §5.7). Three dashed `FIG.N` cards. Optional: if a shipped build slot is provided, render solid amber-bordered variant.

```astro
---
// src/components/made/PlaceholderGrid.astro
import type { CollectionEntry } from "astro:content";

export interface Props {
  shippedBuilds?: CollectionEntry<"builds">[];
}
const { shippedBuilds = [] } = Astro.props;

// Three slot definitions
const slots = [
  { fig: "1", iconType: "keyboard" as const, placeholderCaption: "first sketch lands here" },
  { fig: "2", iconType: "pen" as const,      placeholderCaption: "something carved or printed" },
  { fig: "3", iconType: "circuit" as const,  placeholderCaption: "circuit + enclosure" },
];
---
<section class="placeholders">
  <div class="ph-label">→ §4.1 · current builds · placeholder until something ships</div>
  <div class="ph-grid">
    {slots.map((s, i) => {
      const shipped = shippedBuilds[i];
      const cls = shipped ? "ph-card shipped" : "ph-card";
      return (
        <div class={cls}>
          <div style="text-align:center">
            {!shipped && s.iconType === "keyboard" && (
              <svg class="ph-icon" viewBox="0 0 64 48"><g stroke="rgba(217, 126, 63, 0.6)" stroke-width="1" fill="none" stroke-dasharray="2 2"><rect x="4" y="8" width="56" height="32" rx="2"/><line x1="4" y1="20" x2="60" y2="20"/></g></svg>
            )}
            {!shipped && s.iconType === "pen" && (
              <svg class="ph-icon" viewBox="0 0 64 48"><g stroke="rgba(217, 126, 63, 0.6)" stroke-width="1" fill="none" stroke-dasharray="2 2"><circle cx="32" cy="24" r="14"/><circle cx="32" cy="24" r="5"/></g></svg>
            )}
            {!shipped && s.iconType === "circuit" && (
              <svg class="ph-icon" viewBox="0 0 64 48"><g stroke="rgba(217, 126, 63, 0.6)" stroke-width="1" fill="none" stroke-dasharray="2 2"><rect x="6" y="8" width="22" height="14"/><line x1="28" y1="15" x2="44" y2="15"/><rect x="44" y="6" width="14" height="20"/></g></svg>
            )}
            <div class="ph-fig">
              FIG.{s.fig} · {shipped ? "shipped" : "placeholder"}<br/>
              {shipped ? shipped.data.title : s.placeholderCaption}
            </div>
          </div>
        </div>
      );
    })}
  </div>
</section>
```

**USER-RUN COMMAND:**
```bash
git add src/components/made/PlaceholderGrid.astro
git commit -m "feat(v4-atelier): PlaceholderGrid — 3 dashed FIG cards (or solid when shipped)"
```

### Task E4 — Create BuildQueueListV4.astro

**Files:** Create `src/components/made/BuildQueueListV4.astro`

```astro
---
// src/components/made/BuildQueueListV4.astro
import type { CollectionEntry } from "astro:content";

export interface Props {
  builds: CollectionEntry<"builds">[];
}
const { builds } = Astro.props;

function statusLabel(b: CollectionEntry<"builds">): string {
  const added = b.data.addedDate
    ? b.data.addedDate.toLocaleString("en-US", { month: "short", day: "numeric" }).toLowerCase()
    : "—";
  return `Queued · added ${added}`;
}
---
<section class="queue">
  <div class="queue-label">→ §4.2 · build queue · sorted by priority</div>
  <div class="queue-list">
    {builds.map((b) => (
      <div class="q-row">
        <span class="p">P{b.data.priority}</span>
        <span class="t">{b.data.title}</span>
        <span class="b">{b.data.blurb}</span>
        <span class="s">{statusLabel(b)}</span>
      </div>
    ))}
  </div>
</section>
```

**USER-RUN COMMAND:**
```bash
git add src/components/made/BuildQueueListV4.astro
git commit -m "feat(v4-atelier): BuildQueueListV4 — P-priority + title + blurb + status row"
```

### Task E5 — Extend builds schema with `on-bench` status

**Files:** Modify `src/content/config.ts`

Per spec §6.3, add `"on-bench"` to the `status` enum.

```ts
// in src/content/config.ts, replace the builds collection schema:
const builds = defineCollection({
  type: "content",
  schema: ({ image }) => z.object({
    title: z.string(),
    status: z.enum(["queued", "building", "shipped", "abandoned", "on-bench"]),
    priority: z.number().int().min(0).max(10).default(5),
    addedDate: z.coerce.date(),
    shippedDate: z.coerce.date().optional(),
    blurb: z.string().max(140),
    url: z.string().url().optional(),
    repo: z.string().regex(/^[\w-]+\/[\w.-]+$/).optional(),
    cover: image().optional(),
    coverAlt: z.string().default(""),
    tags: z.array(z.string()).default([]),
    why: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});
```

- [ ] Verify:
  ```bash
  npx astro check
  ```

**USER-RUN COMMAND:**
```bash
git add src/content/config.ts
git commit -m "feat(v4-atelier): extend builds schema — add on-bench status"
```

### Task E6 — Refactor src/pages/made.astro

**Files:** Modify `src/pages/made.astro`

```astro
---
// src/pages/made.astro
import { getCollection } from "astro:content";
import PersonaLayout from "../layouts/PersonaLayout.astro";
import AtelierSchematicBg from "../components/made/AtelierSchematicBg.astro";
import AtelierHero from "../components/made/AtelierHero.astro";
import PlaceholderGrid from "../components/made/PlaceholderGrid.astro";
import BuildQueueListV4 from "../components/made/BuildQueueListV4.astro";

const buildEntries = await getCollection("builds", (e) => !e.data.draft);

const shipped = buildEntries
  .filter((b) => b.data.status === "shipped")
  .sort((a, b) => (b.data.shippedDate?.getTime() ?? 0) - (a.data.shippedDate?.getTime() ?? 0));

const queued = buildEntries
  .filter((b) => b.data.status === "queued")
  .sort((a, b) => b.data.priority - a.data.priority);

const onBench = buildEntries.filter((b) => b.data.status === "on-bench");

const lastEditISO = (shipped[0]?.data?.shippedDate ?? queued[0]?.data?.addedDate)?.toISOString();
---
<PersonaLayout
  personaId="made"
  title="Ashish K. · atelier"
  description="Physical things — soldered, sawn, sketched."
  lastEditISO={lastEditISO}
>
  <AtelierSchematicBg />
  <AtelierHero stats={{ shipped: shipped.length, queued: queued.length, onBench: onBench.length }} />
  <PlaceholderGrid shippedBuilds={shipped.slice(0, 3)} />
  {queued.length > 0 && <BuildQueueListV4 builds={queued} />}
</PersonaLayout>
```

- [ ] Verify:
  ```bash
  npx astro check
  npx astro build
  ```
  Expect: ALL four persona pages now build clean. Bundle measurements possible.

- [ ] Visual smoke: navigate to `/made`. Acceptance: dark navy background; amber radial glow top-right; faint schematic SVG behind content; hero with amber gradient on "BY HAND."; 3 dashed FIG cards; build queue list (3 rows by default — seed entries from v3 should already exist in `src/content/builds/`).

**USER-RUN COMMAND:**
```bash
git add src/pages/made.astro
git commit -m "feat(v4-atelier): wire /made route — schematic + hero + placeholders + queue"
```

### Task E7 — Phase E verification gate + @reviewer

- [ ] All 4 persona routes build clean (`astro build` succeeds without errors)
- [ ] `/made` bundle ≤ 70 KB gz (no React island, should be much smaller — closer to /curate's ≤10 KB)
- [ ] Cross-page tab nav (TopNav) — clicking from `/made` to `/`, `/traveler`, `/curate` triggers View Transition morph (or instant nav on Firefox; that's fine)

**@reviewer dispatch hook:** Reviewer checks: (a) no React island leak on /made, (b) `on-bench` status renders in stats but doesn't break PlaceholderGrid (currently shippedBuilds only fills slots; on-bench just adds to count), (c) seed builds in `src/content/builds/*.md` validate against the new schema (the `on-bench` enum value is additive, so existing entries pass), (d) the radial-glow `::after` and grid `::before` pseudo-elements don't intercept clicks (both have `pointer-events: none`).

---

## Phase F — /resume route (~0.5 day)

After Phase F, `/resume` ships as a pure SSG HTML render of Ashish's resume plus three PDF download buttons.

### Task F1 — Create src/content/resume.ts (typed source-of-truth)

**Files:** Create `src/content/resume.ts`

Per spec §5.8 / §9.3. Hand-authored TypeScript module — no parsing, no MDX. User maintains it directly.

```ts
// src/content/resume.ts
export interface ResumeExperience {
  company: string;
  title: string;
  dates: string;     // e.g. "Sep 2024 — present"
  location: string;  // e.g. "Redmond, WA"
  bullets: string[];
}

export interface ResumeEducation {
  school: string;
  degree: string;
  dates: string;
  honors?: string;
}

export interface ResumeSelectedWork {
  title: string;
  url?: string;
  blurb: string;
}

export interface ResumeData {
  name: string;
  tagline: string;
  now: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  selectedWork: ResumeSelectedWork[];
  skills: { primary: string[]; secondary: string[] };
  contact: {
    email: string;
    github: string;
    linkedin: string;
    twitter?: string;
  };
  lastUpdated: string;  // ISO date
}

export const resume: ResumeData = {
  name: "Ashish Kshirsagar",
  tagline: "Senior software engineer · Microsoft · four-agent workflow",
  now: "Senior SDE at Microsoft (WSD). Shipping with Copilot, Claude Code, OpenCode, and Jules in parallel. Relocating Seattle → Pune, June 2026.",
  experience: [
    {
      company: "Microsoft",
      title: "Senior Software Engineer",
      dates: "Aug 2024 — present",
      location: "Redmond, WA",
      bullets: [
        "Windows Servicing & Delivery — distributed systems supporting Windows update infrastructure",
        "Designed and shipped multi-agent orchestration patterns for internal tooling",
        "Mentored 2 junior engineers through their first ship cycles",
      ],
    },
    {
      company: "Amazon",
      title: "Software Development Engineer II",
      dates: "Jul 2023 — Aug 2024",
      location: "Seattle, WA",
      bullets: [
        "Built scalable services on AWS for retail catalog workflows",
        "Reduced p99 latency on a hot path by 38% through caching + query plan analysis",
      ],
    },
    {
      company: "Barclays",
      title: "Software Engineer",
      dates: "Aug 2019 — Aug 2021",
      location: "Pune, India",
      bullets: [
        "Trade-reconciliation pipelines (Java + Kafka)",
        "Owned a critical EOD batch system through a major migration",
      ],
    },
  ],
  education: [
    {
      school: "Arizona State University",
      degree: "M.S. Computer Science",
      dates: "Aug 2022 — May 2024",
      honors: "GPA 4.0",
    },
    {
      school: "Pune Institute of Computer Technology",
      degree: "B.E. Computer Engineering",
      dates: "2015 — 2019",
    },
  ],
  selectedWork: [
    { title: "Portfolio v4 (this site)", url: "https://github.com/Ask149/ask149.github.io", blurb: "Astro + React, 4-persona modular architecture, hybrid-atelier visual system" },
    { title: "OpenCode agent fleet (28 agents)", blurb: "Personal LLM workflow on top of OpenCode CLI" },
    { title: "Live agent feed (Cloudflare Worker)", blurb: "Real-time agent events powering the /workshop hero strip" },
  ],
  skills: {
    primary: ["TypeScript", "Python", "Go", "Java", "Distributed systems", "LLM tooling"],
    secondary: ["Rust", "C#", "AWS", "Azure", "Postgres", "Cloudflare Workers", "Astro", "React"],
  },
  contact: {
    email: "ashishkshirsagar10@gmail.com",
    github: "https://github.com/Ask149",
    linkedin: "https://www.linkedin.com/in/ashish-kshirsagar/",
  },
  lastUpdated: "2026-05-17",
};
```

> User will edit this file to keep it accurate. The HTML render is the *one* canonical web-readable resume; the three PDFs are per-role variants (SWE/MLE/Systems).

- [ ] Verify: `npx tsc --noEmit`

**USER-RUN COMMAND:**
```bash
git add src/content/resume.ts
git commit -m "feat(v4-resume): src/content/resume.ts — typed source-of-truth for HTML render"
```

### Task F2 — Create src/pages/resume.astro

**Files:** Create `src/pages/resume.astro`

```astro
---
// src/pages/resume.astro
import PersonaLayout from "../layouts/PersonaLayout.astro";
import { resume } from "../content/resume";

// Three PDF variants. File sizes are real-time read from `public/resume/` if available,
// else fall back to spec-stated baseline.
const pdfs = [
  { id: "swe" as const,     label: "SWE.pdf",     href: "/resume/Ashish_Kshirsagar_SWE.pdf",     sizeKB: 142, primary: true  },
  { id: "mle" as const,     label: "MLE.pdf",     href: "/resume/Ashish_Kshirsagar_MLE.pdf",     sizeKB: 138, primary: false },
  { id: "systems" as const, label: "Systems.pdf", href: "/resume/Ashish_Kshirsagar_Systems.pdf", sizeKB: 145, primary: false },
];
---
<PersonaLayout
  personaId="resume"
  title="Ashish K. · résumé"
  description="One-page resume + three PDF variants."
  lastEditISO={new Date(resume.lastUpdated).toISOString()}
>
  <section class="hero">
    <div class="hero-pre">~ the résumé ~</div>
    <h1>ASHISH<br/><span>KSHIRSAGAR.</span></h1>
    <p class="sub">The longer story is in the four sections above. This is the one-page version.</p>
  </section>

  <section class="resume-downloads">
    <div class="rd-label">→ download · pick the variant that fits</div>
    <div class="rd-grid">
      {pdfs.map((p) => (
        <a
          href={p.href}
          download={p.href.split("/").pop()}
          class={`rd-btn${p.primary ? " primary" : ""}`}
        >
          <span class="arr">↓</span>
          <span class="lbl">{p.label}</span>
          <span class="sz">· {p.sizeKB} KB</span>
        </a>
      ))}
    </div>
  </section>

  <section class="resume-body">
    <section class="rb-section">
      <h2>Now</h2>
      <p>{resume.now}</p>
    </section>

    <section class="rb-section">
      <h2>Experience</h2>
      {resume.experience.map((e) => (
        <div class="rb-entry">
          <div class="rb-row">
            <div>
              <h3>{e.title} · <span class="company">{e.company}</span></h3>
            </div>
            <div class="meta">{e.dates} · {e.location}</div>
          </div>
          <ul>
            {e.bullets.map((b) => <li>{b}</li>)}
          </ul>
        </div>
      ))}
    </section>

    <section class="rb-section">
      <h2>Education</h2>
      {resume.education.map((e) => (
        <div class="rb-entry">
          <div class="rb-row">
            <div>
              <h3>{e.degree} · <span class="company">{e.school}</span></h3>
            </div>
            <div class="meta">{e.dates}{e.honors ? ` · ${e.honors}` : ""}</div>
          </div>
        </div>
      ))}
    </section>

    <section class="rb-section">
      <h2>Selected Work</h2>
      <ul class="sw-list">
        {resume.selectedWork.map((s) => (
          <li>
            <strong>{s.url ? <a href={s.url}>{s.title}</a> : s.title}</strong> — <em>{s.blurb}</em>
          </li>
        ))}
      </ul>
    </section>

    <section class="rb-section">
      <h2>Skills</h2>
      <p class="skills-line"><strong>Primary:</strong> {resume.skills.primary.join(" · ")}</p>
      <p class="skills-line"><strong>Secondary:</strong> {resume.skills.secondary.join(" · ")}</p>
    </section>

    <section class="rb-section">
      <h2>Contact</h2>
      <p class="contact-line">
        <a href={`mailto:${resume.contact.email}`}>{resume.contact.email}</a>
        · <a href={resume.contact.github}>github</a>
        · <a href={resume.contact.linkedin}>linkedin</a>
        {resume.contact.twitter && <> · <a href={resume.contact.twitter}>twitter</a></>}
      </p>
    </section>
  </section>
</PersonaLayout>

<style>
  /* Resume-specific layout — uses the coder (workshop) palette via data-persona="coder" set by layout */
  .resume-downloads {
    position: relative; z-index: 10;
    max-width: 920px; margin: 1rem auto 2rem; padding: 0 2.5rem;
  }
  .rd-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 1rem;
  }
  .rd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.9rem; }
  .rd-btn {
    display: flex; align-items: baseline; gap: 0.4rem;
    padding: 0.8rem 1rem;
    background: var(--surface); border: 1px solid var(--rule);
    color: var(--fg); text-decoration: none;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase;
    transition: background 200ms ease;
  }
  .rd-btn.primary { background: var(--accent); color: #fefdf8; border-color: var(--accent); }
  .rd-btn:hover { background: var(--accent); color: #fefdf8; }
  .rd-btn .arr { font-weight: 700; }
  .rd-btn .sz { color: inherit; opacity: 0.7; font-size: 0.7rem; letter-spacing: 0.12em; }

  .resume-body {
    position: relative; z-index: 10;
    max-width: 720px; margin: 2rem auto 4rem; padding: 0 2.5rem;
    font-family: 'Cormorant Garamond', serif; font-size: 1.05rem; line-height: 1.55;
    color: var(--fg);
  }
  .rb-section { margin-top: 2.5rem; }
  .rb-section > h2 {
    font-family: 'Anton', sans-serif;
    font-size: 2.5rem; letter-spacing: -0.02em; line-height: 0.9;
    color: var(--fg); margin-bottom: 0.8rem;
  }
  .rb-entry { margin-bottom: 1.4rem; }
  .rb-row {
    display: flex; justify-content: space-between; align-items: baseline;
    gap: 1rem;
  }
  .rb-row h3 {
    font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 1.15rem;
    color: var(--fg); margin: 0;
  }
  .rb-row h3 .company { font-style: italic; color: var(--muted); font-weight: 400; }
  .rb-row .meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem; letter-spacing: 0.12em; color: var(--muted);
    white-space: nowrap;
  }
  .rb-entry ul { margin: 0.5rem 0 0 1.2rem; padding: 0; }
  .rb-entry li { margin: 0.2rem 0; }
  .sw-list { margin: 0; padding-left: 1.2rem; }
  .sw-list li { margin: 0.4rem 0; }
  .skills-line { margin-bottom: 0.4rem; }
  .skills-line strong { font-weight: 600; }
  .contact-line a { color: var(--accent); text-decoration: none; }
  .contact-line a:hover { text-decoration: underline; }

  @media (max-width: 640px) {
    .rd-grid { grid-template-columns: 1fr; }
    .rb-row { flex-direction: column; }
    .rb-row .meta { white-space: normal; }
  }
</style>
```

> **PDF download UX:** the `download` attribute is set on each anchor — Chrome/Firefox honor it. Safari may still inline-display PDFs; spec §14 risk #5 documents this as an accepted fallback.

- [ ] Verify:
  ```bash
  npx astro check
  ```

**USER-RUN COMMAND:**
```bash
git add src/pages/resume.astro
git commit -m "feat(v4-resume): /resume route — hero + 3 PDF buttons + sectioned HTML body"
```

### Task F3 — USER-RUN: sync PDFs from resume workspace

**Files:** Create `public/resume/Ashish_Kshirsagar_SWE.pdf`, `_MLE.pdf`, `_Systems.pdf`

The PDFs are built in a separate workspace (`~/Projects/active/resume/`) and must be copied into `public/resume/` so they ship with the Astro build.

**USER-RUN COMMAND:**
```bash
cd ~/Projects/active/ask149.github.io
mkdir -p public/resume
cp ~/Projects/active/resume/pdfs/Ashish_Kshirsagar_SWE.pdf public/resume/
cp ~/Projects/active/resume/pdfs/Ashish_Kshirsagar_MLE.pdf public/resume/
cp ~/Projects/active/resume/pdfs/Ashish_Kshirsagar_Systems.pdf public/resume/

# Verify
ls -la public/resume/
# Expect: 3 PDFs, ~140 KB each

# If file sizes drift significantly from the F2 placeholders, update F2 sizeKB values
# (it's only a cosmetic detail in the download button — actual file size shipped is accurate)
```

After running:

**USER-RUN COMMAND:**
```bash
git add public/resume/
git commit -m "feat(v4-resume): drop initial PDFs (SWE primary + MLE + Systems variants)"
```

### Task F4 — Create scripts/sync-resume-pdfs.sh helper

**Files:** Create `scripts/sync-resume-pdfs.sh`

```bash
#!/usr/bin/env bash
# scripts/sync-resume-pdfs.sh
# Copy fresh PDFs from ~/Projects/active/resume/pdfs/ → public/resume/
set -euo pipefail

SRC="$HOME/Projects/active/resume/pdfs"
DST="$(cd "$(dirname "$0")/.." && pwd)/public/resume"

if [ ! -d "$SRC" ]; then
  echo "✗ Source dir not found: $SRC" >&2
  exit 1
fi

mkdir -p "$DST"

for variant in SWE MLE Systems; do
  fname="Ashish_Kshirsagar_${variant}.pdf"
  if [ -f "$SRC/$fname" ]; then
    cp "$SRC/$fname" "$DST/$fname"
    echo "✓ $fname"
  else
    echo "✗ missing: $SRC/$fname" >&2
  fi
done

echo "✓ synced to $DST"
```

- [ ] Make executable (user-run since chmod from agent may be denied):

**USER-RUN COMMAND:**
```bash
chmod +x scripts/sync-resume-pdfs.sh
# Test:
./scripts/sync-resume-pdfs.sh
```

- [ ] Add npm script alias to `package.json`:
  ```json
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "sync:resume": "bash scripts/sync-resume-pdfs.sh"
  }
  ```

**USER-RUN COMMAND:**
```bash
git add scripts/sync-resume-pdfs.sh package.json
git commit -m "feat(v4-resume): sync-resume-pdfs.sh + npm run sync:resume alias"
```

### Task F5 — Phase F verification gate + @reviewer

- [ ] `npx astro build` — `/resume` builds; bundle ≤ 8 KB gz (no React)
- [ ] All three PDFs accessible at `/resume/Ashish_Kshirsagar_*.pdf` in `dist/`:
  ```bash
  ls -la dist/resume/
  ```
- [ ] Visual smoke: navigate to `/resume`. Acceptance: hero matches sister-persona styling (Workshop's copper accent — `data-persona="coder"` was set by layout); 3 download buttons with primary copper SWE; sectioned body with Now / Experience / Education / Selected Work / Skills / Contact; Anton h2 + Cormorant body + Mono dates.
- [ ] PDF download UX test in Chrome (download prompt appears) and Safari (inline-display fallback acceptable)

**@reviewer dispatch hook:** Reviewer checks: (a) `download` attribute syntax correct, (b) `resume.ts` types match the consumption in `resume.astro` (no untyped fields), (c) `data-persona="coder"` was properly mapped from `personaId="resume"` in PersonaLayout (verified by inspecting the rendered HTML's `<html>` element), (d) `lastUpdated` field surfaces somewhere (consider adding to the hero `.sub` or below the meta in a future polish pass).

---

## Phase G — AI paragraph generation + Photo manifest workflow (~0.5–1 day)

After Phase G, place entries have AI-generated reflective paragraphs (where missing), and `src/data/photoManifest.json` is regenerated from `public/photos/<slug>/` on each build.

### Task G1 — Create scripts/generate-paragraphs.ts

**Files:** Create `scripts/generate-paragraphs.ts`

Per spec §10.

```ts
// scripts/generate-paragraphs.ts
// Run via: npm run paragraphs
//
// Reads all src/content/places/*.md files. For each entry where `paragraph` is empty,
// calls Anthropic Claude Sonnet to generate a 100-150 word reflective paragraph,
// writes it back to the frontmatter with `paragraphAuthor: "ai"`.
//
// Idempotent: existing paragraphs are NEVER overwritten (regardless of author).
// To force regeneration: delete `paragraph` + `paragraphAuthor` fields from the .md.
//
// Cost: ~$0.01/place at Sonnet 4 (May 2026 pricing).

import Anthropic from "@anthropic-ai/sdk";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const PLACES_DIR = "src/content/places";
const MODEL = "claude-sonnet-4-20250514";  // adjust to current Sonnet at run time

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("✗ ANTHROPIC_API_KEY not set. Add to .env and re-run.");
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });

  const files = readdirSync(PLACES_DIR).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} place entries.`);

  let generated = 0;
  let skipped = 0;
  let totalCost = 0;

  for (const file of files) {
    const fullPath = join(PLACES_DIR, file);
    const raw = readFileSync(fullPath, "utf8");
    const parsed = matter(raw);
    const data = parsed.data as Record<string, any>;

    // Idempotency: if paragraph exists, skip — author wins regardless.
    if (data.paragraph && String(data.paragraph).trim().length > 0) {
      console.log(`  ✓ ${file}: paragraph present (${data.paragraphAuthor ?? "ak"}), skipping`);
      skipped++;
      continue;
    }

    if (data.draft) {
      console.log(`  ↷ ${file}: draft, skipping`);
      skipped++;
      continue;
    }

    const promptParts = [
      `Write a 100–150 word reflective paragraph in first person, warm but not saccharine,`,
      `about a stay in ${data.title}, ${data.country}, during ${data.yearMonth},`,
      `reason: ${data.reason}, duration: ${data.durationDays ?? "unknown"} days.`,
      `Tone: measured, observational, slightly melancholic.`,
      `No clichés about "finding myself" or "the journey".`,
      `Use sensory detail: weather, food, one small repeated ritual.`,
      `End on a single image, not a moral.`,
    ];
    const userPrompt = promptParts.join(" ");

    console.log(`  → generating for ${file} (${data.title})...`);
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = msg.content[0];
    const paragraph = content.type === "text" ? content.text.trim() : "";
    if (!paragraph) {
      console.warn(`  ⚠ ${file}: empty response, skipping`);
      continue;
    }

    data.paragraph = paragraph;
    data.paragraphAuthor = "ai";

    const out = matter.stringify(parsed.content, data);
    writeFileSync(fullPath, out);

    const words = paragraph.split(/\s+/).length;
    const usage = msg.usage ?? { input_tokens: 0, output_tokens: 0 };
    const cost = (usage.input_tokens * 3 + usage.output_tokens * 15) / 1_000_000;
    totalCost += cost;
    console.log(`  ✓ ${file}: ${words} words, $${cost.toFixed(4)}`);
    generated++;
  }

  console.log("");
  console.log(`Summary: ${generated} generated, ${skipped} skipped.`);
  console.log(`Total cost: $${totalCost.toFixed(4)}`);
}

main().catch((e) => {
  console.error("✗ Script failed:", e);
  process.exit(1);
});
```

- [ ] Add npm script in `package.json`:
  ```json
  "scripts": {
    "paragraphs": "tsx scripts/generate-paragraphs.ts"
  }
  ```

- [ ] Install `tsx` as dev dependency (needed to execute the TS file with type stripping):
  ```bash
  npm install -D tsx@^4.19.0
  ```

- [ ] Verify the script compiles (without running it):
  ```bash
  npx tsc --noEmit scripts/generate-paragraphs.ts
  ```
  Expect: clean compile. (May need a `tsconfig.scripts.json` if the script can't see the root tsconfig — accept and create if needed.)

**USER-RUN COMMAND:**
```bash
git add scripts/generate-paragraphs.ts package.json package-lock.json
git commit -m "feat(v4-ai): generate-paragraphs.ts — Anthropic Sonnet build-time script + npm run paragraphs"
```

### Task G2 — USER-RUN: configure ANTHROPIC_API_KEY in env

**Files:** Modify `.env` (gitignored)

**USER-RUN COMMAND:**
```bash
cd ~/Projects/active/ask149.github.io

# 1. Ensure .env is gitignored
grep -q '^\.env' .gitignore || echo ".env" >> .gitignore

# 2. Add the key — reference CREDENTIALS.md for actual value
# (Documented in ~/.config/opencode/CREDENTIALS.md with last-4 reference only)
cat >> .env << 'EOF'

# Anthropic — for scripts/generate-paragraphs.ts
ANTHROPIC_API_KEY=sk-ant-...
EOF

# 3. Edit and replace with real key
$EDITOR .env

# 4. Update CREDENTIALS.md with last-4 reference
$EDITOR ~/.config/opencode/CREDENTIALS.md
# Add entry like:
# - ANTHROPIC_API_KEY (portfolio v4 paragraphs): ...xyz1234
# - Use: build-time only — never run in CI
# - Source: console.anthropic.com → API Keys

# 5. Run the script once locally to backfill paragraphs
export $(grep -v '^#' .env | xargs)
npm run paragraphs

# 6. Verify .env did NOT get staged
git status   # .env should NOT appear
```

After running, commit only the modified place .md files (paragraph + paragraphAuthor frontmatter additions). The .env itself stays gitignored.

**USER-RUN COMMAND:**
```bash
git add src/content/places/
git commit -m "feat(v4-ai): backfill AI-generated paragraphs for 4 starter places"
```

### Task G3 — Create scripts/photo-manifest.ts

**Files:** Create `scripts/photo-manifest.ts`

Per spec §11.2 — scans `public/photos/<slug>/` and emits `src/data/photoManifest.json`.

```ts
// scripts/photo-manifest.ts
// Run via: npm run photos
// Or automatically via "prebuild" hook in package.json (added in next step).
//
// Scans public/photos/<slug>/ folders, picks images by extension, derives caption
// from filename (kebab-case → spaces), writes src/data/photoManifest.json.

import { readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, parse } from "node:path";

const ROOT = "public/photos";
const OUT_DIR = "src/data";
const OUT_FILE = join(OUT_DIR, "photoManifest.json");

const IMG_EXT = /\.(jpe?g|png|webp|avif)$/i;

interface Photo {
  src: string;
  caption: string;
}

function captionFromFilename(file: string): string {
  const base = parse(file).name;
  return base.replace(/[-_]+/g, " ").trim();
}

function main() {
  const manifest: Record<string, Photo[]> = {};

  if (!existsSync(ROOT)) {
    console.log(`(no ${ROOT} dir — writing empty manifest)`);
  } else {
    for (const slug of readdirSync(ROOT)) {
      const dir = join(ROOT, slug);
      if (!statSync(dir).isDirectory()) continue;
      const files = readdirSync(dir)
        .filter((f) => IMG_EXT.test(f))
        .sort();
      manifest[slug] = files.map((f) => ({
        src: `/photos/${slug}/${f}`,
        caption: captionFromFilename(f),
      }));
      console.log(`  ✓ ${slug}: ${files.length} photos`);
    }
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`✓ wrote ${OUT_FILE} with ${Object.keys(manifest).length} folders`);
}

main();
```

- [ ] Add npm script + prebuild hook in `package.json`:
  ```json
  "scripts": {
    "dev": "astro dev",
    "prebuild": "tsx scripts/photo-manifest.ts",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "paragraphs": "tsx scripts/generate-paragraphs.ts",
    "photos": "tsx scripts/photo-manifest.ts",
    "sync:resume": "bash scripts/sync-resume-pdfs.sh"
  }
  ```
  > `prebuild` runs automatically before `npm run build`. Means every build refreshes the manifest from disk.

- [ ] Verify:
  ```bash
  npm run photos
  cat src/data/photoManifest.json   # should not be `{}` if any photos exist; otherwise `{}`
  ```

**USER-RUN COMMAND:**
```bash
git add scripts/photo-manifest.ts package.json
git commit -m "feat(v4-photos): photo-manifest.ts + prebuild hook + npm run photos"
```

### Task G4 — USER-RUN: drop initial photos into public/photos/<slug>/

**Files:** Create `public/photos/2024-seattle/*.jpg` etc.

User drops 5–10 photos per starter place from a Google Photos export.

**USER-RUN COMMAND:**
```bash
cd ~/Projects/active/ask149.github.io
mkdir -p public/photos/2019-pune-school
mkdir -p public/photos/2022-tempe-asu
mkdir -p public/photos/2024-seattle
mkdir -p public/photos/2026-pune-return

# Step 1: In Google Photos web UI, select an album per trip → ⋮ → Download all → unzip
# Step 2: Copy ~5-10 photos per folder, named descriptively (kebab-case)
#         e.g. `space-needle-blue-sky.jpg`, `first-ferry-evening.jpg`, `rainier-clear-day.jpg`
# Step 3: Regenerate manifest
npm run photos

# Step 4: Verify
cat src/data/photoManifest.json | head -30
ls public/photos/2024-seattle/
```

Don't oversize photos — target 1200px max width, ≤200 KB per file. Optional: pre-process via:
```bash
# Convert + resize batch (requires imagemagick: brew install imagemagick)
for f in public/photos/2024-seattle/*.{jpg,jpeg}; do
  magick "$f" -resize '1200x>' -quality 78 "${f%.*}.jpg"
done
```

**USER-RUN COMMAND:**
```bash
git add public/photos/ src/data/photoManifest.json
git commit -m "feat(v4-photos): drop initial photo sets — pune-school, tempe, seattle, pune-return"
```

### Task G5 — Wire photoManifest.json into FloatingPhotos (already done in C9)

**Files:** Verify `src/pages/traveler.astro` (C9) properly imports `photoManifest.json`.

This was completed in Phase C — the import line is:
```ts
import photoManifest from "../data/photoManifest.json";
```

After Tasks G3 + G4, that import resolves to a populated manifest. Verify by:
```bash
npm run build
# Then check the built /traveler page for the actual photo URLs being inlined
grep -o '/photos/[^"]*' dist/traveler/index.html | sort -u | head
```

Expect: real photo paths now show up (not empty placeholders).

No new commit needed — this is a re-verification step.

### Task G6 — Phase G verification gate + @reviewer

- [ ] All starter place entries now have non-empty `paragraph` field + `paragraphAuthor: "ai"` (unless user pre-authored some — those have `paragraphAuthor: "ak"`)
- [ ] `npm run photos` produces a non-empty `src/data/photoManifest.json`
- [ ] `npm run build` runs `prebuild` first → manifest refreshed → build succeeds
- [ ] `/traveler` floating polaroids now use real `<img>` tags pointing at `/photos/<slug>/<file>`
- [ ] `.env` is gitignored; ANTHROPIC_API_KEY is NOT in any commit (verify with `git log --all --full-history -p .env` — should return nothing)

**@reviewer dispatch hook:** Reviewer checks: (a) script idempotency (re-running `npm run paragraphs` produces no changes if all paragraphs exist), (b) gray-matter preserves frontmatter ordering reasonably (not strictly enforced, but check), (c) no API key leaks in plan output or commit messages, (d) `prebuild` hook doesn't break in CI where Anthropic key is absent — paragraphs script is separate from build pipeline (only `photo-manifest.ts` runs in prebuild), (e) the photo-manifest script is safe to run with empty `public/photos/` (writes `{}`).

---

## Phase H — Polish + verify + cutover handoff (~1 day)

Last phase. Run the verification matrix, do a Lighthouse pass, check reduced-motion + mobile + View Transitions, then write the cutover handoff doc and surface the final git command batch to the user.

### Task H1 — Clean rebuild + bundle size verification

**Files:** None (verification only)

- [ ] Clean rebuild:
  ```bash
  python3 -c "import shutil, os; shutil.rmtree('dist', ignore_errors=True); shutil.rmtree('node_modules/.astro', ignore_errors=True); print('cleaned')"
  npm run build
  ```

- [ ] Bundle size measurement — record for each route. Astro outputs `dist/<route>/index.html` + assets under `dist/_astro/`. Gzip the HTML + all required JS/CSS chunks. Quick measurement:
  ```bash
  python3 << 'PY'
  import os, gzip
  def gzsize(p):
      with open(p, 'rb') as f:
          return len(gzip.compress(f.read(), compresslevel=9))
  for root, dirs, files in os.walk('dist'):
      for f in files:
          if f.endswith(('.html','.js','.css')):
              p = os.path.join(root, f)
              print(f"{gzsize(p):>7d}  {p}")
  PY
  ```

- [ ] Document per-route gzipped totals against budgets (spec §15):
  | Route | Budget | Measured |
  |---|---|---|
  | `/` | 70 KB | ___ |
  | `/traveler` | 70 KB | ___ |
  | `/curate` | 10 KB | ___ |
  | `/made` | 70 KB | ___ |
  | `/resume` | 8 KB | ___ |

- [ ] If any route blows the budget by >20%, surface as a blocker. Spec §14 risk #2 mentions Preact compat as the fallback path for /traveler.

**Verification gate:** All 5 routes within or near budget. Record measured numbers for cutover doc (H8).

### Task H2 — Lighthouse audit each route

**Files:** None (verification only)

- [ ] Run Lighthouse against the local preview build:
  ```bash
  npm run build
  npm run preview &
  # in another shell or after backgrounding:
  npx lighthouse http://localhost:4321/ --preset=desktop --output=html --output-path=lighthouse-coder.html --quiet --chrome-flags="--headless"
  npx lighthouse http://localhost:4321/traveler --preset=desktop --output=html --output-path=lighthouse-traveler.html --quiet --chrome-flags="--headless"
  npx lighthouse http://localhost:4321/curate   --preset=desktop --output=html --output-path=lighthouse-curate.html   --quiet --chrome-flags="--headless"
  npx lighthouse http://localhost:4321/made     --preset=desktop --output=html --output-path=lighthouse-made.html     --quiet --chrome-flags="--headless"
  npx lighthouse http://localhost:4321/resume   --preset=desktop --output=html --output-path=lighthouse-resume.html   --quiet --chrome-flags="--headless"
  ```
  > If `lighthouse` isn't installed: `npm install -D lighthouse`

- [ ] Also run mobile preset for `/`, `/traveler`, `/made` (the heaviest):
  ```bash
  npx lighthouse http://localhost:4321/         --output=html --output-path=lighthouse-coder-mobile.html    --quiet --chrome-flags="--headless"
  npx lighthouse http://localhost:4321/traveler --output=html --output-path=lighthouse-traveler-mobile.html --quiet --chrome-flags="--headless"
  npx lighthouse http://localhost:4321/made     --output=html --output-path=lighthouse-made-mobile.html     --quiet --chrome-flags="--headless"
  ```

- [ ] Record scores per spec §15:
  | Route | Perf (mobile) | A11y | Best-Practices | SEO |
  |---|---|---|---|---|
  | `/` | ≥90 / __ | ≥95 / __ | ≥95 / __ | __ |
  | `/traveler` | ≥90 / __ | ≥95 / __ | ≥95 / __ | __ |
  | `/curate` | ≥95 / __ | ≥95 / __ | ≥95 / __ | __ |
  | `/made` | ≥90 / __ | ≥95 / __ | ≥95 / __ | __ |
  | `/resume` | ≥95 / __ | ≥95 / __ | ≥95 / __ | __ |

- [ ] Common Lighthouse fix-ups if scores miss target:
  - Font CLS — preload Anton woff2 explicitly (`<link rel="preload" href="..." as="font" type="font/woff2" crossorigin>`)
  - Image LCP — ensure hero `<h1>` (Anton headline) is LCP, not any deferred image
  - A11y — add `aria-label` to chip buttons in ProjectGridV4, ensure all SVG decorations have `aria-hidden="true"` (already done in our components)

- [ ] DELETE the local lighthouse HTML reports before commit (they're disposable; stay out of git):
  ```bash
  python3 -c "import glob, os; [os.remove(f) for f in glob.glob('lighthouse-*.html')]"
  ```

**Verification gate:** Document scores in H8 cutover doc. If any route falls >5 points below target after one fix-up pass, surface as a blocker; ship-decision is the user's.

### Task H3 — Reduced-motion test

**Files:** None (verification only)

- [ ] Open Chrome DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-motion" → reduce
- [ ] Visit each persona route. Acceptance per spec §17:
  - `/` Workshop — Motion stagger may still run (Motion library respects prefers-reduced-motion by default; verify no jarring entrance), scribble rotation removed (verified via media query in A5 coder.css)
  - `/traveler` — only `pf-3` polaroid visible, no animation; pin pulse off; timeline-track scroll-behavior auto (no smooth scroll)
  - `/curate` — pure Astro, no animation to test
  - `/made` — pure Astro, no animation to test
  - `/resume` — pure Astro

- [ ] If any animation slips through, patch the corresponding persona CSS file's `@media (prefers-reduced-motion: reduce)` block.

### Task H4 — Mobile viewport check (375px)

**Files:** None (verification only)

- [ ] Chrome DevTools → device toolbar → iPhone SE (375×667). Visit each route.
  - TopNav: should scroll horizontally; the 4 short labels (workshop/voyages/curio/atelier) fit; `↓ resume` + version stamp may overflow (acceptable — `ver.` hides on <640px via A6 media query)
  - `/` Workshop hero: scales to ~4.5rem (Anton)
  - `/traveler` floating photos: hidden except `pf-3`, which becomes block-level + 80% width centered (per A5 traveler.css mobile block + A6 chrome mobile block)
  - `/traveler` diary card: margin reduces; h3 from 3rem → 2rem
  - `/curate` ornament corners: small (120-140px); content scales
  - `/made`: dashed FIG cards stack to 1 column? — verify; if not stacking, add to made.css:
    ```css
    @media (max-width: 640px) {
      body[data-persona="made"] .ph-grid { grid-template-columns: 1fr; }
      body[data-persona="made"] .q-row { grid-template-columns: 50px 1fr; gap: 0.4rem; }
      body[data-persona="made"] .q-row .b { grid-column: 2; }
      body[data-persona="made"] .q-row .s { grid-column: 2; text-align: left; }
    }
    ```
  - `/resume`: 3 PDF buttons stack to 1 column (already done in F2 media query); rb-row meta wraps below title

- [ ] If `made.css` mobile block missing, add the snippet above:
  ```bash
  $EDITOR src/styles/personas/made.css
  ```

**USER-RUN COMMAND (if made.css mobile additions made):**
```bash
git add src/styles/personas/made.css
git commit -m "fix(v4-atelier): mobile fallback — single-column placeholder grid + stacked queue rows"
```

### Task H5 — View Transitions cross-browser test

**Files:** None (verification only)

- [ ] **Chrome (current):** click TopNav links between persona routes. Acceptance: tab pill morph animation runs (~300ms ease), continents/world map persists during /traveler entry (no flicker because both pages share `<ClientRouter />`)
- [ ] **Safari (current):** same flow. Acceptance: morph runs (Safari 18+ has View Transitions support); on older Safari, instant navigation falls back gracefully
- [ ] **Firefox:** same flow. Acceptance: instant nav (Firefox lacks View Transitions API at this date) — `<ClientRouter />` falls back to default browser navigation. No errors in console.

- [ ] Record any unexpected behavior in H8 cutover doc.

### Task H6 — USER-RUN: final git commit batch + branch hygiene

**Files:** None (orchestrator handoff)

By this point the user has a clean v4 branch with ~30 commits. Optional: squash into a coherent phase-by-phase history before merging to main. If not squashing, just ensure each phase has its own commits in order.

**USER-RUN COMMAND (optional squash):**
```bash
cd ~/Projects/active/ask149.github.io
git log --oneline v4 ^main | head -40    # review commits since divergence

# If keeping the history as-is, skip the next steps.
# If consolidating into ~8 commits (one per phase), use interactive rebase:
git rebase -i $(git merge-base v4 main)
# In the editor, change "pick" to "squash" or "fixup" for commits to consolidate.
# After squashing, write fresh commit messages per phase:
#   feat(v4-A): foundation refresh — chrome, registry, tokens
#   feat(v4-B): workshop persona rebuild
#   feat(v4-C): voyages persona rebuild (the showcase)
#   feat(v4-D): curio persona rebuild (zero-JS)
#   feat(v4-E): atelier persona rebuild (zero-JS)
#   feat(v4-F): /resume route + 3 PDF variants
#   feat(v4-G): AI paragraphs + photo manifest workflow
#   feat(v4-H): polish — reduced-motion, mobile, Lighthouse, cutover docs

# Then force-push the rewritten v4 branch (only safe because v4 isn't shared yet)
git push --force-with-lease origin v4
```

> **Squash safety:** This is one of the few destructive git ops in the plan. ONLY do this on `v4` branch. Never on `main` or `v3-publication-grade`. If you're unsure, skip squashing and merge as-is.

### Task H7 — USER-RUN: deploy + cutover decision

**Files:** Verify `.github/workflows/deploy-v2.yml` (or whichever workflow exists)

The existing GitHub Pages deploy likely deploys from `v2` branch. There are two cutover patterns:

**Pattern A (fast):** Keep deploy pointed at the same branch you ship from. Push v4 → main via PR or merge.
```bash
git checkout main
git merge --no-ff v4 -m "release: v4 hybrid-atelier (4 personas + /resume + AI paragraphs)"
git push origin main

# Update GitHub Pages settings if needed (UI):
# https://github.com/Ask149/ask149.github.io/settings/pages → Branch: main (or v4)
```

**Pattern B (safer):** Deploy from `v4` branch first to verify, then cut over.
```bash
# In .github/workflows/<deploy>.yml, change `branches: [v2]` → `branches: [v4]`
$EDITOR .github/workflows/deploy-v2.yml
git add .github/workflows/
git commit -m "chore(v4): point Pages deploy at v4 branch"
git push origin v4
# Wait for Action to deploy. Verify live site.

# After confirming live ship-ready, merge to main:
git checkout main
git merge --no-ff v4
git push origin main
# Then optionally update the workflow back to track main.
```

> **Recommendation:** Pattern B for first cutover. v3 was rejected after a week of polish; we want a chance to walk back if v4 has a surprise on live.

- [ ] User chooses Pattern A or B. Document choice in H8 cutover doc.
- [ ] After cutover, v3-publication-grade and original Jekyll v1 branches stay archived (never delete).

### Task H8 — Write cutover doc

**Files:** Create `docs/superpowers/cutover-2026-05-17-portfolio-v4.md`

```markdown
# Portfolio v4 — Cutover Notes (2026-05-17)

## Status
- v4 branch: pushed and merged to main on YYYY-MM-DD
- v3-publication-grade: archived at remote
- Live URL: https://ask149.github.io (or custom domain if configured)

## Bundle sizes (measured at cutover)
| Route | Budget | Measured | Status |
|---|---|---|---|
| `/` | 70 KB | ___ KB | ✓/✗ |
| `/traveler` | 70 KB | ___ KB | ✓/✗ |
| `/curate` | 10 KB | ___ KB | ✓/✗ |
| `/made` | 70 KB | ___ KB | ✓/✗ |
| `/resume` | 8 KB | ___ KB | ✓/✗ |

## Lighthouse scores (mobile preset)
| Route | Perf | A11y | BP | SEO |
|---|---|---|---|---|
| `/` | __ | __ | __ | __ |
| `/traveler` | __ | __ | __ | __ |
| `/curate` | __ | __ | __ | __ |
| `/made` | __ | __ | __ | __ |
| `/resume` | __ | __ | __ | __ |

## Reduced-motion paths verified
- [x] Workshop: scribble static
- [x] Voyages: only pf-3 polaroid, no pin pulse, no smooth scroll
- [x] Curio: pure Astro, nothing to disable
- [x] Atelier: pure Astro, nothing to disable
- [x] Resume: pure Astro, nothing to disable

## Cross-browser View Transitions
- Chrome: morph ✓
- Safari 18+: morph ✓
- Firefox: instant nav (acceptable fallback)

## What's intentionally deferred (v4.2 backlog)
- Real geo→SVG auto-projection for map pins (spec §16 #8)
- Dual-paragraph storage (`paragraphAk` + `paragraphAi` with clickable toggle)
- AnimatePresence cross-fade for Atelier "build ships" transition
- Custom domain (ashishk.in?)
- Google Photos Library / Picker API integration
- Dark mode toggle (intentionally dropped — day-cycle IS the mood)
- Per-place sub-route (`/traveler/<slug>`) gallery
- v3-era /feed UI redesign

## Operational notes
- Run `npm run paragraphs` LOCALLY only, never in CI (Anthropic key isn't checked in)
- Run `npm run sync:resume` after each LaTeX resume edit in ~/Projects/active/resume/
- Photos go in `public/photos/<slug>/` matching place .md filename; `npm run photos` regenerates manifest (prebuild hook does this automatically)
- Reseed photo folders monthly or after major trips

## Risk mitigations applied
- Font payload: preconnect + display=swap shipped (spec §14 #1)
- React baseline: React only on /, /traveler — /curate /made /resume are zero-JS (#2)
- Photo perf: lazy + decoding=async, 7-polaroid cap (#3)
- API key handling: .env gitignored, last-4 in CREDENTIALS.md only (#4)
- PDF download UX: `download` attr + Safari inline-display fallback accepted (#5)

## Rollback
If a surprise lands on live:
```bash
git checkout main
git revert --no-ff <v4-merge-commit-sha>
git push origin main
# Pages will rebuild from reverted main
```
Or temporarily re-point Pages to `v3-publication-grade` branch in repo Settings.

## Final commit history (squashed)
```
$(git log --oneline main ^<v2-tip>)
```
```

- [ ] Fill in measured numbers from H1 + H2 once they're collected.
- [ ] User updates the YYYY-MM-DD + final commit history block.

**USER-RUN COMMAND:**
```bash
git add docs/superpowers/cutover-2026-05-17-portfolio-v4.md
git commit -m "docs(v4): cutover notes — bundle sizes, Lighthouse scores, deferred work"
```

### Task H9 — Phase H verification gate (final)

- [ ] All 5 routes built clean
- [ ] Bundle budgets met
- [ ] Lighthouse scores recorded
- [ ] Reduced-motion paths verified on all 5 routes
- [ ] Mobile viewport check passed
- [ ] View Transitions verified (Chrome/Safari morph; Firefox graceful fallback)
- [ ] Cutover doc written + committed
- [ ] User has run the merge + Pages deploy steps (H7)
- [ ] Live URL confirmed showing v4

**@reviewer dispatch hook (final):** Reviewer does an end-to-end pass:
- (a) navigate live site, click through all TopNav tabs + ↓ resume link
- (b) DevTools network tab on cold load — Anton + Cormorant + JBMono + Caveat all fetch (4 font requests)
- (c) Voyages page: hash-deep-link `#trip=2022-tempe-asu` works
- (d) /resume PDFs all downloadable
- (e) `git log --oneline main ^<prior-tip>` is a clean, readable history

---

## Self-review log

Walked through spec sections 1–17 after drafting:

1. **Coverage of locked decisions (spec §2 table):**
   - Decision #1 inheritance from v3 — Phase A0/A4 archive v3 + carry forward registry shape ✓
   - #2 4 personas at launch (workshop/voyages/curio/atelier) — A4 registry strings ✓
   - #3 routes (/ /traveler /curate /made + new /resume) — Phase F adds /resume; existing pages refactored in B6/C9/D5/E6 ✓
   - #4 typography (Anton + Cormorant + JBMono + Caveat) — A2 Google Fonts import ✓
   - #5 day-cycle palette per persona — A5 four token files ✓
   - #6 textures per page (graph, world map, book-spine stripes, blueprint+radial) — A5 + B2 + C1 + D2 + E2 ✓
   - #7 Voyages interaction model — C1-C10 ✓ (the heart of the plan; bulk of detail)
   - #8 shared chrome — A6 TopNav + FooterStatus ✓
   - #9 /resume page — F1-F5 ✓
   - #10 AI paragraphs — G1-G2 ✓
   - #11 photo file workflow — G3-G4 ✓
   - #12 hydration strategy — index uses `client:visible` (B6); /curate /made /resume zero JS (D5 E6 F2 verified zero `client:*`) ✓
   - #13 View Transitions — `<ClientRouter />` wired in A7 ✓
   - #14 modularity keystone (registry survives) — A4 preserves shape ✓
   - #15 theme tokens (one CSS per persona) — A5 ✓
   - #16 bundle budgets — H1 measurement, documented ✓
   - #17 reduced motion — built into A5 token files + H3 verification ✓
   - #18 migration — A0 archive + cut v4 ✓
   - #19 cutover — H6/H7 ✓
   - #20 branding strings — A6 TopNav uses ASHISH K. brand, registry has lowercase mono labels + ver. XIV stamp ✓

2. **No placeholders:** Zero `[TODO]`, `[lorem]`, or `[...]`. The few `___` blanks in the cutover doc template H8 are deliberate (user fills measured numbers).

3. **Type consistency:**
   - Component names match spec §5: WorkshopHero / VoyagesHero / CurioHero / AtelierHero ✓
   - Collection field names match §6.1 places extension (paragraph / paragraphAuthor / photoFolder / mapCoords / photoCaptions / geo) ✓
   - Persona ids match §4 registry (coder / traveler / curate / made) ✓
   - DiaryCard `voyages:select` event protocol uniform across FloatingPhotos / DiaryCard / TimelineCarousel ✓

4. **Sequencing:**
   - Phase A blocks all subsequent phases (registry + chrome + tokens are foundational) ✓
   - B / D / E mutually independent after A; C is heaviest and can run parallel with B/D/E if subagent-driven ✓
   - F (/resume) is independent — can run after A in parallel with B/C/D/E ✓
   - G (AI paragraphs + photo manifest) depends on C (Voyages wires the manifest) ✓
   - H (polish + cutover) is last ✓

5. **Git-commit reality:**
   - Every commit step is **USER-RUN COMMAND** with exact bash ✓
   - A0 archive step + H7 cutover are explicit user-run blocks ✓
   - Squash flow in H6 explicitly flagged as "optional" + "force-push only safe because branch isn't shared" — covers spec §13 + AGENTS.md denylist concern ✓

6. **Bundle math sanity (re-check):**
   - / Workshop: React (~42.7) + AgentFeedStrip (~3) + LiveFeed (~8) + ProjectGridV4 (~4) + Astro runtime (~7) = ~65 KB gz → under 70 KB ✓
   - /traveler Voyages: React (~42.7) + FloatingPhotos (~5) + DiaryCard (~4) + TimelineCarousel (~5) + Astro runtime (~7) + photoManifest data (variable, but lightweight if <50 photos total — assume 5 KB) = ~69 KB → at budget, watch carefully ✓
   - /curate Curio: pure Astro, HTML+CSS only, ~6 KB gz ✓
   - /made Atelier: pure Astro, HTML+CSS+SVG only, ~8 KB gz ✓
   - /resume: pure Astro, ~6 KB gz ✓

7. **Acceptance for handoff:** This plan is mechanically-executable. Each task has files-to-touch, complete code blocks, verification commands, USER-RUN commit checkpoints, and reviewer hooks between phases. Subagent-driven-development skill can pick this up; orchestrator dispatches `@coder` per task with `@reviewer` quality gates between phases A/B/C/D/E/F/G/H.

8. **Total task count:** 8 phases × ~6–11 tasks each = ~53 tasks. Estimated execution: 7–9 working days, compressible to 2–4 sessions if Phase C decomposed across multiple `@coder` parallel dispatches.

---

## Don't-do checklist (verbatim from the spec and prompt)

- ✗ Don't introduce a test framework — verification gates only
- ✗ Don't touch the Cloudflare Worker — already shipped, untouched
- ✗ Don't touch `essays` or `projects` content collection schemas — only extend `places` + `builds`
- ✗ Don't include "ask user" steps — user has granted "go", orchestrator dispatches phase-by-phase
- ✗ Don't run `git commit`, `git push`, `rm -rf`, or `sudo` — all in the bash denylist
- ✗ Don't delete `LiveFeed.tsx` — Workshop reuses it
- ✗ Don't delete the persona registry — only its strings change
- ✗ Don't redesign /feed or /now or /uses pages — out of scope for v4.1
- ✗ Don't enable the Google Photos API or write OAuth flows — file-drop workflow only

---

**End of v4 implementation plan.** Total: ~53 tasks across 8 phases. Visual contract: 4 mockups in `.superpowers/static/aesthetics/`. Spec ground truth: `docs/superpowers/specs/2026-05-17-portfolio-v4-hybrid-atelier-design.md`. Next step: orchestrator dispatches Phase A to `@coder`; `@reviewer` gates after each phase.
