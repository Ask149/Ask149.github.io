// src/components/traveler/TimelineCarousel.tsx
// Horizontal scroll-snap track of trips, oldest→newest L→R. Click/keyboard
// dispatches voyages:select on document; supports URL-hash deep links
// (#trip=<slug>). Also reacts to incoming voyages:select to keep the active
// indicator in sync when other islands (or hash) drive selection.
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export interface Trip {
  slug: string;
  name: string;
  year: string;
  date: string;
  label: string;
  subLabel: string;
}

interface Props {
  trips: Trip[];
  initialActiveSlug: string;
}

export default function TimelineCarousel({ trips, initialActiveSlug }: Props) {
  const [activeSlug, setActiveSlug] = useState(initialActiveSlug);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // v4 polish r3 W11: use 'auto' scroll for reduced-motion users.
  const reduce = useReducedMotion();

  // Sync local active state when other islands dispatch voyages:select.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ slug: string }>).detail;
      if (detail?.slug) setActiveSlug(detail.slug);
    };
    document.addEventListener("voyages:select", handler);
    return () => document.removeEventListener("voyages:select", handler);
  }, []);

  // Hash-based deep link on mount: #trip=<slug>.
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const match = hash.match(/^#trip=(.+)$/);
    if (match && match[1]) {
      const slug = decodeURIComponent(match[1]);
      if (trips.find((t) => t.slug === slug)) {
        document.dispatchEvent(
          new CustomEvent("voyages:select", { detail: { slug } }),
        );
      }
    }
  }, [trips]);

  // Scroll active trip into view when it changes (smooth, respects reduced-motion).
  useEffect(() => {
    const btn = btnRefs.current[activeSlug];
    if (!btn) return;
    btn.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeSlug, reduce]);

  function selectTrip(slug: string) {
    document.dispatchEvent(
      new CustomEvent("voyages:select", { detail: { slug } }),
    );
  }

  const years = Array.from(new Set(trips.map((t) => t.year)));

  function jumpToYear(year: string) {
    const first = trips.find((t) => t.year === year);
    if (first) selectTrip(first.slug);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const idx = trips.findIndex((t) => t.slug === activeSlug);
    if (idx < 0) return;
    const nextIdx =
      e.key === "ArrowRight"
        ? Math.min(trips.length - 1, idx + 1)
        : Math.max(0, idx - 1);
    if (nextIdx !== idx) {
      e.preventDefault();
      selectTrip(trips[nextIdx].slug);
    }
  }

  return (
    <div className="timeline">
      <div className="timeline-head-row">
        <div className="timeline-head">→ scroll or drag through the years</div>
        {years.length > 1 && (
          <label className="timeline-jump">
            <span>jump</span>
            <select
              value={trips.find((t) => t.slug === activeSlug)?.year ?? years[0]}
              onChange={(e) => jumpToYear(e.currentTarget.value)}
              aria-label="Jump to year"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div
        className="timeline-track"
        ref={trackRef}
        role="tablist"
        aria-label="Trip timeline"
        onKeyDown={onKeyDown}
      >
        {trips.map((t) => {
          const isActive = activeSlug === t.slug;
          return (
            <button
              type="button"
              key={t.slug}
              ref={(el) => {
                btnRefs.current[t.slug] = el;
              }}
              className={`trip${isActive ? " active" : ""}`}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectTrip(t.slug)}
              aria-label={t.label}
            >
              <div className="name">{t.name}</div>
              <div className="yr">{t.subLabel}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
