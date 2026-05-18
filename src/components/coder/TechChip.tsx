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
