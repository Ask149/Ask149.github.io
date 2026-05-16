import type { Env } from './types'
import { authBearer, authAdmin } from './auth'
import { healthCheck, handleEvent, getEvents, mute, purge } from './handlers'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })

    try {
      if (path === '/health' && method === 'GET') return healthCheck(env)

      if (path === '/events' && method === 'POST') {
        const agent = await authBearer(req, env)
        if (!agent) return json({ error: 'unauthorized' }, 401)
        return handleEvent(req, env, agent)
      }

      if (path === '/events.json' && method === 'GET') {
        return getEvents(url.searchParams, env)
      }

      if (path === '/admin/mute' && method === 'POST') {
        if (!(await authAdmin(req, env))) return json({ error: 'unauthorized' }, 401)
        return mute(req, env)
      }

      if (path === '/admin/purge' && method === 'POST') {
        if (!(await authAdmin(req, env))) return json({ error: 'unauthorized' }, 401)
        return purge(req, env)
      }

      return json({ error: 'not_found', path }, 404)
    } catch (e) {
      return json({ error: 'internal', message: String(e) }, 500)
    }
  },
}
