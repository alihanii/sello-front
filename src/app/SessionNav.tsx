"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { AUTH_STATE_EVENT, hasSession } from "@/lib/api";

function subscribe(cb: () => void) {
  window.addEventListener(AUTH_STATE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(AUTH_STATE_EVENT, cb); window.removeEventListener("storage", cb); };
}

/** Landing header buttons: «ورود» + «شروع رایگان», or «ورود به پنل» when this browser is already signed in. */
export function SessionNav() {
  const signedIn = useSyncExternalStore(subscribe, hasSession, () => false);
  if (signedIn) return <Link prefetch={false} href="/app" className="ld-btn ld-btn-primary ld-btn-sm">ورود به پنل</Link>;
  return (
    <>
      <Link prefetch={false} href="/login" className="ld-btn ld-btn-quiet ld-btn-sm">ورود</Link>
      <Link prefetch={false} href="/login" className="ld-btn ld-btn-primary ld-btn-sm">شروع رایگان</Link>
    </>
  );
}
