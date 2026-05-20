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
