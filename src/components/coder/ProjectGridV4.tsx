// src/components/coder/ProjectGridV4.tsx
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

export interface Project {
  slug: string;
  title: string;
  description: string;
  status: "active" | "shipped" | "experimental" | "abandoned" | "ongoing";
  tags: string[];
  order: number;
  url?: string;
  featured?: boolean;
  // v4 polish r3 W8: ISO date (e.g. "2026-05-17") — surfaced on featured-first
  // card as "~ shipped 2026-05-17". No date → no scribble.
  shipped?: string;
}

interface Props {
  projects: Project[];
}

const STATUS_LABEL: Record<Project["status"], string> = {
  active: "ACTIVE",
  shipped: "SHIPPED",
  experimental: "EXPERIMENTAL",
  abandoned: "ABANDONED",
  ongoing: "ONGOING",
};

export default function ProjectGridV4({ projects }: Props) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  // v4 polish r3 W11: kill all stagger/fade motion for reduced-motion users.
  const reduce = useReducedMotion();

  const filtered = activeTag
    ? projects.filter((p) => p.tags.includes(activeTag))
    : projects;

  return (
    <motion.div
      className="proj-grid"
      initial={reduce ? false : "hidden"}
      animate={reduce ? false : "show"}
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
      }}
    >
      {filtered.map((p, i) => (
        <motion.div
          key={p.slug}
          className="proj"
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.35, ease: "easeOut" } },
          }}
        >
          <div className="proj-num">
            {String(p.order).padStart(3, "0")} · {STATUS_LABEL[p.status] ?? p.status.toUpperCase()}
          </div>
          <h3>
            {p.url ? (
              <a href={p.url} style={{ color: "inherit", textDecoration: "none" }}>
                {p.title}
              </a>
            ) : (
              p.title
            )}
          </h3>
          <div className="desc">{p.description}</div>
          <div className="chips">
            {p.tags.map((t) => (
              <button
                key={t}
                type="button"
                className={`chip${activeTag === t ? " on" : ""}`}
                data-active={activeTag === t}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
                style={{ border: 0, cursor: "pointer", font: "inherit" }}
              >
                {t}
              </button>
            ))}
          </div>
          {p.featured && i === 0 && p.shipped && (
            <span className="scribble">~ shipped {p.shipped}</span>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
