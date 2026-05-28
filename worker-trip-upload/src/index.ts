import {
  clearOAuthState,
  clearSession,
  createOAuthState,
  createSessionCookie,
  exchangeCodeForUser,
  githubAuthorizeUrl,
  isAllowedUser,
  readSession,
  verifyOAuthState,
} from "./auth";
import { publishUpload } from "./github";
import { LOCATIONS } from "./locations";
import { parseUpload } from "./validation";
import type { Env, PublishResult, Session } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function html(body: string, status = 200, headers: HeadersInit = {}): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", ...headers },
  });
}

function redirect(location: string, headers: HeadersInit = {}): Response {
  return new Response(null, { status: 302, headers: { Location: location, ...headers } });
}

function layout(title: string, content: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; --bg:#e8e5d8; --fg:#1f2418; --muted:#5a5848; --accent:#7a4a1f; --rule:rgba(31,36,24,.18); --surface:rgba(254,250,240,.68); }
    * { box-sizing: border-box; }
    body { margin:0; min-height:100vh; font-family: Georgia, 'Times New Roman', serif; color:var(--fg); background:linear-gradient(180deg,#e8e5d8,#d8d3c0); }
    body::before { content:""; position:fixed; inset:0; pointer-events:none; background-image:linear-gradient(rgba(31,36,24,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(31,36,24,.08) 1px,transparent 1px); background-size:30px 30px; }
    main { position:relative; z-index:1; width:min(920px, calc(100vw - 32px)); margin:0 auto; padding:48px 0; }
    .bar { display:flex; justify-content:space-between; gap:16px; align-items:center; margin-bottom:32px; font:12px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace; text-transform:uppercase; letter-spacing:.18em; color:var(--muted); }
    h1 { font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif; font-weight:400; font-size:clamp(42px,9vw,84px); line-height:.9; letter-spacing:-.03em; margin:0 0 12px; }
    p { font-size:18px; line-height:1.55; }
    a { color:var(--accent); }
    .card { background:var(--surface); border:1px solid var(--rule); padding:24px; box-shadow:0 14px 50px rgba(31,36,24,.08); }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    label { display:grid; gap:8px; font:12px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace; text-transform:uppercase; letter-spacing:.14em; color:var(--muted); }
    input, select, button { width:100%; font:16px/1.3 system-ui,sans-serif; border:1px solid var(--rule); border-radius:0; padding:12px; background:#fffaf0; color:var(--fg); }
    input[type=file] { background:var(--surface); }
    button { cursor:pointer; background:var(--accent); color:#fffaf0; border-color:var(--accent); font:12px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace; text-transform:uppercase; letter-spacing:.18em; }
    button.secondary { background:transparent; color:var(--accent); }
    .full { grid-column:1 / -1; }
    .hint { color:var(--muted); font-size:14px; margin:6px 0 0; }
    .preview { display:grid; grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); gap:12px; margin-top:12px; }
    .thumb { border:1px solid var(--rule); background:#fffaf0; padding:8px; }
    .thumb img { width:100%; aspect-ratio:1; object-fit:cover; display:block; filter:saturate(.92); }
    .thumb label { margin-top:8px; display:flex; align-items:center; gap:6px; text-transform:none; letter-spacing:0; font-size:13px; color:var(--fg); }
    .thumb input { width:auto; }
    .actions { display:flex; gap:12px; align-items:center; margin-top:20px; }
    .error { border-color:#9b2c2c; background:#fff4f0; color:#7a1f1f; }
    .success { border-color:#477a38; background:#f5fff0; }
    @media (max-width:720px) { .grid { grid-template-columns:1fr; } .bar { flex-direction:column; align-items:flex-start; } }
  </style>
</head>
<body>
  <main>${content}</main>
</body>
</html>`;
}

function loginPage(error?: string): Response {
  const content = `
    <div class="bar"><span>ASK149 · trip upload</span><span>private authoring surface</span></div>
    <section class="card ${error ? "error" : ""}">
      <h1>new field note</h1>
      <p>${error ? escapeHtml(error) : "Sign in with GitHub to upload Traveler entries. Only the allowlisted GitHub account can publish."}</p>
      <p><a href="/login"><button type="button">Sign in with GitHub</button></a></p>
    </section>`;
  return html(layout("Trip upload · sign in", content), error ? 403 : 200);
}

function locationOptions(): string {
  const groups = ["India", "United States", "Other"] as const;
  return groups.map((group) => {
    const options = LOCATIONS
      .filter((location) => location.group === group)
      .map((location) => `<option value="${escapeHtml(location.id)}">${escapeHtml(location.label)}</option>`)
      .join("");
    return `<optgroup label="${group}">${options}</optgroup>`;
  }).join("");
}

function formPage(session: Session, error?: string): Response {
  const content = `
    <div class="bar">
      <span>ASK149 · trip upload</span>
      <form method="post" action="/logout"><button class="secondary" type="submit">Sign out ${escapeHtml(session.login)}</button></form>
    </div>
    <section class="card ${error ? "error" : ""}">
      <h1>new field note</h1>
      <p>${error ? escapeHtml(error) : "Upload up to 10 photos with a title, date, and location. The backend opens a GitHub PR; after merge, the entry appears on the Traveler timeline."}</p>
      <form method="post" action="/upload" enctype="multipart/form-data" id="upload-form">
        <div class="grid">
          <label>Title
            <input name="title" required maxlength="80" placeholder="Sakura weekend" />
          </label>
          <label>Date
            <input name="visitDate" required type="date" />
          </label>
          <label class="full">Location
            <select name="locationId" required>${locationOptions()}</select>
          </label>
          <label>Reason
            <select name="reason">
              <option value="leisure">Leisure</option>
              <option value="work">Work</option>
              <option value="transit">Transit</option>
              <option value="family">Family</option>
            </select>
          </label>
          <label class="full">Photos
            <input name="photos" id="photos" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple required />
            <input name="coverIndex" id="coverIndex" type="hidden" value="0" />
            <span class="hint">1-10 photos. First selected photo is cover unless you mark another below.</span>
          </label>
        </div>
        <div id="preview" class="preview" aria-live="polite"></div>
        <div class="actions">
          <button type="submit">Create upload PR</button>
          <span class="hint" id="count"></span>
        </div>
      </form>
    </section>
    <script>
      const input = document.getElementById('photos');
      const preview = document.getElementById('preview');
      const coverIndex = document.getElementById('coverIndex');
      const count = document.getElementById('count');
      input.addEventListener('change', () => {
        preview.innerHTML = '';
        const files = Array.from(input.files || []);
        count.textContent = files.length ? files.length + ' selected' : '';
        if (files.length > 10) count.textContent = 'Too many photos — max 10.';
        files.slice(0, 10).forEach((file, index) => {
          const url = URL.createObjectURL(file);
          const item = document.createElement('div');
          item.className = 'thumb';
          const img = document.createElement('img');
          img.alt = '';
          img.src = url;
          const label = document.createElement('label');
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'cover-ui';
          radio.checked = index === 0;
          radio.addEventListener('change', () => { coverIndex.value = String(index); });
          label.append(radio, ' Cover');
          const filename = document.createElement('div');
          filename.className = 'hint';
          filename.textContent = file.name;
          item.append(img, label, filename);
          preview.appendChild(item);
        });
      });
    </script>`;
  return html(layout("Trip upload", content), error ? 400 : 200);
}

function resultPage(result: PublishResult): Response {
  const content = `
    <div class="bar"><span>ASK149 · trip upload</span><a href="/">new upload</a></div>
    <section class="card success">
      <h1>uploaded</h1>
      <p>Created <strong>${escapeHtml(result.slug)}</strong> on branch <code>${escapeHtml(result.branch)}</code>.</p>
      <p>${result.prUrl ? `<a href="${escapeHtml(result.prUrl)}">Open pull request</a>` : `<a href="${escapeHtml(result.commitUrl)}">Open commit</a>`}</p>
      <p><a href="${escapeHtml(result.liveUrl)}">Traveler page</a> updates after the PR is merged and GitHub Pages deploys.</p>
    </section>`;
  return html(layout("Trip upload · uploaded", content), 201);
}

function badRequest(message: string): Response {
  return html(layout("Trip upload · error", `<section class="card error"><h1>not quite</h1><p>${escapeHtml(message)}</p><p><a href="/">Back to form</a></p></section>`), 400);
}

function verifyOrigin(req: Request): boolean {
  const origin = req.headers.get("Origin");
  if (!origin) return true;
  return new URL(origin).origin === new URL(req.url).origin;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const session = await readSession(req, env);

    try {
      if (url.pathname === "/health") return new Response(JSON.stringify({ ok: true, env: env.ENVIRONMENT }), { headers: { "Content-Type": "application/json" } });

      if (url.pathname === "/login" && req.method === "GET") {
        const { state, cookie } = await createOAuthState(req, env);
        return redirect(githubAuthorizeUrl(req, env, state), { "Set-Cookie": cookie });
      }

      if (url.pathname === "/oauth/callback" && req.method === "GET") {
        if (!(await verifyOAuthState(req, env, url.searchParams.get("state")))) {
          return loginPage("OAuth state check failed. Try signing in again.");
        }
        const code = url.searchParams.get("code");
        if (!code) return loginPage("GitHub did not return an OAuth code.");
        const user = await exchangeCodeForUser(req, env, code);
        if (!isAllowedUser(env, user.login)) return loginPage(`GitHub user ${user.login} is not allowlisted.`);
        const headers = new Headers({ Location: "/" });
        headers.append("Set-Cookie", await createSessionCookie(req, env, user));
        headers.append("Set-Cookie", clearOAuthState(req));
        return new Response(null, { status: 302, headers });
      }

      if (url.pathname === "/logout" && req.method === "POST") {
        return redirect("/", { "Set-Cookie": clearSession(req) });
      }

      if (url.pathname === "/" && req.method === "GET") {
        return session ? formPage(session) : loginPage();
      }

      if (url.pathname === "/upload" && req.method === "POST") {
        if (!session) return loginPage("Sign in before uploading.");
        if (!verifyOrigin(req)) return badRequest("Origin check failed.");
        const upload = await parseUpload(await req.formData());
        const result = await publishUpload(env, upload);
        return resultPage(result);
      }

      return badRequest("Route not found.");
    } catch (error) {
      if (session && url.pathname === "/upload") {
        return formPage(session, error instanceof Error ? error.message : String(error));
      }
      return badRequest(error instanceof Error ? error.message : String(error));
    }
  },
};
