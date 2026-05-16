import type { IncomingEventBody } from './types'

const DENYLIST: Array<{ name: string; re: RegExp }> = [
  { name: 'openai_key', re: /sk-[A-Za-z0-9]{20,}/ },
  { name: 'anthropic_key', re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: 'github_pat_classic', re: /gh[ps]_[A-Za-z0-9]{36,}/ },
  { name: 'github_pat_fine', re: /github_pat_[A-Za-z0-9_]{60,}/ },
  { name: 'jules_key', re: /AQ\.[A-Za-z0-9_-]{30,}/ },
  { name: 'aws_access_key', re: /AKIA[A-Z0-9]{16}/ },
  { name: 'jwt', re: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
  { name: 'user_path', re: /\/(Users|home)\/[a-z0-9_-]+\// },
  { name: 'password_kv', re: /password\s*[=:]\s*\S{4,}/i },
  { name: 'token_kv', re: /token\s*[=:]\s*[A-Za-z0-9_.-]{16,}/i },
  { name: 'api_key_kv', re: /api[_-]?key\s*[=:]\s*\S{12,}/i },
  { name: 'bearer_inline', re: /Bearer\s+[A-Za-z0-9_.-]{20,}/ },
]

export type ValidateResult =
  | { ok: true; data: IncomingEventBody }
  | { ok: false; error: string }

export function validateEvent(body: unknown): ValidateResult {
  if (!body || typeof body !== 'object') return { ok: false, error: 'body_required' }
  const b = body as Record<string, unknown>

  if (typeof b.action !== 'string' || b.action.length === 0 || b.action.length > 64) {
    return { ok: false, error: 'action: required string 1-64' }
  }
  if (b.summary !== undefined && (typeof b.summary !== 'string' || b.summary.length > 200)) {
    return { ok: false, error: 'summary: string ≤200 chars' }
  }
  if (b.url !== undefined && (typeof b.url !== 'string' || b.url.length > 500)) {
    return { ok: false, error: 'url: string ≤500 chars' }
  }
  if (b.repo !== undefined && (typeof b.repo !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(b.repo))) {
    return { ok: false, error: 'repo: expected owner/repo' }
  }
  if (b.duration_seconds !== undefined && (typeof b.duration_seconds !== 'number' || b.duration_seconds < 0 || b.duration_seconds > 86400)) {
    return { ok: false, error: 'duration_seconds: 0-86400' }
  }
  if (b.visibility !== undefined && b.visibility !== 'public' && b.visibility !== 'hidden') {
    return { ok: false, error: 'visibility: public|hidden' }
  }

  const surfaces: string[] = []
  for (const f of [b.action, b.repo, b.summary, b.url] as unknown[]) {
    if (typeof f === 'string') surfaces.push(f)
  }
  if (b.metadata && typeof b.metadata === 'object') {
    try { surfaces.push(JSON.stringify(b.metadata)) } catch {}
  }
  for (const s of surfaces) {
    for (const p of DENYLIST) {
      if (p.re.test(s)) return { ok: false, error: `denylist:${p.name}` }
    }
  }

  return {
    ok: true,
    data: {
      action: b.action,
      repo: typeof b.repo === 'string' ? b.repo : undefined,
      summary: typeof b.summary === 'string' ? b.summary : undefined,
      url: typeof b.url === 'string' ? b.url : undefined,
      duration_seconds: typeof b.duration_seconds === 'number' ? b.duration_seconds : undefined,
      visibility: b.visibility === 'hidden' ? 'hidden' : 'public',
      metadata: typeof b.metadata === 'object' && b.metadata !== null
        ? (b.metadata as Record<string, unknown>) : undefined,
    },
  }
}
