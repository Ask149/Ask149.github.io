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
