import { motion } from "motion/react";

export interface ProjectCardProps {
  slug: string;
  title: string;
  blurb: string;
  tags: readonly string[];
  url?: string;
  cover?: { src: string; alt: string };
  featured?: boolean;
  activeFilters: ReadonlySet<string>;
}

export function ProjectCard(props: ProjectCardProps) {
  const { slug, title, blurb, tags, url, cover, featured, activeFilters } = props;
  const dimmed = activeFilters.size > 0 && !tags.some((t) => activeFilters.has(t));
  const href = url ?? `/projects/${slug}`;
  return (
    <motion.a
      href={href}
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      viewport={{ once: true, margin: "-10%" }}
      animate={dimmed ? { opacity: 0.3 } : { opacity: 1 }}
      className={[
        "group flex flex-col gap-2 p-4 border rounded-md",
        "border-[color:var(--rule)] bg-[color:var(--surface)]",
        "transition-colors hover:border-[color:var(--accent)]",
        featured ? "ring-1 ring-[color:var(--accent)]" : "",
      ].join(" ")}
    >
      {cover ? (
        <img src={cover.src} alt={cover.alt} className="w-full h-32 object-cover rounded-sm" />
      ) : (
        <pre className="font-mono text-xs text-[color:var(--fg-faint)] leading-tight">
{`┌──────────────┐
│  ${slug.slice(0, 12).padEnd(12)}  │
└──────────────┘`}
        </pre>
      )}
      <h3 className="font-display text-lg text-[color:var(--fg)]">{title}</h3>
      <p className="text-sm text-[color:var(--fg-muted)]">{blurb}</p>
      <ul className="flex flex-wrap gap-1 mt-auto">
        {tags.map((t) => (
          <li key={t} className="text-xs font-mono text-[color:var(--fg-faint)]">
            #{t}
          </li>
        ))}
      </ul>
    </motion.a>
  );
}
