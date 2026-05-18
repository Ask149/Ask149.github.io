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
