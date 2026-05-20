import { useEffect, useState, useRef } from 'react'

interface AgentEvent {
  id: string
  agent: string
  action: string
  repo?: string
  summary?: string
  url?: string
  duration_seconds?: number
  ts: string
}

interface Props {
  endpoint: string
  pollMs?: number
  initialLimit?: number
  mode?: 'compact' | 'full'
}

const AGENT_ICONS: Record<string, string> = {
  'opencode-orchestrator': '◆',
  'opencode-jules': '◇',
  'claude-code': '◉',
  copilot: '◎',
  manual: '·',
  'jules-direct': '◇',
  dev: '○',
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export default function LiveFeed({ endpoint, pollMs = 60000, initialLimit = 3, mode = 'compact' }: Props) {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [expanded, setExpanded] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const lastIdRef = useRef<string | null>(null)
  const mountedRef = useRef(true)

  async function poll() {
    setThinking(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (lastIdRef.current) params.set('since', lastIdRef.current)
      const r = await fetch(`${endpoint}?${params}`, { cache: 'no-store' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = (await r.json()) as { events: AgentEvent[]; muted?: boolean; count?: number }
      if (!mountedRef.current) return
      setMuted(Boolean(data.muted))
      if (data.events.length > 0) {
        setEvents((prev) => {
          const merged = [...data.events, ...prev]
          const seen = new Set<string>()
          return merged.filter((e) => { if (seen.has(e.id)) return false; seen.add(e.id); return true }).slice(0, 50)
        })
        lastIdRef.current = data.events[0].id
      }
      setError(null)
    } catch (e) {
      setError(String(e))
    } finally {
      if (mountedRef.current) setTimeout(() => setThinking(false), 400)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    poll()
    const iv = setInterval(poll, pollMs)
    return () => { mountedRef.current = false; clearInterval(iv) }
  }, [endpoint, pollMs])

  const visible = mode === 'full' ? events : (expanded ? events.slice(0, 10) : events.slice(0, initialLimit))

  return (
    <section className="livefeed">
      <header className="livefeed__head">
        <span className="livefeed__dot" data-pulse={thinking ? 'true' : 'false'}>●</span>
        {/* v4 polish r3 W7: LIVE label removed — AgentFeedStrip banner owns the
            single "● LIVE" marker. We keep the dot here as a pulsing activity
            indicator only. The "agents working" suffix is preserved for the
            sidebar/full mode but rendered without the leading LIVE word. */}
        {events.length > 0 && (
          <span className="livefeed__label mono">agents working</span>
        )}
        {muted && <span className="livefeed__muted mono">muted</span>}
        {mode !== 'full' && events.length > initialLimit && (
          <button className="livefeed__expand mono" onClick={() => setExpanded((v) => !v)}>
            {expanded ? '↑ collapse' : `↓ expand (${Math.min(events.length, 10)})`}
          </button>
        )}
      </header>
      <div className="livefeed__rows">
        {events.length === 0 && !error && (
          <div className="livefeed__empty mono">
            feed empty — see <a href="/feed">/feed</a> for history.
          </div>
        )}
        {error && events.length === 0 && (
          <div className="livefeed__empty mono">
            feed unavailable — try <a href="/feed">/feed</a>.
          </div>
        )}
        {visible.map((e, i) => (
          <div className="livefeed__row" key={e.id} style={{ animationDelay: `${i * 50}ms` }}>
            <span className="livefeed__time mono">{relTime(e.ts)}</span>
            <span className="livefeed__agent mono">
              <span className="livefeed__icon">{AGENT_ICONS[e.agent] ?? '·'}</span>
              @{e.agent}
            </span>
            <span className="livefeed__action">{e.action}</span>
            {e.summary && <span className="livefeed__summary muted">{e.summary}</span>}
            {e.url && (
              <a className="livefeed__link mono" href={e.url} target="_blank" rel="noopener noreferrer">↗</a>
            )}
          </div>
        ))}
      </div>
      <style>{`
        .livefeed {
          border: 1px solid var(--rule);
          background: var(--surface);
          padding: 0;
          margin: 1.5rem 0 2.5rem;
          font-family: var(--font-mono);
        }
        .livefeed__head {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--rule);
          font-size: var(--small);
        }
        .livefeed__dot {
          color: var(--success);
          font-size: 0.9em;
        }
        .livefeed__dot[data-pulse='true'] {
          animation: pulse 1.2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .livefeed__label { letter-spacing: 0.06em; text-transform: uppercase; font-weight: 500; }
        .livefeed__muted { color: var(--accent); margin-left: auto; font-size: var(--tiny); }
        .livefeed__expand {
          margin-left: auto; background: none; border: none;
          color: var(--fg-muted); cursor: pointer; font-family: inherit;
          font-size: var(--tiny);
        }
        .livefeed__expand:hover { color: var(--accent); }
        .livefeed__rows { display: flex; flex-direction: column; }
        .livefeed__row {
          display: grid;
          grid-template-columns: 3rem 12rem 1fr auto;
          gap: 0.75rem;
          align-items: baseline;
          padding: 0.6rem 1rem;
          border-top: 1px solid var(--rule);
          font-size: var(--small);
          animation: ink-bleed var(--t-normal) var(--ease) backwards;
        }
        .livefeed__row:first-child { border-top: none; }
        @keyframes ink-bleed {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .livefeed__time { color: var(--fg-faint); }
        .livefeed__agent { color: var(--accent); }
        .livefeed__icon { margin-right: 0.3em; }
        .livefeed__action { color: var(--fg); }
        .livefeed__summary { font-family: var(--font-serif); font-size: var(--body); }
        .livefeed__link { color: var(--accent); }
        .livefeed__empty { padding: 1rem; color: var(--fg-muted); font-size: var(--small); }
        @media (max-width: 600px) {
          .livefeed__row { grid-template-columns: 1fr; gap: 0.25rem; }
        }
      `}</style>
    </section>
  )
}
