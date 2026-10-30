"use client";

import { AppShell } from "@/components/shell/AppShell";
import { useStoreId } from "@/lib/hooks";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const id = useStoreId();
  return <AppShell storeId={id}>{children}</AppShell>;
}
