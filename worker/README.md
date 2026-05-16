# ask149-feed — Cloudflare Worker for the live agent activity feed

The webhook + read-side that powers the "🟢 LIVE" widget on https://ask149.github.io.

## What it does

- **`POST /events`** — coding agents (OpenCode, Jules, Claude Code, Copilot, manual CLI) post what they're working on
- **`GET /events.json`** — the Astro site polls this every 60s to render the live feed
- **`GET /health`** — uptime ping
- **`POST /admin/mute`** — emergency mute (display only; ingestion continues)
- **`POST /admin/purge`** — drop one event by ID (if a secret leaks past the denylist)

## Setup (one-time)

```bash
cd worker
npm install
npm install -g wrangler  # or use npx

# 1. Log in
npx wrangler login

# 2. Create KV namespace
npx wrangler kv:namespace create EVENTS
npx wrangler kv:namespace create EVENTS --preview
# → paste both IDs into wrangler.toml [[kv_namespaces]] block

# 3. Generate tokens (one-liner per agent)
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# Repeat 7 times. Build the JSON:
#   {"opencode-orchestrator":"...","opencode-jules":"...","claude-code":"...","copilot":"...","manual":"...","jules-direct":"...","dev":"..."}

# 4. Set secrets
npx wrangler secret put AGENT_KEYS_JSON       # paste the JSON above
npx wrangler secret put ADMIN_TOKEN           # separate token for /admin/*

# 5. Deploy
npx wrangler deploy
# → live at https://ask149-feed.<your-account>.workers.dev
# (custom domain optional later: feed.ask149.com)
```

## Local dev

```bash
cp .dev.vars.example .dev.vars   # edit if you want different test tokens
npx wrangler dev
# → local server at http://localhost:8787

# Smoke test:
curl http://localhost:8787/health
curl -X POST http://localhost:8787/events \
  -H "Authorization: Bearer dev-token-1234" \
  -H "Content-Type: application/json" \
  -d '{"action":"test","summary":"hello from curl"}'
curl http://localhost:8787/events.json
```

## Architecture

- **Storage:** Cloudflare KV. Keys: `event:<ULID>` (event JSON), `index:all` (newest-first list of last 5000 IDs), `config:mute` (display gate).
- **Retention:** 90 days TTL on event:* keys; index keeps last 5000 regardless.
- **Auth:** Bearer-per-agent. Each agent gets its own token. Revoke one without rotating others by editing `AGENT_KEYS_JSON` secret.
- **Validation pipeline:** body shape → field bounds → regex denylist for secrets (OpenAI keys, Anthropic, GitHub PATs, Jules keys, AWS, JWTs, absolute user paths, `password=`, `token=`, `Bearer …`). On match: reject with `400 denylist:<name>`. Worker logs the rejection but never logs the body.
- **CORS:** `Access-Control-Allow-Origin: *` on read endpoints so the static site can fetch from a different origin.

## Event payload

```json
{
  "action": "submitted-task",
  "repo": "Ask149/foo",
  "summary": "Add CHANGELOG stub (≤200 chars, sanitized)",
  "url": "https://github.com/Ask149/foo/pull/42",
  "duration_seconds": 327,
  "visibility": "public",
  "metadata": { "anything": "structured" }
}
```

Server adds `id` (ULID), `agent` (from auth), `ts` (ISO 8601).

## Cost

Free tier (100k reads/day + 1k writes/day) covers ~30 agent events/day × a few hundred site visitors × forever. Will not exceed $0 at any reasonable scale.

## Files

```
src/
  index.ts        — router + CORS
  auth.ts         — bearer-per-agent + admin (constant-time compare)
  validate.ts     — shape + bounds + secret denylist
  storage.ts      — KV ops + index
  handlers.ts     — endpoint logic
  ulid.ts         — ULID generation (no dep)
  types.ts        — Env + AgentEvent types
wrangler.toml     — config
package.json
tsconfig.json
.dev.vars.example — local dev tokens template
```
