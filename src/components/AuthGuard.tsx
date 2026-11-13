"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { AUTH_STATE_EVENT, ensureToken, getAuthState } from "@/lib/api";
import { useMe } from "@/lib/hooks";
import { RouteSkeleton } from "@/components/shell/ShellSkeleton";

function subscribe(cb: () => void) {
  window.addEventListener(AUTH_STATE_EVENT, cb);
  return () => window.removeEventListener(AUTH_STATE_EVENT, cb);
}

/**
 * Client-only gate for the signed-in area.
 *
 * The server (and the first client paint) renders only a skeleton of the shell + page, never the page itself, so the whole
 * signed-in area is rendered in the browser. The gate lives in a layout, so it mounts once: moving between pages afterwards
 * is plain client-side routing and never shows it again. On a fresh load the access token is fetched silently from the
 * refresh cookie first; sellers are not held on /auth/me (pages fetch in parallel with it); only the admin area waits for the role.
 */
export function AuthGuard({ children, admin }: { children: React.ReactNode; admin?: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const state = useSyncExternalStore(subscribe, getAuthState, () => "unknown" as const);
  const { data: me } = useMe(state === "in");
  useEffect(() => {
    if (state !== "unknown") return;
    let stop = false;
    let wait = 2000;
    // Offline or the server restarting: keep the session and try again, instead of signing out.
    const tryIt = () => ensureToken().catch(() => { if (!stop) { setTimeout(tryIt, wait); wait = Math.min(wait * 2, 30_000); } });
    tryIt();
    return () => { stop = true; };
  }, [state]);
  useEffect(() => {
    if (state === "out") router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [state, router, path]);
  useEffect(() => {
    if (admin && me && me.role !== "admin") router.replace("/app");
  }, [admin, me, router]);
  if (state !== "in" || (admin && me?.role !== "admin")) return <RouteSkeleton path={path} />;
  return <>{children}</>;
}
