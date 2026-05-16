import type { Env } from './types'

export async function authBearer(req: Request, env: Env): Promise<string | null> {
  const header = req.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice(7).trim()
  if (!token) return null
  let keys: Record<string, string>
  try {
    keys = JSON.parse(env.AGENT_KEYS_JSON)
  } catch {
    return null
  }
  for (const [agent, expected] of Object.entries(keys)) {
    if (constantTimeEqual(token, expected)) return agent
  }
  return null
}

export async function authAdmin(req: Request, env: Env): Promise<boolean> {
  const header = req.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return false
  return constantTimeEqual(header.slice(7).trim(), env.ADMIN_TOKEN)
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
