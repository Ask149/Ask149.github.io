import type { AgentEvent, Env } from './types'
import { validateEvent } from './validate'
import { saveEvent, listEvents, getMute, setMute, purgeEvent } from './storage'
import { ulid } from './ulid'

const CORS = { 'Access-Control-Allow-Origin': '*' }

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  })
}

export async function healthCheck(env: Env): Promise<Response> {
  return json({ ok: true, ts: new Date().toISOString(), env: env.ENVIRONMENT })
}

export async function handleEvent(req: Request, env: Env, agent: string): Promise<Response> {
  let body: unknown
  try { body = await req.json() } catch { return json({ error: 'invalid_json' }, 400) }
  const r = validateEvent(body)
  if (!r.ok) return json({ error: r.error }, 400)
  const event: AgentEvent = {
    id: ulid(),
    agent,
    ts: new Date().toISOString(),
    action: r.data.action,
    repo: r.data.repo,
    summary: r.data.summary,
    url: r.data.url,
    duration_seconds: r.data.duration_seconds,
    visibility: r.data.visibility ?? 'public',
    metadata: r.data.metadata,
  }
  await saveEvent(env, event)
  return json({ ok: true, id: event.id, ts: event.ts }, 201)
}

export async function getEvents(qs: URLSearchParams, env: Env): Promise<Response> {
  if (await getMute(env)) return json({ events: [], muted: true })
  const limit = Math.min(parseInt(qs.get('limit') ?? '50', 10) || 50, 200)
  const since = qs.get('since') ?? undefined
  const agent = qs.get('agent') ?? undefined
  const events = await listEvents(env, { limit, since, agent })
  return json({ events, count: events.length })
}

export async function mute(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { muted?: boolean }
  await setMute(env, Boolean(body.muted))
  return json({ ok: true, muted: Boolean(body.muted) })
}

export async function purge(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { id?: string }
  if (!body.id) return json({ error: 'id_required' }, 400)
  await purgeEvent(env, body.id)
  return json({ ok: true, purged: body.id })
}
