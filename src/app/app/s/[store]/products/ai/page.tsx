"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStoreId } from "@/lib/hooks";

export default function Page() {
  const sid = useStoreId();
  const router = useRouter();
  useEffect(() => { router.replace(`/app/s/${sid}/products/new?mode=ai`); }, [router, sid]);
  return null;
}
