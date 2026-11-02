"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { AUTH_EVENT, getToken } from "@/lib/api";
import { useMe } from "@/lib/hooks";
import { RouteSkeleton } from "@/components/shell/ShellSkeleton";

function subscribe(cb: () => void) {
  window.addEventListener(AUTH_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(AUTH_EVENT, cb); window.removeEventListener("storage", cb); };
}

/**
 * Client-only gate for the signed-in area.
 *
 * The server (and the first client paint) renders only a skeleton of the shell + page, never the page itself, so the whole
 * signed-in area is rendered in the browser. The gate lives in a layout, so it mounts once: moving between pages afterwards
 * is plain client-side routing and never shows it again. Sellers are not held on /auth/me (pages fetch in parallel with it);
 * only the admin area waits for the role.
 */
export function AuthGuard({ children, admin }: { children: React.ReactNode; admin?: boolean }) {
  const router = useRouter();
  const path = usePathname();
  // undefined = not known yet (server render / hydration), null = signed out.
  const token = useSyncExternalStore(subscribe, getToken, () => undefined);
  const { data: me } = useMe(!!token);
  useEffect(() => {
    if (token === null) router.replace("/login");
  }, [token, router]);
  useEffect(() => {
    if (admin && me && me.role !== "admin") router.replace("/app");
  }, [admin, me, router]);
  if (!token || (admin && me?.role !== "admin")) return <RouteSkeleton path={path} />;
  return <>{children}</>;
}
