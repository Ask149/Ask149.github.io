import { defineCollection, z } from 'astro:content'

const essays = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
  }),
})

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['active', 'shipped', 'experimental', 'abandoned']),
    tags: z.array(z.string()).optional(),
    order: z.number().optional(),
    url: z.string().url().optional(),
    repo: z.string().optional(),
    // v4 polish r3 W8: optional ship date surfaces as "~ shipped YYYY-MM-DD"
    // on the featured-first card in ProjectGridV4. ISO date string.
    shipped: z.string().optional(),
  }),
})

const places = defineCollection({
  type: "content",
  schema: ({ image }) => z.object({
    title: z.string(),
    country: z.string(),
    countryCode: z.string().length(2),
    airportCode: z.string().length(3).optional(),
    yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    cover: image().optional(),
    coverAlt: z.string().default(""),
    durationDays: z.number().int().positive().optional(),
    reason: z.enum(["leisure", "work", "transit", "family", "wedding"]).default("leisure"),
    favorite: z.boolean().default(false),
    draft: z.boolean().default(false),

    // ── v4 additions ────────────────────────────────────────────
    paragraph: z.string().optional(),
    // "ak" / "ashish" = hand-written. "ai" / "gemini-2.0-flash" = AI-generated.
    // "ai-regenerate" = sentinel to force regeneration on next `npm run paragraphs`.
    paragraphAuthor: z.enum(["ak", "ashish", "ai", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-2.5-flash", "gemini-flash-latest", "gemini-pro-latest", "ai-regenerate"]).optional(),
    photoFolder: z.string().optional(),
    mapCoords: z.object({ leftPct: z.number(), topPct: z.number() }).optional(),
    photoCaptions: z.array(z.string()).optional(),
    geo: z.tuple([z.number(), z.number()]).optional(),
    timelineLabel: z.string().optional(),
  }),
})

const books = defineCollection({
  type: "content",
  schema: ({ image }) => z.object({
    title: z.string(),
    author: z.string(),
    status: z.enum(["reading", "finished", "queued", "abandoned"]),
    startedDate: z.coerce.date().optional(),
    finishedDate: z.coerce.date().optional(),
    cover: image().optional(),
    coverAlt: z.string().default(""),
    rating: z.number().int().min(1).max(5).optional(),
    quote: z.object({
      text: z.string().max(280),
      page: z.number().int().positive().optional(),
    }).optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const builds = defineCollection({
  type: "content",
  schema: ({ image }) => z.object({
    title: z.string(),
    status: z.enum(["queued", "building", "shipped", "abandoned", "on-bench"]),
    priority: z.number().int().min(0).max(10).default(5),
    addedDate: z.coerce.date(),
    shippedDate: z.coerce.date().optional(),
    blurb: z.string().max(140),
    url: z.string().url().optional(),
    repo: z.string().regex(/^[\w-]+\/[\w.-]+$/).optional(),
    cover: image().optional(),
    coverAlt: z.string().default(""),
    tags: z.array(z.string()).default([]),
    why: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { essays, projects, places, books, builds }
