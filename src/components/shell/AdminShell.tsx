"use client";

import { ArrowRight, Blocks, CreditCard, Gauge, Inbox, KeyRound, LineChart, Menu, Plug, ScrollText, Store, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Chip, Sheet, cn } from "@/components/ui/primitives";
import { Logo, ThemeToggle } from "./AppShell";

const ITEMS = [
  { href: "/admin", icon: Gauge, label: "داشبورد", short: "خانه", exact: true, tab: true },
  { href: "/admin/users", icon: Users, label: "کاربران", short: "کاربران", tab: true },
  { href: "/admin/stores", icon: Store, label: "فروشگاه‌ها", short: "فروشگاه", tab: true },
  { href: "/admin/ai/usage", icon: LineChart, label: "مانیتورینگ AI", short: "مصرف AI", tab: true },
  { href: "/admin/channels", icon: Plug, label: "کانال‌ها" },
  { href: "/admin/plans", icon: CreditCard, label: "پلن‌ها" },
  { href: "/admin/requests", icon: Inbox, label: "درخواست‌های خرید" },
  { href: "/admin/ai", icon: KeyRound, label: "کلیدهای AI", exact: true },
  { href: "/admin/integrations", icon: Blocks, label: "یکپارچه‌سازی‌ها" },
  { href: "/admin/audit", icon: ScrollText, label: "لاگ ادمین" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [path]);
  const isActive = (it: (typeof ITEMS)[number]) => (it.exact ? path === it.href : path.startsWith(it.href));
  const moreActive = ITEMS.some((it) => !it.tab && isActive(it));

  return (
    <div className="min-h-dvh lg:ps-[292px]">
      <aside className="glass fixed inset-y-4 start-4 w-[268px] rounded-[28px] p-4 hidden lg:flex flex-col gap-4 z-20">
        <div className="flex items-center justify-between px-1 pt-1"><Logo /><Chip tone="warning">ادمین</Chip></div>
        <nav className="flex flex-col gap-1" aria-label="منوی ادمین">
          {ITEMS.map((it) => {
            const active = isActive(it);
            return (
              <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
                className={cn("group flex items-center gap-3 h-11 px-3 rounded-2xl text-[14px] font-bold transition",
                  active ? "bg-primary-soft text-primary" : "text-muted hover:text-fg hover:bg-subtle")}>
                <it.icon className={cn("size-[18px]", active && "text-warning")} aria-hidden />{it.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/app" className="mt-auto flex items-center gap-2 h-11 px-3 rounded-2xl text-[13px] font-bold text-muted hover:text-fg hover:bg-subtle">
          <ArrowRight className="size-4" />بازگشت به پنل فروشنده
        </Link>
      </aside>

      <header className="sticky top-0 z-30 px-3 sm:px-4 lg:px-8 pt-3 lg:pt-4">
        <div className="glass rounded-full h-14 px-2 sm:px-3 flex items-center gap-2">
          <div className="lg:hidden flex items-center gap-2 ps-1"><Logo className="text-[18px]" /><Chip tone="warning">ادمین</Chip></div>
          <div className="flex-1" />
          <ThemeToggle />
        </div>
      </header>

      <main key={path} className="page-in px-3 sm:px-4 lg:px-8 pt-5 sm:pt-7 pb-28 lg:pb-10 max-w-[1440px]">{children}</main>

      <nav className="lg:hidden fixed inset-x-3 bottom-3 z-30 glass-strong rounded-[26px] px-1.5 pt-1.5 pb-safe" aria-label="منوی ادمین">
        <div className="grid grid-cols-5">
          {ITEMS.filter((it) => it.tab).map((it) => {
            const active = isActive(it);
            return (
              <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
                className={cn("flex flex-col items-center justify-center gap-0.5 h-14 text-[11px] font-bold", active ? "text-fg" : "text-muted")}>
                <span className={cn("grid place-items-center h-8 w-12 rounded-full", active && "bg-primary-soft text-primary")}><it.icon className="size-[19px]" aria-hidden /></span>
                {it.short}
              </Link>
            );
          })}
          <button onClick={() => setMore(true)} aria-expanded={more}
            className={cn("flex flex-col items-center justify-center gap-0.5 h-14 text-[11px] font-bold cursor-pointer", moreActive ? "text-fg" : "text-muted")}>
            <span className={cn("grid place-items-center h-8 w-12 rounded-full", moreActive && "bg-primary-soft text-primary")}><Menu className="size-[19px]" aria-hidden /></span>
            بیشتر
          </button>
        </div>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title="منوی ادمین">
        <div className="grid grid-cols-2 gap-2">
          {[...ITEMS.filter((it) => !it.tab), { href: "/app", icon: ArrowRight, label: "پنل فروشنده", exact: true }].map((it) => {
            const active = isActive(it as any);
            return (
              <Link key={it.href} href={it.href} className={cn("flex flex-col gap-2 p-3.5 rounded-2xl text-[14px] font-bold", active ? "bg-primary-soft text-primary" : "bg-subtle hover:bg-glass-strong")}>
                <it.icon className={cn("size-5", active ? "text-warning" : "text-muted")} aria-hidden />{it.label}
              </Link>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
