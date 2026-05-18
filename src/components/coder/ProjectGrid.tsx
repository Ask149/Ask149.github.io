import { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { ProjectCard, type ProjectCardProps } from "./ProjectCard";
import { TechChip } from "./TechChip";

type Project = Omit<ProjectCardProps, "activeFilters">;

export interface ProjectGridProps {
  projects: Project[];
  allTags: string[];
}

export function ProjectGrid({ projects, allTags }: ProjectGridProps) {
  const [active, setActive] = useState<Set<string>>(new Set());

  const toggle = useCallback((tag: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    if (active.size === 0) return projects;
    return projects.filter((p) => p.tags.some((t) => active.has(t)));
  }, [projects, active]);

  return (
    <section aria-label="Projects">
      <ul className="flex flex-wrap gap-2 mb-6" aria-label="Filter by tag">
        {allTags.map((t) => (
          <li key={t}>
            <TechChip tag={t} active={active.has(t)} onToggle={toggle} />
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? (
        <p className="text-[color:var(--fg-muted)]">
          no projects match.{" "}
          <button onClick={() => setActive(new Set())} className="underline">
            reset
          </button>
        </p>
      ) : (
        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((p) => (
            <li key={p.slug}>
              <ProjectCard {...p} activeFilters={active} />
            </li>
          ))}
        </motion.ul>
      )}
    </section>
  );
}
