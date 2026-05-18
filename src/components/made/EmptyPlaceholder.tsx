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
