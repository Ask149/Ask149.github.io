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
  }),
})

export const collections = { essays, projects }
