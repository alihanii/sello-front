import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthGuard } from "@/components/AuthGuard";

// Signed-in pages are private: keep them out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Suspense>{children}</Suspense>
    </AuthGuard>
  );
}
