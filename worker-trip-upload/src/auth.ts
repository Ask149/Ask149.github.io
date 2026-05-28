import type { Env, Session } from "./types";

interface GitHubUser {
  login: string;
  id: number;
  name?: string;
}

const SESSION_COOKIE = "trip_session";
const STATE_COOKIE = "oauth_state";
const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlEncodeString(value: string): string {
  return base64Url(encoder.encode(value));
}

function base64UrlDecodeString(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64Url(new Uint8Array(sig));
}

function cookieHeader(name: string, value: string, req: Request, maxAge: number): string {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function clearCookie(name: string, req: Request): string {
  return cookieHeader(name, "", req, 0);
}

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("Cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

async function signPayload(payload: unknown, env: Env): Promise<string> {
  const body = base64UrlEncodeString(JSON.stringify(payload));
  return `${body}.${await hmac(body, env.SESSION_SECRET)}`;
}

async function verifyPayload<T>(token: string, env: Env): Promise<T | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmac(body, env.SESSION_SECRET);
  if (sig !== expected) return null;
  try {
    return JSON.parse(base64UrlDecodeString(body)) as T;
  } catch {
    return null;
  }
}

export async function createOAuthState(req: Request, env: Env): Promise<{ state: string; cookie: string }> {
  const state = crypto.randomUUID();
  const signed = await signPayload({ state, exp: Date.now() + 10 * 60_000 }, env);
  return { state, cookie: cookieHeader(STATE_COOKIE, signed, req, 600) };
}

export async function verifyOAuthState(req: Request, env: Env, state: string | null): Promise<boolean> {
  if (!state) return false;
  const signed = readCookie(req, STATE_COOKIE);
  if (!signed) return false;
  const payload = await verifyPayload<{ state: string; exp: number }>(signed, env);
  return Boolean(payload && payload.exp > Date.now() && payload.state === state);
}

export function clearOAuthState(req: Request): string {
  return clearCookie(STATE_COOKIE, req);
}

export function githubAuthorizeUrl(req: Request, env: Env, state: string): string {
  const callback = new URL("/oauth/callback", req.url).href;
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", env.GITHUB_OAUTH_CLIENT_ID);
  url.searchParams.set("redirect_uri", callback);
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("state", state);
  return url.href;
}

export async function exchangeCodeForUser(req: Request, env: Env, code: string): Promise<GitHubUser> {
  const callback = new URL("/oauth/callback", req.url).href;
  const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": "ask149-trip-upload",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
      redirect_uri: callback,
    }),
  });
  const tokenJson = await tokenResp.json<{ access_token?: string; error?: string; error_description?: string }>();
  if (!tokenResp.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error_description ?? tokenJson.error ?? "GitHub OAuth token exchange failed");
  }

  const userResp = await fetch("https://api.github.com/user", {
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${tokenJson.access_token}`,
      "User-Agent": "ask149-trip-upload",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!userResp.ok) throw new Error("GitHub user lookup failed");
  return userResp.json<GitHubUser>();
}

export function isAllowedUser(env: Env, login: string): boolean {
  return env.ALLOWED_GITHUB_LOGINS
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(login.toLowerCase());
}

export async function createSessionCookie(req: Request, env: Env, user: GitHubUser): Promise<string> {
  const session: Session = {
    login: user.login,
    id: user.id,
    name: user.name,
    exp: Date.now() + 7 * 24 * 60 * 60_000,
  };
  return cookieHeader(SESSION_COOKIE, await signPayload(session, env), req, 7 * 24 * 60 * 60);
}

export async function readSession(req: Request, env: Env): Promise<Session | null> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const session = await verifyPayload<Session>(token, env);
  if (!session || session.exp <= Date.now()) return null;
  if (!isAllowedUser(env, session.login)) return null;
  return session;
}

export function clearSession(req: Request): string {
  return clearCookie(SESSION_COOKIE, req);
}
