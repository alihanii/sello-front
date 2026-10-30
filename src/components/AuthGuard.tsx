"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/api";
import { useMe } from "@/lib/hooks";
import { Spinner } from "@/components/ui/primitives";

export function AuthGuard({ children, admin }: { children: React.ReactNode; admin?: boolean }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!getToken()) router.replace("/login");
    else setReady(true);
  }, [router]);
  const { data: me, isLoading } = useMe();
  useEffect(() => {
    if (admin && me && me.role !== "admin") router.replace("/app");
  }, [admin, me, router]);
  if (!ready || isLoading || (admin && me?.role !== "admin"))
    return <div className="min-h-dvh grid place-items-center"><Spinner className="size-6 text-primary" /></div>;
  return <>{children}</>;
}
