export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  action?: { type: string; label: string };
  constructor(status: number, message: string, action?: { type: string; label: string }) {
    super(message);
    this.status = status;
    this.action = action;
  }
}

/*
 * Sign-in session.
 * - The access token lives only in this tab's memory (never in localStorage, so a script injected into the page can't
 *   carry it off for long): it lasts 15 minutes.
 * - The refresh token is an httpOnly, SameSite=Strict cookie scoped to /api/v1/auth: JavaScript can't read it. The
 *   server rotates it on every refresh and closes the session if an old one is replayed.
 * - "sello-session" in localStorage only says "this browser has a session" (no secret), so pages like the landing
 *   know to show the panel link and other tabs hear sign-in / sign-out.
 * - Refreshes are silent and shared: one at a time across tabs (Web Locks), one in flight per tab.
 */
const HINT = "sello-session";
const LEGACY = "sello-token"; // the old 24-hour token; traded for a session once
const PUBLIC_AUTH = ["/auth/otp/", "/auth/lookup", "/auth/password/login"];

export type AuthState = "unknown" | "in" | "out";
let access: { token: string; exp: number; sub: string } | null = null;
let state: AuthState = "unknown";
let inflight: Promise<string | null> | null = null;

export const AUTH_EVENT = "sello-auth"; // the signed-in account changed (sign in, sign out, another account)
export const AUTH_STATE_EVENT = "sello-auth-state";

function read(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, v: string | null) {
  try { if (v) localStorage.setItem(key, v); else localStorage.removeItem(key); } catch {}
}
function claims(token: string): { sub?: string; exp?: number } {
  try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); } catch { return {}; }
}
function setState(next: AuthState, accountChanged: boolean) {
  const changed = next !== state;
  state = next;
  if (typeof window === "undefined") return;
  if (changed) window.dispatchEvent(new Event(AUTH_STATE_EVENT));
  if (accountChanged) window.dispatchEvent(new Event(AUTH_EVENT));
}

/** Whether this browser seems signed in, without asking the server (for links on public pages). */
export function hasSession() {
  return state === "in" || (state !== "out" && !!(read(HINT) || read(LEGACY)));
}
export function getAuthState(): AuthState {
  return state;
}
/** The current access token if it is still valid; may be null even when signed in (use ensureToken). */
export function getToken(): string | null {
  return access && access.exp > Date.now() ? access.token : null;
}

/** Takes the access token from a sign-in / refresh answer. */
export function setSession(r: { access_token: string; expires_in?: number }) {
  const c = claims(r.access_token);
  const exp = c.exp ? c.exp * 1000 : Date.now() + (r.expires_in ?? 900) * 1000;
  const changed = state !== "in" || access?.sub !== c.sub;
  access = { token: r.access_token, exp, sub: String(c.sub ?? "") };
  write(HINT, "1");
  write(LEGACY, null);
  setState("in", changed);
}

/** Forgets the session in this tab (and, through the hint, in the others). */
export function clearSession() {
  const was = state;
  access = null;
  write(HINT, null);
  write(LEGACY, null);
  setState("out", was !== "out");
}

async function authFetch(path: string, headers?: HeadersInit) {
  return fetch(`${API_URL}/api/v1${path}`, { method: "POST", credentials: "include", headers });
}

async function refreshNow(): Promise<string | null> {
  const legacy = read(LEGACY);
  if (legacy) {
    const res = await authFetch("/auth/session/upgrade", { Authorization: `Bearer ${legacy}` });
    write(LEGACY, null);
    if (res.ok) {
      setSession(await res.json());
      return access!.token;
    }
  }
  if (!read(HINT)) {
    clearSession();
    return null;
  }
  const run = async () => {
    // Another tab may have refreshed while this one waited for the lock: its cookie is ours too, so just refresh.
    const res = await authFetch("/auth/refresh");
    if (res.status === 401 || res.status === 403) {
      clearSession();
      return null;
    }
    if (!res.ok) throw new ApiError(res.status, "ارتباط با سرور برقرار نشد.");
    setSession(await res.json());
    return access!.token;
  };
  const locks = typeof navigator !== "undefined" ? (navigator as any).locks : undefined;
  return locks ? locks.request("sello-refresh", run) : run();
}

/** A valid access token, refreshing silently when the current one is (about to be) expired; null when signed out.
 * Throws ApiError(0) when the server can't be reached (the session is kept). */
export async function ensureToken(force = false): Promise<string | null> {
  if (!force && access && access.exp - Date.now() > 30_000) return access.token;
  if (typeof window === "undefined") return null;
  if (!inflight) {
    inflight = refreshNow()
      .catch((e) => { throw e instanceof ApiError ? e : new ApiError(0, "ارتباط با سرور برقرار نشد."); })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

/** Signs out on the server (the refresh cookie is revoked and cleared) and here. */
export async function logout() {
  try { await authFetch("/auth/logout"); } catch {}
  clearSession();
}

if (typeof window !== "undefined") {
  // Sign-in / sign-out in another tab.
  window.addEventListener("storage", (e) => {
    if (e.key !== HINT) return;
    if (!e.newValue) {
      if (state !== "out") { access = null; setState("out", true); }
    } else if (state === "out") {
      setState("unknown", false);
      ensureToken().catch(() => {});
    }
  });
}

export async function api<T = any>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const isPublicAuth = PUBLIC_AUTH.some((p) => path.startsWith(p));
  const send = async (token: string | null) => {
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    let body = init.body;
    if (init.json !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(init.json);
    }
    try {
      return await fetch(`${API_URL}/api/v1${path}`, { ...init, headers, body, ...(path.startsWith("/auth/") ? { credentials: "include" as const } : {}) });
    } catch {
      throw new ApiError(0, "ارتباط با سرور برقرار نشد.");
    }
  };
  const token = isPublicAuth || !hasSession() ? null : await ensureToken().catch(() => null);
  let res = await send(token);
  if (res.status === 401 && token) {
    // Expired early or the session moved on in another tab: one silent refresh, then try again.
    const fresh = await ensureToken(true).catch(() => null);
    if (fresh) res = await send(fresh);
    if (res.status === 401) {
      clearSession();
      const p = window.location.pathname;
      if (p.startsWith("/app") || p.startsWith("/admin")) window.location.href = `/login?next=${encodeURIComponent(p + window.location.search)}`;
    }
  }
  if (!res.ok) {
    let msg = "خطایی رخ داد.";
    let action;
    try {
      const data = await res.json();
      msg = data?.detail?.message ?? (typeof data?.detail === "string" ? data.detail : msg);
      action = data?.detail?.action;
    } catch {}
    throw new ApiError(res.status, msg, action);
  }
  const type = res.headers.get("content-type") ?? "";
  return (type.includes("json") ? res.json() : res.text()) as Promise<T>;
}

/** Authorization header for a raw fetch (uploads, downloads). */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await ensureToken().catch(() => null);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** imgproxy in front of /media (e.g. https://img.example.com); empty: pictures load as uploaded. */
export const IMG_URL = (process.env.NEXT_PUBLIC_IMGPROXY_URL ?? "").replace(/\/$/, "");
// The imgproxy presets on the server (w64 ... w1600); the same widths as the storefront's.
const IMG_WIDTHS = [64, 96, 128, 200, 256, 320, 360, 480, 640, 828, 1080, 1280, 1600];

/** Address of a picture. Our own /media files: with `width` (the box's size in CSS px) a WebP resized to fit it,
 * twice as wide for sharp screens; without it, the original (zoom, download, links). Other URLs stay as they are. */
export function mediaUrl(url: string, width?: number) {
  if (!url?.startsWith("/media/")) return url;
  if (width && IMG_URL) {
    const w = IMG_WIDTHS.find((x) => x >= width * 2) ?? IMG_WIDTHS[IMG_WIDTHS.length - 1];
    return `${IMG_URL}/insecure/w${w}/plain/${url.slice("/media/".length).split("?")[0]}@webp`;
  }
  return `${API_URL}${url}`;
}
