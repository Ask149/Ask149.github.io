// One curated line for the "live" agent-feed strip + /feed page.
//
//   - Set to `null` to hide the strip entirely.
//   - Bump `ts` when you update; entry vanishes after `expires_at` (server-
//     rendered at build, plus a client-side timer so it disappears mid-session
//     when the deadline passes — no rebuild required for it to vanish).
//   - No worker, no polling. The whole feed is this file.

export interface FeedSummary {
  text: string
  href?: string
  ts: string         // ISO; renders as relative "Nh ago"
  expires_at: string // ISO; strip vanishes once Date.now() > this
}

export const FEED_SUMMARY: FeedSummary | null = {
  text: 'Cut over portfolio from Jekyll → Astro v4',
  href: '/made',
  ts: '2026-05-26T22:42:00-07:00',
  expires_at: '2026-05-30T07:00:00Z', // ~Fri 12:00am PT
}
