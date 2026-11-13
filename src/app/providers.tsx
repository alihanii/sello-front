"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { AUTH_EVENT } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    // Pages read cached data first and refresh in the background, so going back to a page shows it at once
    // (no skeleton) while live parts keep their own refetchInterval / SSE invalidation.
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, gcTime: 15 * 60_000, retry: 1, refetchOnWindowFocus: false } } }),
  );
  useEffect(() => {
    // Another account (or none): drop the cached data of the previous one. Sign-out in another tab arrives as the same event.
    const reset = () => client.clear();
    window.addEventListener(AUTH_EVENT, reset);
    return () => window.removeEventListener(AUTH_EVENT, reset);
  }, [client]);
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster dir="rtl" position="top-center" richColors toastOptions={{ style: { fontFamily: "var(--font-sans)" } }} />
    </QueryClientProvider>
  );
}
