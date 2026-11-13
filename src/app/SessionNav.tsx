"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { AUTH_STATE_EVENT, ensureToken, getAuthState, hasSession } from "@/lib/api";
import { Spinner } from "@/components/ui/primitives";

function subscribe(cb: () => void) {
  window.addEventListener(AUTH_STATE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(AUTH_STATE_EVENT, cb); window.removeEventListener("storage", cb); };
}

/** "wait" until this browser's session is known, so neither the signed-out nor the signed-in buttons flash wrongly. */
function snapshot() {
  const s = getAuthState();
  if (s === "unknown") return hasSession() ? "wait" : "out";
  return s;
}

/**
 * Landing header buttons: «ورود» + «شروع رایگان», or «ورود به پنل» when signed in. With no session hint there is nothing
 * to check, so the signed-out buttons show at once; with one, a small spinner shows while the session is confirmed.
 */
export function SessionNav() {
  const s = useSyncExternalStore(subscribe, snapshot, () => "boot" as const);
  useEffect(() => {
    if (s === "wait") ensureToken().catch(() => {});
  }, [s]);
  if (s === "boot") return <span aria-hidden className="inline-block h-8 w-32" />;
  if (s === "wait") return <span role="status" aria-label="در حال بررسی ورود" className="inline-flex h-8 w-32 items-center justify-center"><Spinner className="size-4 text-primary" /></span>;
  if (s === "in") return <Link prefetch={false} href="/app" className="ld-btn ld-btn-primary ld-btn-sm">ورود به پنل</Link>;
  return (
    <>
      <Link prefetch={false} href="/login" className="ld-btn ld-btn-quiet ld-btn-sm">ورود</Link>
      <Link prefetch={false} href="/login" className="ld-btn ld-btn-primary ld-btn-sm">شروع رایگان</Link>
    </>
  );
}
