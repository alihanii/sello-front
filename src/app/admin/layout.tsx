import { Suspense } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminShell } from "@/components/shell/AdminShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard admin>
      <AdminShell><Suspense>{children}</Suspense></AdminShell>
    </AuthGuard>
  );
}
