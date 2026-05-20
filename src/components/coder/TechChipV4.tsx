// src/components/coder/TechChipV4.tsx
// Standalone chip primitive — reusable across persona pages.
// ProjectGridV4 inlines its own chip rendering for filter state, but exposing
// this keeps the surface clean for any consumer that wants a single chip.
import { memo, useState } from "react";

export interface Props {
  label: string;
  active?: boolean;
  onToggle?: (label: string, next: boolean) => void;
}

function TechChipV4({ label, active = false, onToggle }: Props) {
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
    >
      {label}
    </button>
  );
}

export default memo(TechChipV4);
