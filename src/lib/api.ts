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

export function getToken(): string | null {
  try {
    return localStorage.getItem("sello-token");
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem("sello-token", token);
    else localStorage.removeItem("sello-token");
  } catch {}
}

export async function api<T = any>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, { ...init, headers, body });
  } catch {
    throw new ApiError(0, "ارتباط با سرور برقرار نشد.");
  }
  if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/")) {
    setToken(null);
    window.location.href = "/login";
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

export function mediaUrl(url: string) {
  return url?.startsWith("/media/") ? `${API_URL}${url}` : url;
}
