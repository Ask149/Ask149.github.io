// src/components/traveler/DiaryCard.tsx
// Listens for voyages:select CustomEvent on document, swaps content for the
// selected trip. Renders label + Anton title + dates/stats line + paragraph +
// A.K./AI toggle (cosmetic, reflects paragraphAuthor) + location meta.
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export interface PlaceSnapshot {
  slug: string;
  title: string;
  yearMonth: string;
  durationDays?: number;
  paragraph?: string;
  paragraphAuthor?: "ak" | "ashish" | "ai" | "gemini-1.5-flash" | "gemini-1.5-pro" | "gemini-2.0-flash" | "gemini-2.0-flash-exp" | "gemini-2.5-flash" | "gemini-flash-latest" | "gemini-pro-latest" | "ai-regenerate";
  photoCount: number;
  airportCode?: string;
  reason: string;
  sectionLabel: string; // e.g. "§2.4"
}

interface Props {
  initial: PlaceSnapshot;
  byslug: Record<string, PlaceSnapshot>;
}

function formatDates(yearMonth: string, durationDays?: number): string {
  const [y, m] = yearMonth.split("-");
  const startDate = new Date(Number(y), Number(m) - 1, 1);
  const startStr = startDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  if (!durationDays) return `${startStr} · `;
  const end = new Date(startDate.getTime() + durationDays * 86400000);
  const endStr = end.toLocaleString("en-US", { month: "long", year: "numeric" });
  return `${startStr} → ${endStr} · ${durationDays} days · `;
}

export default function DiaryCard({ initial, byslug }: Props) {
  const [place, setPlace] = useState<PlaceSnapshot>(initial);
  const [fading, setFading] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  // v4 polish r3 W11: skip the cross-fade for reduced-motion users (instant swap).
  const reduce = useReducedMotion();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ slug: string }>).detail;
      if (!detail?.slug || detail.slug === place.slug) return;
      const next = byslug[detail.slug];
      if (!next) return;
      if (reduce) {
        setPlace(next);
        return;
      }
      setFading(true);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setPlace(next);
        setFading(false);
        timeoutRef.current = null;
      }, 200);
    };
    document.addEventListener("voyages:select", handler);
    return () => {
      document.removeEventListener("voyages:select", handler);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [byslug, place.slug, reduce]);

  const rawAuthor = place.paragraphAuthor ?? "ak";
  // Normalize the cosmetic A.K./AI toggle: anything Gemini-/AI-shaped counts as "ai".
  const author: "ak" | "ai" =
    rawAuthor === "ai" || rawAuthor === "ai-regenerate" || rawAuthor.startsWith("gemini-")
      ? "ai"
      : "ak";
  const dates = formatDates(place.yearMonth, place.durationDays);
  const reasonLabel = place.reason === "family" ? "home" : place.reason;

  return (
    <div
      className="diary-card"
      style={{ opacity: fading ? 0 : 1, transition: reduce ? "none" : "opacity 200ms ease" }}
      data-slug={place.slug}
      data-reduce-motion={reduce ? "true" : "false"}
    >
      <div className="label">— now showing · {place.sectionLabel}</div>
      <h3>{place.title.toUpperCase()}.</h3>
      <div className="dates">
        {dates}
        {place.photoCount === 0
          ? "photos landing summer '26"
          : `${place.photoCount} photograph${place.photoCount === 1 ? "" : "s"}`}
      </div>
      <p>
        {place.paragraph ??
          "Paragraph forthcoming — generate via `npm run paragraphs`."}
      </p>
      <div className="row">
        <div className="toggle" aria-label="paragraph author">
          <span className={author === "ak" ? "on" : ""}>A.K.</span>
          <span className={author === "ai" ? "on" : ""}>AI</span>
        </div>
        <div className="stats">
          {place.airportCode ?? "—"} · {reasonLabel}
        </div>
      </div>
    </div>
  );
}
