export interface Env {
  EVENTS: KVNamespace
  AGENT_KEYS_JSON: string // JSON: { "<agent>": "<token>" }
  ADMIN_TOKEN: string
  ENVIRONMENT: 'dev' | 'production'
}

export interface IncomingEventBody {
  action: string
  repo?: string
  summary?: string
  url?: string
  duration_seconds?: number
  visibility?: 'public' | 'hidden'
  metadata?: Record<string, unknown>
}

export interface AgentEvent extends IncomingEventBody {
  id: string
  agent: string
  ts: string
  visibility: 'public' | 'hidden'
}
