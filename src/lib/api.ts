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

export const AUTH_EVENT = "sello-auth";

/** Stores the token and tells the app the signed-in account changed, so cached data of the previous one is dropped. */
export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem("sello-token", token);
    else localStorage.removeItem("sello-token");
  } catch {}
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EVENT));
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
