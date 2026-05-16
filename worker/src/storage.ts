import type { AgentEvent, Env } from './types'

const INDEX_KEY = 'index:all'
const INDEX_MAX = 5000
const EVENT_TTL = 90 * 24 * 60 * 60 // 90 days

export async function saveEvent(env: Env, event: AgentEvent): Promise<void> {
  await env.EVENTS.put(`event:${event.id}`, JSON.stringify(event), { expirationTtl: EVENT_TTL })
  const raw = (await env.EVENTS.get(INDEX_KEY)) ?? '[]'
  let idx: string[]
  try { idx = JSON.parse(raw) } catch { idx = [] }
  idx.unshift(event.id)
  if (idx.length > INDEX_MAX) idx.length = INDEX_MAX
  await env.EVENTS.put(INDEX_KEY, JSON.stringify(idx))
}

export async function listEvents(
  env: Env,
  opts: { limit: number; since?: string; agent?: string }
): Promise<AgentEvent[]> {
  const raw = (await env.EVENTS.get(INDEX_KEY)) ?? '[]'
  let idx: string[]
  try { idx = JSON.parse(raw) } catch { idx = [] }
  if (opts.since) {
    const i = idx.indexOf(opts.since)
    if (i >= 0) idx = idx.slice(0, i)
  }
  const ids = idx.slice(0, Math.min(opts.limit, 200))
  const rows = await Promise.all(ids.map(async (id) => {
    const v = await env.EVENTS.get(`event:${id}`)
    if (!v) return null
    try { return JSON.parse(v) as AgentEvent } catch { return null }
  }))
  let out = rows.filter((e): e is AgentEvent => e !== null && e.visibility === 'public')
  if (opts.agent) out = out.filter((e) => e.agent === opts.agent)
  return out
}

export async function getMute(env: Env): Promise<boolean> {
  return (await env.EVENTS.get('config:mute')) === 'true'
}

export async function setMute(env: Env, muted: boolean): Promise<void> {
  await env.EVENTS.put('config:mute', muted ? 'true' : 'false')
}

export async function purgeEvent(env: Env, id: string): Promise<void> {
  await env.EVENTS.delete(`event:${id}`)
}
