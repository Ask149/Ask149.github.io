// src/components/traveler/FloatingPhotos.tsx
// Picks 5–8 photos from the active trip's photoFolder + spillover from adjacent
// trips, renders into 7 hard-coded CSS slots (.pf-1 … .pf-7). Each slot has its
// own absolute position, size, rotation, and 12s animation-delay defined in
// src/styles/personas/traveler.css. For Phase C the photo manifest is empty —
// FloatingPhotos falls back to gradient placeholders shaped like polaroids.
//
// Cross-island event bus:
//   document.dispatchEvent(new CustomEvent("voyages:select", { detail: { slug } }))
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export interface Photo {
  src: string;
  caption: string;
}
export type PhotoManifest = Record<string, Photo[]>;

interface Props {
  manifest: PhotoManifest;
  initialSlug: string;
  /**
   * Optional per-slug caption fallback (place.photoCaptions) for when the
   * manifest is empty but the place .md provides hand-written captions.
   */
  captionsBySlug?: Record<string, string[]>;
}

// Earthy polaroid gradient palette mirroring the mockup (--c1/--c2 pairs).
const PLACEHOLDER_GRADIENTS: Array<[string, string]> = [
  ["#c8916b", "#6b4226"],
  ["#6e8aa4", "#2a3540"],
  ["#d4b48a", "#8b7252"],
  ["#4a5560", "#2a3540"],
  ["#8b6240", "#4a3422"],
  ["#c64a3c", "#6b2820"],
  ["#7a9968", "#3e4d33"],
];

const FALLBACK_CAPTIONS = [
  "first ferry · sea · jun '24",
  "rainier · jul '24",
  "pict campus · '19",
  "desert flowers · phx",
  "backyard summer",
  "market run",
  "last view · may '26",
];

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickSeven(
  manifest: PhotoManifest,
  activeSlug: string,
  captionsBySlug: Record<string, string[]> = {},
): Photo[] {
  const primary = manifest[activeSlug] ?? [];
  if (primary.length >= 7) return shuffle(primary).slice(0, 7);

  const others = Object.entries(manifest)
    .filter(([k]) => k !== activeSlug)
    .flatMap(([, v]) => v);
  const all = [...primary, ...shuffle(others)];

  // Fully empty manifest → use hand-written captions if available, else fallback.
  if (all.length === 0) {
    const handCaps = captionsBySlug[activeSlug] ?? [];
    return Array.from({ length: 7 }, (_, i) => ({
      src: "",
      caption: handCaps[i] ?? FALLBACK_CAPTIONS[i],
    }));
  }

  // Partial manifest → cycle to fill 7 slots.
  const out: Photo[] = [];
  for (let i = 0; i < 7; i++) out.push(all[i % all.length]);
  return out;
}

export default function FloatingPhotos({ manifest, initialSlug, captionsBySlug = {} }: Props) {
  const [activeSlug, setActiveSlug] = useState(initialSlug);
  // v4 polish r3 W11: passes data-reduce-motion to each .photo-float so the
  // CSS @media (prefers-reduced-motion: reduce) rules in traveler.css can
  // kill the floating drift animations.
  const reduce = useReducedMotion();
  // SSR/CSR hydration safety: initial state is empty so server-rendered HTML
  // and first client render match. The randomized pickSeven() call (which uses
  // Math.random() in shuffle) runs only after mount inside the effect below.
  // Without this, server picks one ordering and client picks another → React
  // throws a hydration mismatch as soon as the manifest has real content.
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    setPhotos(pickSeven(manifest, activeSlug, captionsBySlug));
  }, [activeSlug, manifest, captionsBySlug]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ slug: string }>).detail;
      if (detail?.slug) {
        setActiveSlug(detail.slug);
      }
    };
    document.addEventListener("voyages:select", handler);
    return () => document.removeEventListener("voyages:select", handler);
  }, []);

  return (
    <>
      {photos.map((p, i) => {
        const [c1, c2] = PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length];
        return (
          <div
            key={`${activeSlug}-${i}`}
            className={`photo-float pf-${i + 1}`}
            data-reduce-motion={reduce ? "true" : "false"}
          >
            {p.src ? (
              <img
                className="img"
                src={p.src}
                loading="lazy"
                decoding="async"
                alt={p.caption}
              />
            ) : (
              <div
                className="img"
                style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                aria-hidden="true"
              />
            )}
            <div className="cap">{p.caption}</div>
          </div>
        );
      })}
    </>
  );
}
