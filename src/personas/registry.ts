// PHASE F CLEANUP TODOs:
//   - Restore aliased `import { ClientRouter } from "astro:transitions"` (drop `ViewTransitions as` alias) when project upgrades to Astro 5
//
// Note on `as any` in heroLoader entries below:
//   `tsc --noEmit` cannot resolve `.astro` module imports (TS2307) — that resolution
//   only happens inside the Astro build via @astrojs/check. The `as any` cast
//   intentionally suppresses the spurious tsc error so plain `tsc --noEmit` stays
//   green for editor tooling. The components do exist and are verified at build time.

import type { ComponentType } from "react";
import type { CollectionKey } from "astro:content";

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
