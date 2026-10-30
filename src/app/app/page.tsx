"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMe, useStores } from "@/lib/hooks";
import { Spinner } from "@/components/ui/primitives";

export default function AppHome() {
  const router = useRouter();
  const { data: stores } = useStores();
  const { data: me } = useMe();
  useEffect(() => {
    if (!stores || !me) return;
    if (!stores.length || !me.onboarded) router.replace(stores.length ? `/app/onboarding?store=${stores[0].id}` : "/app/onboarding");
    else router.replace(`/app/s/${stores[0].id}`);
  }, [stores, me, router]);
  return <div className="min-h-dvh grid place-items-center"><Spinner className="size-6 text-primary" /></div>;
}
