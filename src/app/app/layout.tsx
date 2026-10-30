import { Suspense } from "react";
import { AuthGuard } from "@/components/AuthGuard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Suspense>{children}</Suspense>
    </AuthGuard>
  );
}
