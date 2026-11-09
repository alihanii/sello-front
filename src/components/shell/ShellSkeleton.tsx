"use client";

import { Card, Skeleton, cn } from "@/components/ui/primitives";
import {
  ActivitySkeleton, AdminAiKeysPageSkeleton, AdminDashboardSkeleton, AdminIntegrationsSkeleton, AdminListSkeleton, AdminDetailSkeleton, AdminFormsSkeleton, AdminTableSkeleton, AdminUsageSkeleton,
  BillingSkeleton, CalendarSkeleton, CardsStackSkeleton, ChannelsSkeleton, ChatSkeleton, CrawlSkeleton, DashboardSkeleton,
  OperationSkeleton, ProductEditSkeleton, ProductNewSkeleton, ProductsSkeleton, SettingsSkeleton, StoresSkeleton, WizardSkeleton,
} from "@/components/ui/skeletons";

/**
 * The exact frame of AppShell / AdminShell (floating sidebar, pill header, phone tab bar) with placeholders inside.
 * Shown before the signed-in area has mounted (first paint of a hard load), so the real shell lands on the same pixels.
 */
export function ShellSkeleton({ admin, children }: { admin?: boolean; children?: React.ReactNode }) {
  const items = admin ? 11 : 7;
  return (
    <div className="min-h-dvh lg:ps-[292px]" aria-busy="true" aria-label="در حال بارگذاری">
      <aside className="on-nav fixed inset-y-4 start-4 w-[268px] rounded-card p-4 hidden lg:flex flex-col gap-4 z-20">
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="flex items-center gap-2.5"><Skeleton className="size-9 rounded-control" /><Skeleton className="h-5 w-16 rounded-md" /></span>
          {admin && <Skeleton className="h-6 w-12 rounded-full" />}
        </div>
        {!admin && <Skeleton className="h-14 rounded-2xl" />}
        <nav className="flex flex-col gap-1">
          {Array.from({ length: items }, (_, i) => <NavSkeleton key={i} width={[64, 72, 96, 48, 60, 44, 80, 70, 56, 88, 66][i]} />)}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-edge pt-3">
          {Array.from({ length: admin ? 1 : 3 }, (_, i) => <NavSkeleton key={i} width={[104, 84, 70][i]} />)}
        </div>
      </aside>

      <header className="sticky top-0 z-30 px-3 sm:px-4 lg:px-8 pt-3 lg:pt-4 max-w-[1440px] mx-auto">
        <div className="on-nav shadow-[var(--shadow)] rounded-2xl h-14 ps-2 pe-2 sm:ps-3 flex items-center gap-1.5 sm:gap-2">
          <span className="lg:hidden ps-1 flex items-center gap-2"><Skeleton className="size-9 rounded-control" /><Skeleton className="h-4 w-14 rounded-md" /></span>
          <div className="flex-1" />
          {Array.from({ length: admin ? 1 : 3 }, (_, i) => <Skeleton key={i} className="size-9 rounded-full" />)}
          {!admin && <span className="hidden sm:flex items-center gap-2 ps-2 border-s border-edge"><Skeleton className="size-9 rounded-full" /><Skeleton className="h-3.5 w-20 rounded-md hidden md:block" /></span>}
        </div>
      </header>

      <main className="px-3 sm:px-4 lg:px-8 pt-5 sm:pt-7 pb-28 lg:pb-10 max-w-[1440px] mx-auto">{children}</main>

      <nav className="lg:hidden fixed inset-x-3 bottom-3 z-30 on-nav shadow-[var(--shadow)] rounded-card px-1.5 pt-1.5 pb-safe">
        <div className="grid grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex flex-col items-center justify-center gap-1 h-14">
              <Skeleton className="h-8 w-12 rounded-full" /><Skeleton className="h-2.5 w-8 rounded" />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavSkeleton({ width }: { width: number }) {
  return (
    <div className="flex items-center gap-3 h-11 px-3">
      <Skeleton className="size-[18px] rounded-md" />
      <Skeleton className="h-3.5 rounded-md" style={{ width }} />
    </div>
  );
}

/** Centered placeholder for pages that only decide where to go (redirects, OAuth callbacks). */
export function CenteredSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("min-h-dvh grid place-items-center px-4", className)} aria-busy="true" aria-label="در حال بارگذاری">
      <Card className="w-full max-w-md p-6 space-y-4">
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton className="h-3.5 w-48 rounded-md" />
        <Skeleton className="h-11 rounded-full" />
      </Card>
    </div>
  );
}

/** The skeleton of a signed-in page's content, picked from its URL. Mirrors each route's loading.tsx. */
export function pageSkeleton(path: string): React.ReactNode {
  const p = path.replace(/\/+$/, "");
  if (p.startsWith("/admin")) {
    const rest = p.slice("/admin".length);
    if (rest === "") return <AdminDashboardSkeleton />;
    if (/^\/users\/[^/]+/.test(rest)) return <AdminDetailSkeleton />;
    if (rest === "/users") return <AdminTableSkeleton search cols={7} />;
    if (rest === "/stores") return <AdminTableSkeleton cols={5} />;
    if (rest === "/audit") return <AdminListSkeleton icon={false} />;
    if (rest === "/channels") return <AdminListSkeleton filters={2} />;
    if (rest === "/ai/usage") return <AdminUsageSkeleton stats={4} actions={3} />;
    if (rest === "/chat") return <AdminUsageSkeleton />;
    if (rest === "/ai") return <AdminAiKeysPageSkeleton />;
    if (rest === "/integrations") return <AdminIntegrationsSkeleton />;
    if (rest === "/plans") return <AdminFormsSkeleton />;
    if (rest === "/requests") return <CardsStackSkeleton cards={2} />;
    return <CardsStackSkeleton actions={1} />;
  }
  const m = p.match(/^\/app\/s\/[^/]+(\/.*)?$/);
  if (m) {
    const rest = m[1] ?? "";
    if (rest === "") return <DashboardSkeleton />;
    if (rest === "/products") return <ProductsSkeleton />;
    if (rest === "/products/new" || rest === "/products/ai") return <ProductNewSkeleton />;
    if (rest.startsWith("/products/")) return <ProductEditSkeleton />;
    if (rest === "/activity") return <ActivitySkeleton />;
    if (rest.startsWith("/activity/")) return <OperationSkeleton />;
    if (rest === "/calendar") return <CalendarSkeleton />;
    if (rest === "/channels") return <ChannelsSkeleton />;
    if (rest === "/crawl") return <CrawlSkeleton />;
    if (rest === "/chat") return <ChatSkeleton />;
    if (rest === "/settings") return <SettingsSkeleton />;
    return <DashboardSkeleton />;
  }
  return null;
}

/** What to paint for a signed-in URL before the app has mounted: the right shell and the right page skeleton. */
export function RouteSkeleton({ path }: { path: string }) {
  if (path.startsWith("/admin")) return <ShellSkeleton admin>{pageSkeleton(path)}</ShellSkeleton>;
  if (path.startsWith("/app/s/")) return <ShellSkeleton>{pageSkeleton(path)}</ShellSkeleton>;
  if (path.startsWith("/app/stores")) return <StoresSkeleton />;
  if (path.startsWith("/app/billing")) return <BillingSkeleton />;
  if (path.startsWith("/app/onboarding")) return <WizardSkeleton />;
  if (path.startsWith("/app/oauth")) return <CenteredSkeleton />;
  // /app itself only redirects, almost always to a store dashboard.
  return <ShellSkeleton><DashboardSkeleton /></ShellSkeleton>;
}
