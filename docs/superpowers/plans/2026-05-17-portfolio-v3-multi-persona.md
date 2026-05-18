# Portfolio v3 — Multi-Persona Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute this plan. Orchestrator will dispatch fresh @coder subagent per task with @reviewer quality gate between phases.

**Goal:** Extend the existing v2 Astro portfolio into a 4-persona portfolio (Coder + Traveler + Curator + Maker) with per-persona visual worlds, distinct interaction patterns, and a modular persona-registry architecture that makes adding/removing personas a single-file change.

**Architecture:** Persona registry at `src/personas/registry.ts` is single source of truth. Each persona = its own route + tokens file + content collection + component folder. Shared chrome (top nav, footer status) used by all personas. Interactive islands hydrate `client:visible` only. Tab transitions via Astro `<ClientRouter />`. Bundle budget ≤ 35 KB gz incremental.

**Tech Stack:** Astro 4.10 + React 18 (existing) + TypeScript (strict) + Tailwind. NEW: `motion` (motion/react), `embla-carousel-react`, `embla-carousel-wheel-gestures`, shadcn Carousel primitive. Per-persona CSS custom properties scoped via `:root[data-persona="…"]`.

---

## Repo state (pre-flight)

- Repo root: `/Users/ashishkshirsagar/Projects/active/ask149.github.io`
- Work branch: `v2`. All commits land on `v2` until Phase G cutover to `main`.
- Existing collections: `essays`, `projects` — DO NOT modify.
- Existing components: `src/components/LiveFeed.tsx` — DO NOT modify (Coder persona re-uses it).
- Existing layouts: `src/layouts/Base.astro`, `src/layouts/Article.astro` — kept for off-nav routes; persona routes use the new `PersonaLayout.astro`.
- Tailwind is NOT yet installed in v2 (verified). Phase A installs and configures it.
- No test framework. Verification gates are: `npx tsc --noEmit`, `npx astro check`, `npx astro build`, manual browser smoke, Lighthouse where stated.
- Cannot run `git commit` from orchestrator — commit checkpoints are documented as **USER-RUN COMMAND** blocks.

---

## Phase ordering (locked)

```
A (Foundation) ── must complete first
   ├─ B (Coder refactor)        ┐
   ├─ C (Traveler)              │ B, C, D, E independent
   ├─ D (Curator)               │ — can be parallelized
   └─ E (Maker)                 ┘
F (Polish + verify) ── after B+C+D+E all green
G (Cutover handoff) ── after F
```

Between every phase, `@reviewer` quality-gates the diff before the next phase starts.

---

## Phase A — Foundation refactor (~1–2 days)

Purpose: Install dependencies, create the persona registry, split tokens into per-persona modules, build the shared chrome and `PersonaLayout`, wire `<ClientRouter />`. Zero new user-visible routes in this phase — only refactor.

### Task A1 — Install runtime dependencies

**Files:** Modify `package.json`, `package-lock.json` (auto)

- [ ] Install Tailwind + Astro integration:
  ```
  npx astro add tailwind --yes
  ```
- [ ] Install motion + embla:
  ```
  npm install motion@^11 embla-carousel-react@^8 embla-carousel-wheel-gestures@^8
  ```
- [ ] Verify `embla-carousel-wheel-gestures` liveness (spec §12 risk):
  ```
  npm view embla-carousel-wheel-gestures version time.modified
  ```
  Expected: last modified within 12 months. If older than 12 months, STOP and escalate — fallback path is vendoring the ~80-line plugin (handled in Task C2-alt below).
- [ ] Verify install:
  ```
  npx tsc --noEmit
  npx astro check
  ```
  Expected: zero errors.

**Verification gate:** `astro check` passes, `package.json` lists all four new deps + `@astrojs/tailwind`.

**Commit checkpoint (USER-RUN COMMAND):**
```bash
cd ~/Projects/active/ask149.github.io
git add package.json package-lock.json astro.config.* tailwind.config.* src/styles/global.css
git commit -m "chore(v3): install tailwind + motion + embla deps"
```

### Task A2 — Add shadcn Carousel primitive

**Files:** Create `src/components/ui/carousel.tsx` (auto-generated), modify `components.json` (auto), modify `src/styles/global.css` (Tailwind base layer auto-edit)

- [ ] Run the shadcn init if not already done:
  ```
  npx shadcn@latest init --yes --base-color neutral --css-variables true
  ```
  - When prompted for `tsx`, accept (`true`). Style: `new-york`.
- [ ] Add Carousel:
  ```
  npx shadcn@latest add carousel --yes
  ```
- [ ] Confirm file exists: `ls src/components/ui/carousel.tsx`
- [ ] Confirm `embla-carousel-react` import resolves: `npx tsc --noEmit`

**Verification gate:** `src/components/ui/carousel.tsx` exists with shadcn's verbatim source; tsc passes.

**Commit checkpoint (USER-RUN COMMAND):**
```bash
git add src/components/ui/carousel.tsx components.json src/lib/utils.ts src/styles/global.css
git commit -m "feat(v3): add shadcn Carousel primitive"
```

### Task A3 — Create persona registry

**Files:** Create `src/personas/registry.ts`

- [ ] Verify before-state: `ls src/personas` → should report "No such file or directory".
- [ ] Create `src/personas/registry.ts` with EXACT content from spec §4.1:
  ```ts
  import type { CollectionKey } from "astro:content";
  import type { ComponentType } from "react";

  export type PersonaId = "coder" | "traveler" | "curate" | "made";

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
      heroLoader: () => import("../components/coder/CoderHero.astro") as any,
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
      heroLoader: () => import("../components/traveler/TravelerHero.astro") as any,
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
      heroLoader: () => import("../components/curate/CurateHero.astro") as any,
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
      heroLoader: () => import("../components/made/MadeHero.astro") as any,
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

> NOTE: `heroLoader` references hero components that don't exist yet — they're created in Tasks B2, C5, D3, E3. The `as any` cast preserves the public type from spec §4.1 while allowing the registry to compile before hero components land. After all hero components exist, remove the `as any` casts in Task F1.

- [ ] Verify: `npx tsc --noEmit`. Expected: the registry compiles even though the lazy imports will fail at runtime until later phases. TypeScript only checks syntactic existence of the import path string, not the target file.
- [ ] If tsc complains about unresolved imports (depends on tsconfig `moduleResolution`), temporarily use string-only `heroLoader` paths and import them dynamically at the call site. Document the deviation inline.

**Verification gate:** `npx tsc --noEmit` passes; `PERSONAS` exports 4 entries; `getPersonaById('coder')` would resolve.

**Commit checkpoint (USER-RUN COMMAND):**
```bash
git add src/personas/registry.ts
git commit -m "feat(v3): add persona registry — single source of truth for 4 personas"
```

### Task A4 — Split tokens into per-persona modules

**Files:** Modify `src/styles/tokens.css` (shrink), create `src/styles/personas/coder.css`, `src/styles/personas/traveler.css`, `src/styles/personas/curate.css`, `src/styles/personas/made.css`

- [ ] Verify before-state: `ls src/styles/personas` → "No such file or directory".
- [ ] Replace `src/styles/tokens.css` with neutral-only tokens (spec §7.2):
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
    --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
    --success: #5B8C5A;
  }
  ```
- [ ] Create `src/styles/personas/coder.css` (spec §7.1 Coder tokens — preserves v2's existing palette):
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
    --polaroid-bg: #FFFFFF;
    --polaroid-shadow: 0 1px 2px rgba(0,0,0,0.08);
    --font-display: "Newsreader", serif;
    --font-body: "Newsreader", serif;
    --font-mono: "JetBrains Mono", ui-monospace, monospace;
  }
  ```
- [ ] Create `src/styles/personas/traveler.css` (spec §7.1 Traveler):
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
- [ ] Create `src/styles/personas/curate.css` (spec §7.1 Curator):
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
    --accent-secondary: #B89968;
    --surface: #FFFFFFCC;
    --polaroid-bg: #FFFFFF;
    --polaroid-shadow: 0 1px 2px rgba(0,0,0,0.08);
    --font-display: "Newsreader", serif;
    --font-display-style: italic;
    --font-body: "Newsreader", serif;
    --font-mono: "JetBrains Mono", ui-monospace, monospace;
  }
  ```
- [ ] Create `src/styles/personas/made.css` (spec §7.1 Maker):
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
    --polaroid-bg: #F5EFE0;
    --polaroid-shadow: 0 1px 2px rgba(0,0,0,0.3);
    --font-display: "Newsreader", serif;
    --font-body: "Newsreader", serif;
    --font-mono: "JetBrains Mono", ui-monospace, monospace;
  }
  ```
- [ ] Copy each persona CSS into `public/styles/personas/` so `<link rel="stylesheet" href="/styles/personas/<id>.css">` resolves. (Astro serves `public/` at site root.) Use:
  ```
  python3 -c "import os, shutil; os.makedirs('public/styles/personas', exist_ok=True); [shutil.copy(f'src/styles/personas/{x}.css', f'public/styles/personas/{x}.css') for x in ['coder','traveler','curate','made']]"
  ```
  > ALTERNATIVE (cleaner, preferred if time): use Astro `import` of the CSS in `PersonaLayout.astro` instead of `<link>` — Astro will bundle it. Spec §4.3 uses `<link>`, so we follow spec literally; this avoids dynamic-import-of-CSS quirks.

**Verification gate:** `npx astro check` passes. `ls src/styles/personas/` shows 4 files. `ls public/styles/personas/` shows 4 files.

**Commit checkpoint (USER-RUN COMMAND):**
```bash
git add src/styles/tokens.css src/styles/personas public/styles/personas
git commit -m "feat(v3): split tokens into per-persona modules"
```

### Task A5 — Shared chrome components

**Files:** Create `src/components/chrome/TopNav.astro`, `src/components/chrome/FooterStatus.astro`

- [ ] Verify before-state: `ls src/components/chrome` → "No such file or directory".
- [ ] Create `src/components/chrome/TopNav.astro` (spec §4.2 verbatim, with styles inline):
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
  </nav>

  <style>
    .top-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--rule);
      max-width: var(--max-w-feed);
      margin: 0 auto;
    }
    .brand {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 600;
      text-decoration: none;
      color: var(--fg);
    }
    .tabs {
      display: flex;
      gap: var(--space-2);
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .tab {
      position: relative;
      padding: var(--space-2) var(--space-4);
      text-decoration: none;
      color: var(--fg-muted);
      font-family: var(--font-body);
      border-radius: var(--radius-pill);
      transition: color var(--transition-fast);
    }
    .tab:hover { color: var(--fg); }
    .tab.active { color: var(--accent); }
    .pill {
      position: absolute;
      inset: 0;
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      border-radius: var(--radius-pill);
      z-index: -1;
    }
    .label { position: relative; z-index: 1; }
  </style>
  ```
- [ ] Create `src/components/chrome/FooterStatus.astro`:
  ```astro
  ---
  import { getPersonaByRoute } from "../../personas/registry";
  const persona = getPersonaByRoute(Astro.url.pathname);
  // Read build-time commit hash + date via Node child_process at build only
  let commitHash = "dev";
  let commitTime = "";
  try {
    const { execSync } = await import("node:child_process");
    commitHash = execSync("git rev-parse --short HEAD").toString().trim();
    commitTime = execSync("git log -1 --format=%cr").toString().trim();
  } catch {}
  ---
  <footer class="footer-status" aria-label="Site status">
    <span class="left">
      last commit: <a href="/changelog"><code>{commitHash}</code></a>
      {commitTime && <span class="muted">· {commitTime}</span>}
    </span>
    <span class="center">
      {persona ? `current: ${persona.label} · §${persona.sectionNumber}` : ""}
    </span>
    <span class="right">
      <span id="hit-counter" class="muted">···</span>
    </span>
  </footer>

  <style>
    .footer-status {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: var(--space-4);
      padding: var(--space-3) var(--space-6);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--fg-muted);
      border-top: 1px solid var(--rule);
      max-width: var(--max-w-feed);
      margin: 0 auto;
    }
    .right { text-align: right; }
    .muted { color: var(--fg-faint); }
    a { color: inherit; text-decoration: underline; text-decoration-color: var(--rule); }
  </style>
  ```

**Verification gate:** `npx astro check` passes. Files exist at correct paths.

**Commit checkpoint (USER-RUN COMMAND):**
```bash
git add src/components/chrome/
git commit -m "feat(v3): TopNav + FooterStatus shared chrome"
```

### Task A6 — Shared PersonaLayout with `<ClientRouter />`

**Files:** Create `src/layouts/PersonaLayout.astro`

- [ ] Create `src/layouts/PersonaLayout.astro` (spec §4.3 verbatim, plus `<head>` essentials migrated from `Base.astro`):
  ```astro
  ---
  import { ClientRouter } from "astro:transitions";
  import { getPersonaById, type PersonaId } from "../personas/registry";
  import TopNav from "../components/chrome/TopNav.astro";
  import FooterStatus from "../components/chrome/FooterStatus.astro";
  import "../styles/tokens.css";
  import "../styles/global.css";

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
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <meta name="generator" content={Astro.generator} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="stylesheet" href={`/styles/${persona.tokensHref}`} />
      <ClientRouter />
    </head>
    <body class={`persona-${persona.id}`}>
      <TopNav />
      <main {...persona.transitionMode === "fade" ? { "transition:animate": "fade" } : {}}>
        <slot />
      </main>
      <FooterStatus />
    </body>
  </html>

  <style is:global>
    body {
      background: var(--bg);
      color: var(--fg);
      font-family: var(--font-body);
      margin: 0;
      min-height: 100vh;
    }
    main {
      max-width: var(--max-w-feed);
      margin: 0 auto;
      padding: var(--space-8) var(--space-6);
    }
  </style>
  ```

- [ ] Verify build:
  ```
  npx astro check
  npx astro build
  ```
  Expected: build succeeds. Existing routes (`/`, `/feed`, `/now`, `/uses`, `/writing`, `/projects`, `/agents`, `/sudo`, `/cost`, `/404`) still build because they import `Base.astro`, not `PersonaLayout.astro`.

**Verification gate:** `astro build` succeeds, dist/ contains all existing routes, no TypeScript errors.

**Commit checkpoint (USER-RUN COMMAND):**
```bash
git add src/layouts/PersonaLayout.astro
git commit -m "feat(v3): PersonaLayout — chrome + ClientRouter + persona tokens"
```

---

## Phase B — Coder tab refactor (~1 day)

Purpose: Move v2's existing homepage into PersonaLayout, build ProjectGrid + ProjectCard + TechChip with motion stagger + tag cross-filter. LiveFeed island untouched.

### Task B1 — Coder hero (Astro)

**Files:** Create `src/components/coder/CoderHero.astro`

- [ ] Verify before-state: `ls src/components/coder` → "No such file or directory".
- [ ] Create `src/components/coder/CoderHero.astro` — extract the hero/status-line block from current `src/pages/index.astro`. Inspect current `index.astro` (read first 80 lines), then move the hero section (name + role + transition line + manifesto lead-in) into this new component verbatim. Keep markup minimal — no React.

**Verification gate:** Component renders standalone (will be wired up in B5).

### Task B2 — TechChip component

**Files:** Create `src/components/coder/TechChip.tsx`

- [ ] Verify before-state: file does not exist.
- [ ] Create `src/components/coder/TechChip.tsx` (spec §5.1):
  ```tsx
  import { memo } from "react";

  export interface TechChipProps {
    tag: string;
    active: boolean;
    onToggle: (tag: string) => void;
  }

  export const TechChip = memo(function TechChip({ tag, active, onToggle }: TechChipProps) {
    return (
      <button
        type="button"
        onClick={() => onToggle(tag)}
        aria-pressed={active}
        className={[
          "px-3 py-1 text-sm font-mono rounded-full border transition-colors",
          active
            ? "bg-[color:var(--accent)] text-[color:var(--bg)] border-[color:var(--accent)]"
            : "text-[color:var(--fg-muted)] border-[color:var(--rule)] hover:text-[color:var(--fg)]",
        ].join(" ")}
      >
        {tag}
      </button>
    );
  });
  ```
- [ ] Verify: `npx tsc --noEmit`.

**Verification gate:** Compiles, no type errors.

### Task B3 — ProjectCard component

**Files:** Create `src/components/coder/ProjectCard.tsx`

- [ ] Create `src/components/coder/ProjectCard.tsx` (spec §5.1):
  ```tsx
  import { motion } from "motion/react";

  export interface ProjectCardProps {
    slug: string;
    title: string;
    blurb: string;
    tags: readonly string[];
    url?: string;
    cover?: { src: string; alt: string };
    featured?: boolean;
    activeFilters: ReadonlySet<string>;
  }

  export function ProjectCard(props: ProjectCardProps) {
    const { slug, title, blurb, tags, url, cover, featured, activeFilters } = props;
    const dimmed = activeFilters.size > 0 && !tags.some((t) => activeFilters.has(t));
    const href = url ?? `/projects/${slug}`;
    return (
      <motion.a
        href={href}
        variants={{
          hidden: { opacity: 0, y: 8 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        viewport={{ once: true, margin: "-10%" }}
        animate={dimmed ? { opacity: 0.3 } : { opacity: 1 }}
        className={[
          "group flex flex-col gap-2 p-4 border rounded-md",
          "border-[color:var(--rule)] bg-[color:var(--surface)]",
          "transition-colors hover:border-[color:var(--accent)]",
          featured ? "ring-1 ring-[color:var(--accent)]" : "",
        ].join(" ")}
      >
        {cover ? (
          <img src={cover.src} alt={cover.alt} className="w-full h-32 object-cover rounded-sm" />
        ) : (
          <pre className="font-mono text-xs text-[color:var(--fg-faint)] leading-tight">
            {`┌──────────────┐\n│  ${slug.slice(0, 12).padEnd(12)}  │\n└──────────────┘`}
          </pre>
        )}
        <h3 className="font-display text-lg text-[color:var(--fg)]">{title}</h3>
        <p className="text-sm text-[color:var(--fg-muted)]">{blurb}</p>
        <ul className="flex flex-wrap gap-1 mt-auto">
          {tags.map((t) => (
            <li key={t} className="text-xs font-mono text-[color:var(--fg-faint)]">
              #{t}
            </li>
          ))}
        </ul>
      </motion.a>
    );
  }
  ```

**Verification gate:** `npx tsc --noEmit` passes.

### Task B4 — ProjectGrid (motion stagger + tag cross-filter)

**Files:** Create `src/components/coder/ProjectGrid.tsx`

- [ ] Create `src/components/coder/ProjectGrid.tsx` (spec §5.1):
  ```tsx
  import { useState, useMemo, useCallback } from "react";
  import { motion } from "motion/react";
  import { ProjectCard, type ProjectCardProps } from "./ProjectCard";
  import { TechChip } from "./TechChip";

  type Project = Omit<ProjectCardProps, "activeFilters">;

  export interface ProjectGridProps {
    projects: Project[];
    allTags: string[];
  }

  export function ProjectGrid({ projects, allTags }: ProjectGridProps) {
    const [active, setActive] = useState<Set<string>>(new Set());

    const toggle = useCallback((tag: string) => {
      setActive((prev) => {
        const next = new Set(prev);
        if (next.has(tag)) next.delete(tag);
        else next.add(tag);
        return next;
      });
    }, []);

    const filtered = useMemo(() => {
      if (active.size === 0) return projects;
      return projects.filter((p) => p.tags.some((t) => active.has(t)));
    }, [projects, active]);

    return (
      <section aria-label="Projects">
        <ul className="flex flex-wrap gap-2 mb-6" aria-label="Filter by tag">
          {allTags.map((t) => (
            <li key={t}>
              <TechChip tag={t} active={active.has(t)} onToggle={toggle} />
            </li>
          ))}
        </ul>
        {filtered.length === 0 ? (
          <p className="text-[color:var(--fg-muted)]">
            no projects match.{" "}
            <button
              onClick={() => setActive(new Set())}
              className="underline"
            >
              reset
            </button>
          </p>
        ) : (
          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((p) => (
              <li key={p.slug}>
                <ProjectCard {...p} activeFilters={active} />
              </li>
            ))}
          </motion.ul>
        )}
      </section>
    );
  }
  ```

**Verification gate:** `npx tsc --noEmit` passes.

### Task B5 — Refactor `src/pages/index.astro` to PersonaLayout

**Files:** Modify `src/pages/index.astro`

- [ ] Verify before-state: current `index.astro` imports `Base.astro` and renders the v2 homepage inline.
- [ ] Replace `src/pages/index.astro` with:
  ```astro
  ---
  import PersonaLayout from "../layouts/PersonaLayout.astro";
  import CoderHero from "../components/coder/CoderHero.astro";
  import { ProjectGrid } from "../components/coder/ProjectGrid";
  import LiveFeed from "../components/LiveFeed";
  import { getCollection } from "astro:content";

  const projectsRaw = await getCollection("projects");
  const projects = projectsRaw
    .filter((p) => !p.data.draft)
    .sort((a, b) => {
      if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
      return (b.data.date?.valueOf() ?? 0) - (a.data.date?.valueOf() ?? 0);
    })
    .map((p) => ({
      slug: p.slug,
      title: p.data.title,
      blurb: p.data.blurb,
      tags: p.data.tags ?? [],
      url: p.data.url,
      cover: p.data.cover ? { src: p.data.cover.src, alt: p.data.coverAlt ?? "" } : undefined,
      featured: p.data.featured ?? false,
    }));

  const allTags = Array.from(
    new Set(projects.flatMap((p) => p.tags))
  ).sort();
  ---
  <PersonaLayout
    personaId="coder"
    title="Ashish Kshirsagar — Senior SWE, vibe-coding with 4 agents"
    description="Coder portfolio: projects, manifesto, live agent feed."
  >
    <CoderHero />
    <LiveFeed client:visible />
    <ProjectGrid projects={projects} allTags={allTags} client:visible />
  </PersonaLayout>
  ```
- [ ] If the existing `projects` collection schema fields don't include `featured`, `blurb`, `tags`, `cover`, `coverAlt`, `url`, `draft`, or `date` — DO NOT modify the schema (out of scope). Instead, fall back to whatever fields exist and graceful-default the rest. Read `src/content/config.ts` first to confirm field names; adjust the mapping above accordingly. Document any divergence inline as a comment.
- [ ] Verify build:
  ```
  npx astro check
  npx astro build
  ```
  Expected: `/` builds; `dist/index.html` contains the new chrome.
- [ ] Manual smoke: `npx astro dev`, open `http://localhost:4321/`, verify: top nav has 4 tabs, Coder is active, LiveFeed renders, ProjectGrid renders with stagger reveal, clicking a tag chip filters cards, second click on same chip clears its filter.

**Verification gate:** Build succeeds, manual smoke confirms behavior. Lighthouse Performance ≥ 95 on `/` (`npx lighthouse http://localhost:4321/ --only-categories=performance --form-factor=mobile`).

**Commit checkpoint (USER-RUN COMMAND):**
```bash
git add src/components/coder src/pages/index.astro
git commit -m "feat(v3): Coder tab — ProjectGrid + motion stagger + tag filter"
```

---

## Phase C — Traveler tab (~2–3 days) — researcher's #1 priority

Purpose: Build the horizontal polaroid timeline with shadcn Carousel + Embla + wheel-gestures plugin. Sticky year-marker. Touch + drag + arrow keys + scroll wheel all work.

### Task C1 — Verify embla-carousel-wheel-gestures alive on npm

**Files:** None (verification only)

- [ ] Run:
  ```
  npm view embla-carousel-wheel-gestures version time.modified description
  ```
- [ ] Confirm last-modified date is within 12 months. If yes → proceed to C2. If no → use vendored fallback path: copy the plugin source into `src/lib/embla-wheel-gestures.ts` from its GitHub repo (~80 lines) and skip the npm dep. Document the deviation as a comment in `package.json` or in this task block.

**Verification gate:** Decision recorded; either npm dep installed (Task A1) or vendored.

### Task C2 — `places` content collection + Zod schema

**Files:** Modify `src/content/config.ts`, create `src/content/places/` directory

- [ ] Read current `src/content/config.ts` to confirm the import style (`defineCollection`, `z`) and existing collections (`essays`, `projects`).
- [ ] Append to `src/content/config.ts` (spec §6.1):
  ```ts
  const places = defineCollection({
    type: "content",
    schema: ({ image }) => z.object({
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
    }),
  });
  ```
- [ ] Update the `collections` export at the bottom of the file to include `places`:
  ```ts
  export const collections = { essays, projects, places };
  ```

### Task C3 — Seed 4–5 place entries

**Files:** Create `src/content/places/2019-pune-school.md`, `src/content/places/2022-tempe-asu.md`, `src/content/places/2024-seattle.md`, `src/content/places/2026-pune-return.md`

- [ ] Create each starter entry. Example for Seattle:
  ```markdown
  ---
  title: "Seattle"
  country: "United States"
  countryCode: "US"
  airportCode: "SEA"
  yearMonth: "2024-06"
  durationDays: 720
  reason: "work"
  favorite: false
  coverAlt: "Space Needle silhouette against blue sky"
  ---
  Microsoft. Two years. Rain, ferries, Mt Rainier on clear days.
  ```
- [ ] Repeat for Pune-school (2019-06), Tempe-ASU (2022-08), and the future stop Pune-return (2026-06, `reason: "wedding"`).
- [ ] Verify build picks them up:
  ```
  npx astro check
  ```

**Verification gate:** `astro check` passes; collection has 4+ entries.

### Task C4 — Polaroid, YearMarker, NextStopCard, TravelerHero

**Files:** Create `src/components/traveler/Polaroid.tsx`, `src/components/traveler/YearMarker.tsx`, `src/components/traveler/NextStopCard.astro`, `src/components/traveler/TravelerHero.astro`

- [ ] Create `src/components/traveler/Polaroid.tsx` (spec §5.2):
  ```tsx
  export interface PolaroidProps {
    slug: string;
    title: string;
    country: string;
    airportCode?: string;
    yearMonth: string;
    image: { src: string; alt: string };
    caption?: string;
  }

  function jitter(slug: string): number {
    // Deterministic ±2deg based on slug hash
    let h = 0;
    for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
    return ((h % 400) / 100) - 2; // -2.00 .. +1.99
  }

  export function Polaroid({ slug, title, country, airportCode, yearMonth, image, caption }: PolaroidProps) {
    const rotate = jitter(slug);
    return (
      <figure
        style={{ transform: `rotate(${rotate}deg)` }}
        className="bg-[color:var(--polaroid-bg)] shadow-[var(--polaroid-shadow)] p-3 pb-6 w-56 select-none"
      >
        {image.src ? (
          <img src={image.src} alt={image.alt} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 grid place-items-center bg-[color:var(--rule)] font-mono text-2xl text-[color:var(--fg-muted)]">
            {airportCode ?? title.slice(0, 3).toUpperCase()}
          </div>
        )}
        <figcaption className="mt-3 font-display text-base text-[color:var(--fg)]">
          {title}, {country}
          <div className="font-mono text-xs text-[color:var(--fg-muted)] mt-1">
            {yearMonth}{airportCode ? ` · ${airportCode}` : ""}
          </div>
          {caption && <p className="font-body text-sm mt-2 text-[color:var(--fg-muted)]">{caption}</p>}
        </figcaption>
      </figure>
    );
  }
  ```

- [ ] Create `src/components/traveler/YearMarker.tsx`:
  ```tsx
  export interface YearMarkerProps {
    year: number;
    count: number;
  }
  export function YearMarker({ year, count }: YearMarkerProps) {
    return (
      <div className="sticky top-0 z-10 bg-[color:var(--bg)] py-2 border-b border-[color:var(--rule)]">
        <span className="font-display text-3xl text-[color:var(--fg)]">{year}</span>
        <span className="ml-3 font-mono text-xs text-[color:var(--fg-muted)]">
          {count} place{count === 1 ? "" : "s"}
        </span>
      </div>
    );
  }
  ```

- [ ] Create `src/components/traveler/NextStopCard.astro`:
  ```astro
  ---
  export interface Props { name: string; date: string; reason: string; }
  const { name, date, reason } = Astro.props;
  ---
  <aside class="next-stop">
    <h3>next stop</h3>
    <p class="name">{name}</p>
    <p class="date">{date}</p>
    <p class="reason">{reason}</p>
  </aside>
  <style>
    .next-stop {
      border: 1px dashed var(--rule);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      max-width: 14rem;
    }
    h3 { font-family: var(--font-mono); font-size: 0.75rem; color: var(--fg-muted); text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 var(--space-2); }
    .name { font-family: var(--font-display); font-size: 1.25rem; margin: 0; }
    .date { font-family: var(--font-mono); font-size: 0.85rem; color: var(--fg-muted); margin: var(--space-1) 0; }
    .reason { font-size: 0.85rem; color: var(--fg-muted); margin: 0; }
  </style>
  ```

- [ ] Create `src/components/traveler/TravelerHero.astro`:
  ```astro
  ---
  ---
  <header class="traveler-hero">
    <h1>traveler</h1>
    <p>places visited, places next. drag, scroll, or arrow-key your way through.</p>
  </header>
  <style>
    .traveler-hero { padding: var(--space-6) 0 var(--space-4); }
    h1 { font-family: var(--font-display); font-size: 2.5rem; margin: 0; color: var(--fg); }
    p { color: var(--fg-muted); margin: var(--space-2) 0 0; }
  </style>
  ```

**Verification gate:** `npx tsc --noEmit && npx astro check` pass.

### Task C5 — TravelTimeline (shadcn Carousel + WheelGesturesPlugin)

**Files:** Create `src/components/traveler/TravelTimeline.tsx`

- [ ] Create `src/components/traveler/TravelTimeline.tsx`:
  ```tsx
  import { useState, useEffect } from "react";
  import WheelGesturesPlugin from "embla-carousel-wheel-gestures";
  import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
    type CarouselApi,
  } from "../ui/carousel";
  import { Polaroid, type PolaroidProps } from "./Polaroid";
  import { YearMarker } from "./YearMarker";

  type Place = PolaroidProps & { yearMonth: string };

  export interface TravelTimelineProps {
    places: Place[];
    nextStop?: { name: string; date: string; reason: string };
  }

  export function TravelTimeline({ places }: TravelTimelineProps) {
    const [api, setApi] = useState<CarouselApi | undefined>(undefined);
    const [activeYear, setActiveYear] = useState<number>(() =>
      places[0] ? Number(places[0].yearMonth.slice(0, 4)) : new Date().getFullYear()
    );

    useEffect(() => {
      if (!api) return;
      const handler = () => {
        const idx = api.selectedScrollSnap();
        const p = places[idx];
        if (p) setActiveYear(Number(p.yearMonth.slice(0, 4)));
      };
      api.on("select", handler);
      handler();
      return () => { api.off("select", handler); };
    }, [api, places]);

    const countThisYear = places.filter((p) => p.yearMonth.startsWith(String(activeYear))).length;

    return (
      <div className="relative">
        <YearMarker year={activeYear} count={countThisYear} />
        <Carousel
          opts={{ align: "start", dragFree: true, loop: false }}
          plugins={[WheelGesturesPlugin()]}
          setApi={setApi}
          className="mt-4"
        >
          <CarouselContent className="-ml-4">
            {places.map((p) => (
              <CarouselItem key={p.slug} className="pl-4 basis-auto">
                <Polaroid {...p} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    );
  }
  ```
- [ ] If `embla-carousel-wheel-gestures` was vendored (Task C1 fallback), change the import path to `"../../lib/embla-wheel-gestures"`.

**Verification gate:** `npx tsc --noEmit` passes.

### Task C6 — `/traveler` route

**Files:** Create `src/pages/traveler.astro`

- [ ] Create `src/pages/traveler.astro`:
  ```astro
  ---
  import PersonaLayout from "../layouts/PersonaLayout.astro";
  import TravelerHero from "../components/traveler/TravelerHero.astro";
  import NextStopCard from "../components/traveler/NextStopCard.astro";
  import { TravelTimeline } from "../components/traveler/TravelTimeline";
  import { getCollection } from "astro:content";

  const raw = await getCollection("places", (e) => !e.data.draft);
  const places = raw
    .sort((a, b) => a.data.yearMonth.localeCompare(b.data.yearMonth))
    .map((e) => ({
      slug: e.slug,
      title: e.data.title,
      country: e.data.country,
      airportCode: e.data.airportCode,
      yearMonth: e.data.yearMonth,
      image: e.data.cover
        ? { src: e.data.cover.src, alt: e.data.coverAlt }
        : { src: "", alt: e.data.coverAlt ?? "" },
    }));
  ---
  <PersonaLayout
    personaId="traveler"
    title="Traveler — Ashish Kshirsagar"
    description="Horizontal timeline of places visited and places next."
  >
    <TravelerHero />
    <TravelTimeline places={places} client:visible />
    <NextStopCard name="Pune" date="June 2026" reason="wedding + relocation" />
  </PersonaLayout>
  ```

- [ ] Build + smoke:
  ```
  npx astro check
  npx astro build
  npx astro dev
  ```
  Open `http://localhost:4321/traveler` — verify: chrome shows Traveler tab active, polaroids render in chronological order, drag works (mouse + touch + wheel), arrow buttons work, year-marker updates on slide change.

- [ ] Verify before-state was 404: before this task, `curl http://localhost:4321/traveler` would 404. After: 200.

**Verification gate:** `/traveler` returns 200, all interaction modes work (drag, swipe, wheel, arrow keys), year-marker reactive. Lighthouse Performance ≥ 95.

**Commit checkpoint (USER-RUN COMMAND):**
```bash
git add src/content/config.ts src/content/places src/components/traveler src/pages/traveler.astro
git commit -m "feat(v3): Traveler tab — Embla carousel + wheel gestures + sticky year marker"
```

---

## Phase D — Curator tab (~1 day)

Purpose: Pure-Astro literary tab. Zero JS. Now-Reading + daily deterministic quote + Finished grid.

### Task D1 — `books` collection + seed entries

**Files:** Modify `src/content/config.ts`, create `src/content/books/now-invisible-cities.md`, `src/content/books/2025-east-of-eden.md`, `src/content/books/2025-the-dispossessed.md`

- [ ] Append to `src/content/config.ts` (spec §6.2):
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
- [ ] Update `export const collections` to include `books`.
- [ ] Seed `now-invisible-cities.md`:
  ```markdown
  ---
  title: "Invisible Cities"
  author: "Italo Calvino"
  status: "reading"
  startedDate: 2026-05-01
  quote:
    text: "Cities, like dreams, are made of desires and fears."
    page: 44
  tags: ["fiction", "literary"]
  ---
  Picked up after spec work. Reading one city per evening.
  ```
- [ ] Seed `2025-east-of-eden.md` (status: finished, rating: 4, quote optional). Steinbeck.
- [ ] Seed `2025-the-dispossessed.md` (status: finished, rating: 5, quote with text + page). Le Guin.

**Verification gate:** `npx astro check` passes; collection loads 3 entries.

### Task D2 — Curator components (pure Astro)

**Files:** Create `src/components/curate/CurateHero.astro`, `src/components/curate/NowReading.astro`, `src/components/curate/QuoteRotator.astro`, `src/components/curate/FinishedGrid.astro`

- [ ] Create `src/components/curate/CurateHero.astro`:
  ```astro
  ---
  ---
  <header class="curate-hero">
    <h1><em>curate</em></h1>
    <p>books, quotes, taste. one quote per day.</p>
  </header>
  <style>
    .curate-hero { padding: var(--space-6) 0 var(--space-4); }
    h1 { font-family: var(--font-display); font-style: italic; font-size: 2.5rem; margin: 0; color: var(--fg); }
    p { color: var(--fg-muted); margin: var(--space-2) 0 0; }
  </style>
  ```

- [ ] Create `src/components/curate/NowReading.astro` (spec §5.3):
  ```astro
  ---
  import type { CollectionEntry } from "astro:content";
  export interface Props { book: CollectionEntry<"books"> | undefined; }
  const { book } = Astro.props;
  ---
  {book ? (
    <section class="now-reading">
      <h2>now reading</h2>
      <div class="card">
        {book.data.cover && (
          <img src={book.data.cover.src} alt={book.data.coverAlt} />
        )}
        <div>
          <h3>{book.data.title}</h3>
          <p class="author">{book.data.author}</p>
          {book.data.startedDate && (
            <p class="meta">started {book.data.startedDate.toISOString().slice(0,10)}</p>
          )}
        </div>
      </div>
    </section>
  ) : (
    <p class="empty">between books.</p>
  )}
  <style>
    .now-reading { margin: var(--space-8) 0; }
    h2 { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--fg-muted); margin: 0 0 var(--space-3); }
    .card { display: flex; gap: var(--space-4); align-items: flex-start; }
    .card img { width: 96px; height: auto; border-radius: var(--radius-sm); box-shadow: var(--polaroid-shadow); }
    .card h3 { font-family: var(--font-display); font-size: 1.5rem; margin: 0; color: var(--fg); }
    .author { font-family: var(--font-display); font-style: italic; color: var(--fg-muted); margin: var(--space-1) 0; }
    .meta { font-family: var(--font-mono); font-size: 0.75rem; color: var(--fg-faint); margin: 0; }
    .empty { font-family: var(--font-display); font-style: italic; color: var(--fg-muted); }
  </style>
  ```

- [ ] Create `src/components/curate/QuoteRotator.astro` (spec §5.3):
  ```astro
  ---
  export interface Props { quotes: { text: string; source: string }[]; }
  const { quotes } = Astro.props;
  const idx = quotes.length > 0 ? Math.floor(Date.now() / 86_400_000) % quotes.length : 0;
  const today = quotes[idx];
  ---
  {today && (
    <blockquote class="quote">
      <p>{today.text}</p>
      <cite>— {today.source}</cite>
    </blockquote>
  )}
  <style>
    .quote { margin: var(--space-8) 0; padding: var(--space-6); border-left: 3px solid var(--accent); background: var(--surface); }
    p { font-family: var(--font-display); font-style: italic; font-size: 1.25rem; line-height: 1.5; color: var(--fg); margin: 0 0 var(--space-3); }
    cite { font-family: var(--font-mono); font-size: 0.8rem; color: var(--fg-muted); font-style: normal; }
  </style>
  ```

- [ ] Create `src/components/curate/FinishedGrid.astro` (spec §5.3):
  ```astro
  ---
  import type { CollectionEntry } from "astro:content";
  export interface Props { books: CollectionEntry<"books">[]; limit?: number; }
  const { books, limit = 8 } = Astro.props;
  const finished = books
    .filter((b) => b.data.status === "finished")
    .sort((a, b) => (b.data.finishedDate?.valueOf() ?? 0) - (a.data.finishedDate?.valueOf() ?? 0))
    .slice(0, limit);
  ---
  {finished.length > 0 && (
    <section class="finished">
      <h2>recently finished</h2>
      <ul>
        {finished.map((b) => (
          <li>
            <span class="title">{b.data.title}</span>
            <span class="author">— {b.data.author}</span>
            {b.data.rating && <span class="rating">{"★".repeat(b.data.rating)}{"☆".repeat(5 - b.data.rating)}</span>}
          </li>
        ))}
      </ul>
    </section>
  )}
  <style>
    .finished { margin: var(--space-8) 0; }
    h2 { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--fg-muted); margin: 0 0 var(--space-3); }
    ul { list-style: none; padding: 0; margin: 0; }
    li { padding: var(--space-2) 0; border-bottom: 1px solid var(--rule); display: flex; gap: var(--space-3); flex-wrap: wrap; }
    .title { font-family: var(--font-display); color: var(--fg); }
    .author { font-family: var(--font-display); font-style: italic; color: var(--fg-muted); }
    .rating { font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent); margin-left: auto; }
  </style>
  ```

**Verification gate:** `npx astro check` passes.

### Task D3 — `/curate` route

**Files:** Create `src/pages/curate.astro`

- [ ] Verify before-state: `curl localhost:4321/curate` would 404.
- [ ] Create `src/pages/curate.astro`:
  ```astro
  ---
  import PersonaLayout from "../layouts/PersonaLayout.astro";
  import CurateHero from "../components/curate/CurateHero.astro";
  import NowReading from "../components/curate/NowReading.astro";
  import QuoteRotator from "../components/curate/QuoteRotator.astro";
  import FinishedGrid from "../components/curate/FinishedGrid.astro";
  import { getCollection } from "astro:content";

  const all = await getCollection("books", (e) => !e.data.draft);
  const reading = all.find((b) => b.data.status === "reading");
  const quotes = all
    .filter((b) => !!b.data.quote)
    .map((b) => ({ text: b.data.quote!.text, source: `${b.data.title}, ${b.data.author}` }));
  ---
  <PersonaLayout personaId="curate" title="Curate — Ashish Kshirsagar" description="Books, quotes, taste.">
    <CurateHero />
    <NowReading book={reading} />
    <QuoteRotator quotes={quotes} />
    <FinishedGrid books={all} />
  </PersonaLayout>
  ```

- [ ] Build + smoke:
  ```
  npx astro build
  ```
  Verify `dist/curate/index.html` exists and contains the rendered Now-Reading + Quote + Finished list.

- [ ] **Zero-JS verification:** `npx astro dev`, open `/curate`, open DevTools Network tab, hard refresh, filter by JS. Expected: ZERO JS chunks loaded for `/curate`. (Astro's `<ClientRouter />` script counts as shared chrome but no persona-specific JS should load.)

**Verification gate:** `/curate` builds, renders, ships zero persona-specific JS. Lighthouse Performance ≥ 98.

**Commit checkpoint (USER-RUN COMMAND):**
```bash
git add src/content/config.ts src/content/books src/components/curate src/pages/curate.astro
git commit -m "feat(v3): Curator tab — pure Astro, zero-JS"
```

---

## Phase E — Maker tab (~0.5–1 day)

Purpose: Sparse-by-design tab. Empty grid placeholder (animate-pulse) cross-fades to populated grid via Motion's AnimatePresence when first shipped build lands.

### Task E1 — `builds` collection + seed queue

**Files:** Modify `src/content/config.ts`, create `src/content/builds/keyboard.md`, `src/content/builds/pen-rest.md`, `src/content/builds/weather-station.md`

- [ ] Append to `src/content/config.ts` (spec §6.3):
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
      why: z.string().optional(),
      draft: z.boolean().default(false),
    }),
  });
  ```
- [ ] Update `export const collections` to include `builds`.
- [ ] Seed `keyboard.md`:
  ```markdown
  ---
  title: "Hand-wired split keyboard"
  status: "queued"
  priority: 7
  addedDate: 2026-04-15
  blurb: "Corne layout, hand-wired matrix, walnut bottom plate."
  tags: ["hardware", "keyboard"]
  why: "Daily driver should be made, not bought."
  ---
  ```
- [ ] Seed `pen-rest.md` (notebook clip pen rest, walnut + brass, priority 5).
- [ ] Seed `weather-station.md` (ESP32 + e-paper garden weather, priority 6).

**Verification gate:** `npx astro check` passes; 3 entries load.

### Task E2 — Maker components

**Files:** Create `src/components/made/MadeHero.astro`, `src/components/made/EmptyPlaceholder.tsx`, `src/components/made/MakerGrid.tsx`, `src/components/made/BuildQueueList.astro`

- [ ] Create `src/components/made/MadeHero.astro`:
  ```astro
  ---
  ---
  <header class="made-hero">
    <h1>made</h1>
    <p>side builds and sketchbook. mostly aspirational right now.</p>
  </header>
  <style>
    .made-hero { padding: var(--space-6) 0 var(--space-4); }
    h1 { font-family: var(--font-display); font-size: 2.5rem; margin: 0; color: var(--fg); }
    p { color: var(--fg-muted); margin: var(--space-2) 0 0; }
  </style>
  ```

- [ ] Create `src/components/made/EmptyPlaceholder.tsx`:
  ```tsx
  export interface EmptyPlaceholderProps { pulseOpacity?: number; }
  export function EmptyPlaceholder(_: EmptyPlaceholderProps) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="motion-safe:animate-pulse border border-dashed border-[color:var(--rule)] rounded-md aspect-[3/2] grid place-items-center"
          >
            <span className="font-mono text-xs text-[color:var(--fg-faint)]">
              FIG. {i + 1} — empty
            </span>
          </div>
        ))}
      </div>
    );
  }
  ```

- [ ] Create `src/components/made/MakerGrid.tsx`:
  ```tsx
  import { motion, AnimatePresence } from "motion/react";
  import { EmptyPlaceholder } from "./EmptyPlaceholder";

  export interface Build {
    slug: string;
    title: string;
    blurb: string;
    status: "queued" | "building" | "shipped" | "abandoned";
    shippedDate?: string;
    tags: string[];
    cover?: { src: string; alt: string };
  }

  export interface MakerGridProps { builds: Build[]; }

  export function MakerGrid({ builds }: MakerGridProps) {
    const shipped = builds.filter((b) => b.status === "shipped");
    if (shipped.length === 0) {
      return <EmptyPlaceholder />;
    }
    return (
      <AnimatePresence initial={false} mode="popLayout">
        <motion.ul
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {shipped.map((b) => (
            <motion.li
              key={b.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="p-4 border border-[color:var(--rule)] rounded-md bg-[color:var(--surface)]"
            >
              <h3 className="font-display text-lg text-[color:var(--fg)]">{b.title}</h3>
              <p className="text-sm text-[color:var(--fg-muted)] mt-2">{b.blurb}</p>
              {b.shippedDate && (
                <p className="font-mono text-xs text-[color:var(--fg-faint)] mt-2">
                  shipped {b.shippedDate}
                </p>
              )}
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>
    );
  }
  ```

- [ ] Create `src/components/made/BuildQueueList.astro`:
  ```astro
  ---
  import type { CollectionEntry } from "astro:content";
  export interface Props { items: CollectionEntry<"builds">[]; }
  const { items } = Astro.props;
  const queued = items
    .filter((b) => b.data.status === "queued")
    .sort((a, b) => {
      if (b.data.priority !== a.data.priority) return b.data.priority - a.data.priority;
      return a.data.addedDate.valueOf() - b.data.addedDate.valueOf();
    });
  ---
  {queued.length > 0 && (
    <section class="queue">
      <h2>build queue</h2>
      <ul>
        {queued.map((b) => (
          <li>
            <span class="prio">P{b.data.priority}</span>
            <span class="title">{b.data.title}</span>
            <span class="blurb">{b.data.blurb}</span>
          </li>
        ))}
      </ul>
    </section>
  )}
  <style>
    .queue { margin-top: var(--space-12); }
    h2 { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--fg-muted); margin: 0 0 var(--space-3); }
    ul { list-style: none; padding: 0; margin: 0; border-top: 1px solid var(--rule); }
    li { display: grid; grid-template-columns: auto 1fr 2fr; gap: var(--space-3); padding: var(--space-3) 0; border-bottom: 1px solid var(--rule); font-family: var(--font-body); }
    .prio { font-family: var(--font-mono); color: var(--accent); font-size: 0.85rem; }
    .title { color: var(--fg); }
    .blurb { color: var(--fg-muted); font-size: 0.9rem; }
  </style>
  ```

**Verification gate:** `npx tsc --noEmit && npx astro check` pass.

### Task E3 — `/made` route

**Files:** Create `src/pages/made.astro`

- [ ] Create `src/pages/made.astro`:
  ```astro
  ---
  import PersonaLayout from "../layouts/PersonaLayout.astro";
  import MadeHero from "../components/made/MadeHero.astro";
  import { MakerGrid } from "../components/made/MakerGrid";
  import BuildQueueList from "../components/made/BuildQueueList.astro";
  import { getCollection } from "astro:content";

  const all = await getCollection("builds", (e) => !e.data.draft);
  const builds = all.map((b) => ({
    slug: b.slug,
    title: b.data.title,
    blurb: b.data.blurb,
    status: b.data.status,
    shippedDate: b.data.shippedDate?.toISOString().slice(0,10),
    tags: b.data.tags,
    cover: b.data.cover ? { src: b.data.cover.src, alt: b.data.coverAlt } : undefined,
  }));
  ---
  <PersonaLayout personaId="made" title="Made — Ashish Kshirsagar" description="Side builds and sketchbook.">
    <MadeHero />
    <MakerGrid builds={builds} client:visible />
    <BuildQueueList items={all} />
  </PersonaLayout>
  ```

- [ ] Build + smoke:
  ```
  npx astro build
  npx astro dev
  ```
  Open `/made`. Verify: dark persona theme active, empty placeholder grid pulses (motion-safe), 3-item build queue list renders below.

**Verification gate:** `/made` returns 200, dark theme applied, empty pulse renders, queue list visible.

**Commit checkpoint (USER-RUN COMMAND):**
```bash
git add src/content/config.ts src/content/builds src/components/made src/pages/made.astro
git commit -m "feat(v3): Maker tab — empty pulse + build queue"
```

---

## Phase F — Polish + verify (~1 day)

Purpose: All-routes verification. Lighthouse, bundle budget, reduced-motion, mobile, View Transitions fallback, no-JS.

### Task F1 — Production build + bundle budget

**Files:** None (verification)

- [ ] If `heroLoader` `as any` casts in `src/personas/registry.ts` (Task A3) can be safely removed now that all hero components exist, remove them.
- [ ] Clean build:
  ```
  python3 -c "import shutil, os; shutil.rmtree('dist', ignore_errors=True); print('cleaned')"
  npx astro build
  ```
- [ ] Bundle inspection — list all JS files in `dist/_astro` with sizes:
  ```
  find dist/_astro -name "*.js" -exec ls -lh {} \;
  ```
- [ ] Compute total gz size of incremental JS (everything in `dist/_astro/*.js`):
  ```
  python3 -c "import gzip, glob, os; total = sum(len(gzip.compress(open(p,'rb').read())) for p in glob.glob('dist/_astro/*.js')); print(f'{total} bytes = {total/1024:.1f} KB gz')"
  ```
  Expected: ≤ 35 KB gz total across all routes. If over, candidate cuts (in order): drop `embla-carousel-wheel-gestures` (touch + arrow keys still work); drop Motion's `<AnimatePresence>` in Maker (CSS-only fallback); reduce Motion features used in Coder.

**Verification gate:** Build succeeds, total incremental JS ≤ 35 KB gz.

### Task F2 — Lighthouse per persona route

**Files:** None (verification)

- [ ] Install Lighthouse if not present: `npm install -g lighthouse` (user-system level) or use `npx`.
- [ ] Start preview: `npx astro preview` (port 4321).
- [ ] Run audits (mobile, 4G throttling default):
  ```
  npx lighthouse http://localhost:4321/        --only-categories=performance,accessibility --form-factor=mobile --output=json --output-path=/tmp/lh-coder.json --quiet
  npx lighthouse http://localhost:4321/traveler --only-categories=performance,accessibility --form-factor=mobile --output=json --output-path=/tmp/lh-traveler.json --quiet
  npx lighthouse http://localhost:4321/curate   --only-categories=performance,accessibility --form-factor=mobile --output=json --output-path=/tmp/lh-curate.json --quiet
  npx lighthouse http://localhost:4321/made     --only-categories=performance,accessibility --form-factor=mobile --output=json --output-path=/tmp/lh-made.json --quiet
  ```
- [ ] Extract scores:
  ```
  python3 -c "
  import json, glob
  for p in sorted(glob.glob('/tmp/lh-*.json')):
      d = json.load(open(p))
      perf = d['categories']['performance']['score']
      a11y = d['categories']['accessibility']['score']
      print(f'{p}: perf={perf*100:.0f} a11y={a11y*100:.0f}')
  "
  ```

**Expected:**
- `/` (coder): perf ≥ 95, a11y ≥ 95
- `/traveler`: perf ≥ 95, a11y ≥ 95
- `/curate`: perf ≥ 98, a11y ≥ 95
- `/made`: perf ≥ 95, a11y ≥ 95

If any persona misses, escalate with a concrete fix list before proceeding.

**Verification gate:** All four routes meet thresholds.

### Task F3 — Reduced motion + visual smoke

**Files:** None (manual verification)

- [ ] In Chrome DevTools: open Rendering panel (Cmd+Shift+P → "Rendering"). Set "Emulate CSS media feature prefers-reduced-motion" to `reduce`.
- [ ] Walk all 4 routes; verify per spec §8 motion table:
  - Coder: stagger reveal STATIC (no opacity/y transform), tag-filter swap INSTANT
  - Traveler: carousel drag DISABLED (or arrow-only); year-marker swap INSTANT
  - Curator: nothing animates (it's already SSG)
  - Maker: empty placeholder NO PULSE (motion-safe class drops it); shipped-card cross-fade INSTANT
- [ ] Mobile viewport check: DevTools → device toolbar → iPhone 14 (390x844). Walk all 4 routes; verify no horizontal overflow, carousel drag works on touch, polaroids size correctly, top nav doesn't wrap awkwardly.

**Verification gate:** Manual confirmation, screenshots captured to `~/Documents/Screenshots/` if anything looks off.

### Task F4 — View Transitions cross-browser

**Files:** None (manual verification)

- [ ] Chrome stable: navigate between all 4 tabs — pill morphs smoothly, page content transitions per `transitionMode` (morph for Coder/Traveler, fade for Curator/Maker).
- [ ] Safari 18+: same walk — should work (Safari shipped View Transitions in 18).
- [ ] Firefox (default flags): same walk — should fall back to instant nav (no animation). NO console errors, NO blank-page flashes. This is the explicit graceful-degradation success criterion.

**Verification gate:** No regressions in any browser; Firefox falls back cleanly.

### Task F5 — No-JS test

**Files:** None (manual verification)

- [ ] Chrome DevTools → Settings → Debugger → "Disable JavaScript". Hard refresh each route.
- [ ] Verify per spec §13:
  - `/`: Coder project grid renders as static cards (SSR); LiveFeed shows last-known events from SSR or graceful empty state
  - `/traveler`: polaroids render in a native horizontally-scrollable flex container with `scroll-snap-type: x mandatory` — usable without JS
  - `/curate`: full content (zero-JS by design)
  - `/made`: empty placeholder renders statically (no pulse), build queue renders

> NOTE: For `/traveler` to be usable without JS, the SSR'd `<CarouselContent>` must already have horizontal scroll-snap CSS applied. If shadcn's SSR output doesn't include this, add a `<style>` in `traveler.astro` that wraps the SSR carousel container with `overflow-x: auto; scroll-snap-type: x mandatory; > * { scroll-snap-align: start; flex-shrink: 0; }`.

**Verification gate:** All 4 routes show something useful without JS.

**Commit checkpoint (USER-RUN COMMAND):**
```bash
git add -A
git commit -m "chore(v3): phase F polish + verification fixes"
```

---

## Phase G — Cutover handoff (~0.5 day)

Purpose: Document the EXACT commands user runs to merge v2 → main and update deploy workflow. Orchestrator cannot execute these.

### Task G1 — **USER-RUN COMMAND** — Merge v2 → main

**Files:** None (git ops by user)

- [ ] User runs (from repo root):
  ```bash
  cd ~/Projects/active/ask149.github.io
  git status                              # confirm clean working tree on v2
  git checkout main
  git pull origin main
  git merge --no-ff v2 -m "release(v3): merge multi-persona portfolio from v2"
  # DO NOT git push yet — verify locally first
  npx astro build
  npx astro preview                       # walk all 4 routes in browser one more time
  ```

- [ ] If anything is off, user runs `git reset --merge` (NOT `--hard`) to back out, fixes on `v2`, then retries.

- [ ] Archive Jekyll branch reminder: if not already done in v2 cutover, user runs:
  ```bash
  git checkout main
  git branch archive/jekyll-v1 <jekyll-commit-sha>    # tag the last Jekyll commit
  ```

### Task G2 — **USER-RUN COMMAND** — Update deploy workflow

**Files:** Modify `.github/workflows/deploy-v2.yml` → rename to `.github/workflows/deploy.yml` (or edit branch trigger)

- [ ] User inspects current workflow:
  ```bash
  cat .github/workflows/deploy-v2.yml
  ```
- [ ] User either renames or edits the `on.push.branches` trigger from `[v2]` to `[main]`. Example minimal change:
  ```yaml
  on:
    push:
      branches: [main]
    workflow_dispatch:
  ```
- [ ] User commits:
  ```bash
  git mv .github/workflows/deploy-v2.yml .github/workflows/deploy.yml   # if renaming
  # edit branch trigger as above
  git add .github/workflows/
  git commit -m "chore(deploy): cut over deploy workflow to main"
  git push origin main
  ```

### Task G3 — Post-deploy verification checklist

**Files:** None (user runs after GitHub Pages publishes)

- [ ] Wait ~2 minutes for GitHub Actions deploy to finish. Check Actions tab on GitHub.
- [ ] User runs from terminal (each curl should return 200):
  ```bash
  for url in / /traveler /curate /made /feed /now /uses /writing /projects /agents /sudo /cost; do
    code=$(curl -o /dev/null -s -w "%{http_code}" https://ask149.github.io$url)
    echo "$code  $url"
  done
  ```
  Expected: all 200 (or 308 redirect for trailing-slash variants).

- [ ] Verify OG meta on each persona route:
  ```bash
  for route in "" traveler curate made; do
    echo "=== /$route ==="
    curl -s "https://ask149.github.io/$route" | grep -E '<title>|<meta name="description"' | head -3
  done
  ```

- [ ] Manual: open `https://ask149.github.io/` in 3 browsers (Chrome, Safari, Firefox). Walk through all 4 tabs in each. Confirm no console errors, no broken images, View Transitions degrade cleanly in Firefox.

- [ ] If anything is broken in production but worked locally, user runs `git revert HEAD` on `main` and pushes; orchestrator re-engages to fix.

**Phase G done when:** All 4 persona routes return 200 on `ask149.github.io`, OG meta is correct, no console errors in any major browser.

---

## Self-review log

- ✅ **Spec coverage:** Every locked decision in spec §2 has at least one task:
  - #1 Inheritance — preserved (Tasks B5 keeps LiveFeed; off-nav routes untouched)
  - #2 Persona count — registry has exactly 4 entries (A3)
  - #3 Route shape — `/`, `/traveler`, `/curate`, `/made` created in B5, C6, D3, E3
  - #4 Tab transitions — `<ClientRouter />` in PersonaLayout (A6)
  - #5 Hydration — every interactive island uses `client:visible` (B5, C6, E3)
  - #6 Coder pattern — motion stagger + tag filter (B3, B4)
  - #7 Traveler pattern — shadcn Carousel + WheelGesturesPlugin (A2, C5)
  - #8 Curator pattern — pure Astro deterministic quote rotation (D2)
  - #9 Maker pattern — animate-pulse + AnimatePresence (E2)
  - #10 Modularity keystone — registry (A3)
  - #11 Theme tokens — per-persona CSS modules (A4)
  - #12 Chrome separation — TopNav + FooterStatus shared (A5)
  - #13 Reduced motion — motion-safe class + Motion auto-respect (E2, F3)
  - #14 View Transitions fallback — Astro's built-in graceful degradation (F4)
  - #15 Bundle budget — explicit gate in F1
  - #16 Schema versioning — all new fields `.optional()` or `.default()` (C2, D1, E1)
  - #17 No persona coupling — folder boundaries (each persona has its own `src/components/<id>/`)
  - #18 Cutover — Phase G
  - #19 Branding — per-persona tokens (A4)

- ✅ **Placeholder scan:** No "TBD", "FIXME", "implement details", etc. Documented deviations (`as any` cast in registry; vendoring fallback for wheel-gestures) are explicit, not placeholders.

- ✅ **Type consistency:**
  - `ProjectGrid` props match spec §5.1 (`projects`, `allTags`)
  - `TravelTimeline` props match §5.2 (`places`, `nextStop`)
  - `Polaroid` props match §5.2 (`slug`, `title`, `country`, `airportCode`, `yearMonth`, `image`, `caption`)
  - Collection fields (`yearMonth`, `status`, `priority`, `quote.text`, `finishedDate`, `shippedDate`) match spec §6
  - `PersonaDef` fields match spec §4.1

- ✅ **Sequencing:** Phase A foundation blocks B/C/D/E. B/C/D/E are explicitly marked independent and parallelizable. F gates on all of B+C+D+E. G gates on F.

- ✅ **Cannot-commit reality:** Every git commit step is wrapped as **USER-RUN COMMAND** with exact bash blocks. Orchestrator only does file edits + `astro check`/`astro build`/`tsc` + `python3` ops.

- ✅ **Out-of-scope honored:** No test framework introduced. No Cloudflare Worker changes. Existing `essays` and `projects` collections only read, never modified. No "ask user" steps.

---
