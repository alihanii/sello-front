"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { AUTH_EVENT } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: false } } }),
  );
  useEffect(() => {
    const reset = () => client.clear();
    const onStorage = (e: StorageEvent) => e.key === "sello-token" && reset();
    window.addEventListener(AUTH_EVENT, reset);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener(AUTH_EVENT, reset); window.removeEventListener("storage", onStorage); };
  }, [client]);
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster dir="rtl" position="top-center" richColors toastOptions={{ style: { fontFamily: "var(--font-vazir)" } }} />
    </QueryClientProvider>
  );
}
