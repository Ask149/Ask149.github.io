// src/data/social.ts
// Single source of truth for outbound profile links.
// Edit URLs here; surfaces (curate page, hero contact strip, etc.) read from this.
//
// To rotate the Goodreads link to a real profile, replace the value below.
// If you don't have a Goodreads profile yet, set `goodreads` to `null` and the
// link will be omitted from /curate at build time.

export const social = {
  goodreads: "https://www.goodreads.com/user/show/114721123-ashish-k" as string | null,
} as const;
