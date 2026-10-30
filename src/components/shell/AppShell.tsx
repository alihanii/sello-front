"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity, CalendarDays, ChevronDown, CreditCard, LayoutDashboard, LogOut, Menu, MessageCircle, Moon, Package,
  Plug, Radar, Settings, Shield, Store, Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, setToken } from "@/lib/api";
import { faDigits, faNum } from "@/lib/format";
import { useMe, useOperationsStream, useStores } from "@/lib/hooks";
import { Button, Sheet, cn } from "@/components/ui/primitives";
import { NotificationBell } from "./Notifications";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setDark(t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);
  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("sello-theme", next); } catch {}
    setDark(!dark);
  };
  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label="تغییر تم">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-black text-[21px] tracking-tight", className)}>
      {/* Price-tag mark: a seller's tag, not a robot. */}
      <svg viewBox="0 0 32 32" className="size-9 shrink-0" aria-hidden>
        <rect x="1" y="1" width="30" height="30" rx="10" className="fill-primary" />
        <path d="M10 9.5h7.6c.5 0 1 .2 1.4.6l4.4 4.4c.8.8.8 2 0 2.8l-6.2 6.2c-.8.8-2 .8-2.8 0l-4.4-4.4c-.4-.4-.6-.9-.6-1.4V10c0-.3.2-.5.6-.5Z" fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-primary-fg" />
        <circle cx="13.6" cy="13.4" r="1.6" fill="#fbbf24" />
      </svg>
      {!compact && <span dir="ltr">Sello</span>}
    </span>
  );
}

function NavItem({ href, icon: Icon, label, active, badge }: { href: string; icon: any; label: string; active: boolean; badge?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 h-11 px-3 rounded-2xl text-[14px] font-bold transition-all",
        active ? "bg-primary-soft text-primary" : "text-muted hover:text-fg hover:bg-subtle",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("size-[18px]", active ? "text-primary" : "group-hover:text-fg")} aria-hidden />
      <span className="flex-1">{label}</span>
      {badge}
    </Link>
  );
}

function StoreSwitcher({ storeId }: { storeId: number }) {
  const { data: stores } = useStores();
  const [open, setOpen] = useState(false);
  const current = stores?.find((s) => s.id === storeId);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="w-full bg-subtle hover:bg-glass-strong transition rounded-2xl p-2.5 flex items-center gap-2.5 cursor-pointer text-start" aria-expanded={open}>
        <span className="size-9 rounded-xl bg-primary/15 text-primary grid place-items-center"><Store className="size-4" /></span>
        <span className="flex-1 min-w-0">
          <span className="block text-[11px] text-muted">فروشگاه</span>
          <span className="block font-bold text-[14px] truncate">{current?.name ?? "…"}</span>
        </span>
        <ChevronDown className="size-4 text-muted" />
      </button>
      {open && (
        <div className="pop-in glass-strong absolute z-30 mt-2 w-full min-w-60 rounded-2xl p-1.5">
          {stores?.map((s) => (
            <Link key={s.id} href={`/app/s/${s.id}`} onClick={() => setOpen(false)}
              className={cn("block px-3 py-2 rounded-lg text-[14px] hover:bg-subtle", s.id === storeId && "font-bold text-primary")}>
              {s.name}
            </Link>
          ))}
          <Link href="/app/stores" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-[13px] text-muted hover:bg-subtle border-t border-edge mt-1">
            مدیریت فروشگاه‌ها و ساخت فروشگاه جدید
          </Link>
        </div>
      )}
    </div>
  );
}

function ActivityIndicator({ storeId }: { storeId: number }) {
  const { data } = useQuery({
    queryKey: ["ops-summary", storeId],
    queryFn: () => api(`/stores/${storeId}/operations/summary`),
    refetchInterval: 15_000,
  });
  return (
    <Link href={`/app/s/${storeId}/activity`} className={cn("hover:bg-subtle h-9 rounded-full flex items-center gap-2 text-[13px] font-bold", data?.running || data?.unseen_failed ? "px-3 bg-subtle" : "w-9 justify-center")} aria-label="فعالیت‌ها" title="فعالیت‌ها">
      <Activity className={cn("size-4", data?.running ? "text-primary animate-pulse" : "text-muted")} />
      {data?.running ? <span className="tnum">{faNum(data.running)}<span className="hidden sm:inline"> در حال اجرا</span></span> : null}
      {data?.unseen_failed > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-danger text-white text-[11px] grid place-items-center tnum">{faNum(data.unseen_failed)}</span>}
    </Link>
  );
}

export function AppShell({ storeId, children }: { storeId: number; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { data: me } = useMe();
  const [more, setMore] = useState(false);
  useOperationsStream(storeId);
  useEffect(() => setMore(false), [path]);

  const base = `/app/s/${storeId}`;
  const soon = <span className="text-[10px] font-bold text-ai bg-ai/12 rounded-full px-2">به‌زودی</span>;
  const items = [
    { href: base, icon: LayoutDashboard, label: "داشبورد", short: "خانه", exact: true, tab: true },
    { href: `${base}/products`, icon: Package, label: "محصولات", short: "محصولات", tab: true },
    { href: `${base}/activity`, icon: Activity, label: "فعالیت‌ها و لاگ", short: "فعالیت", tab: true },
    { href: `${base}/calendar`, icon: CalendarDays, label: "تقویم", short: "تقویم", tab: true },
    { href: `${base}/channels`, icon: Plug, label: "کانال‌ها" },
    { href: `${base}/crawl`, icon: Radar, label: "کرال" },
    { href: `${base}/chat`, icon: MessageCircle, label: "چت", badge: soon },
  ];
  const secondary = [
    { href: `${base}/settings`, icon: Settings, label: "تنظیمات فروشگاه" },
    { href: "/app/billing", icon: CreditCard, label: "پلن و اشتراک", exact: true },
    ...(me?.role === "admin" ? [{ href: "/admin", icon: Shield, label: "پنل ادمین", exact: true }] : []),
  ];
  const isActive = (href: string, exact?: boolean) => (exact ? path === href : path.startsWith(href));
  const logout = () => { setToken(null); router.push("/login"); };
  const moreActive = [...items.filter((i) => !i.tab), ...secondary].some((i) => isActive(i.href, (i as any).exact));

  return (
    <div className="min-h-dvh lg:ps-[292px]">
      {/* Desktop: floating glass sidebar */}
      <aside className="glass fixed inset-y-4 start-4 w-[268px] rounded-[28px] p-4 hidden lg:flex flex-col gap-4 z-20">
        <div className="px-1 pt-1"><Logo /></div>
        <StoreSwitcher storeId={storeId} />
        <nav className="flex flex-col gap-1 overflow-y-auto no-scrollbar" aria-label="منوی اصلی">
          {items.map((it) => <NavItem key={it.href} {...it} active={isActive(it.href, it.exact)} />)}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-edge pt-3">
          {secondary.map((it) => <NavItem key={it.href} {...it} active={isActive(it.href, it.exact)} />)}
        </div>
      </aside>

      <header className="sticky top-0 z-30 px-3 sm:px-4 lg:px-8 pt-3 lg:pt-4">
        <div className="glass rounded-full h-14 ps-2 pe-2 sm:ps-3 flex items-center gap-1.5 sm:gap-2">
          <Link href={base} className="lg:hidden ps-1" aria-label="داشبورد"><Logo className="text-[18px]" /></Link>
          <div className="flex-1" />
          <ActivityIndicator storeId={storeId} />
          <NotificationBell storeId={storeId} />
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-2 ps-2 border-s border-edge">
            <span className="size-9 rounded-full bg-primary-soft text-primary grid place-items-center text-[13px] font-bold">{(me?.name || "ک")[0]}</span>
            <span className="text-[13px] font-bold tnum hidden md:inline">{me?.name || faDigits(me?.phone ?? "")}</span>
          </div>
          <Button variant="ghost" size="sm" aria-label="خروج" onClick={logout} className="hidden sm:inline-flex"><LogOut className="size-4" /></Button>
        </div>
      </header>

      <main key={path} className="page-in px-3 sm:px-4 lg:px-8 pt-5 sm:pt-7 pb-28 lg:pb-10 max-w-[1440px]">{children}</main>

      {/* Mobile/tablet: bottom tab bar (4 primary destinations + more) */}
      <nav className="lg:hidden fixed inset-x-3 bottom-3 z-30 glass-strong rounded-[26px] px-1.5 pt-1.5 pb-safe" aria-label="منوی اصلی">
        <div className="grid grid-cols-5">
          {items.filter((i) => i.tab).map((it) => {
            const active = isActive(it.href, it.exact);
            return (
              <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
                className={cn("flex flex-col items-center justify-center gap-0.5 h-14 rounded-2xl text-[11px] font-bold transition", active ? "text-fg" : "text-muted")}>
                <span className={cn("grid place-items-center h-8 w-12 rounded-full transition", active && "bg-primary-soft text-primary")}><it.icon className="size-[19px]" aria-hidden /></span>
                {it.short}
              </Link>
            );
          })}
          <button onClick={() => setMore(true)} aria-expanded={more}
            className={cn("flex flex-col items-center justify-center gap-0.5 h-14 rounded-2xl text-[11px] font-bold cursor-pointer", moreActive ? "text-fg" : "text-muted")}>
            <span className={cn("grid place-items-center h-8 w-12 rounded-full", moreActive && "bg-primary-soft text-primary")}><Menu className="size-[19px]" aria-hidden /></span>
            بیشتر
          </button>
        </div>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title="منو">
        <div className="flex flex-col gap-4">
          <StoreSwitcher storeId={storeId} />
          <div className="grid grid-cols-2 gap-2">
            {[...items.filter((i) => !i.tab), ...secondary].map((it) => {
              const active = isActive(it.href, (it as any).exact);
              return (
                <Link key={it.href} href={it.href}
                  className={cn("flex flex-col gap-2 p-3.5 rounded-2xl text-[14px] font-bold transition", active ? "bg-primary-soft text-primary" : "bg-subtle hover:bg-glass-strong")}>
                  <it.icon className={cn("size-5", active ? "text-primary" : "text-muted")} aria-hidden />
                  <span className="flex items-center gap-1.5">{it.label}{(it as any).badge}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-subtle">
            <span className="size-10 rounded-full bg-primary-soft text-primary grid place-items-center font-bold">{(me?.name || "ک")[0]}</span>
            <span className="flex-1 min-w-0"><span className="block font-bold truncate">{me?.name || "کاربر"}</span><span className="block text-[12px] text-muted tnum">{me?.phone}</span></span>
            <Button variant="secondary" size="sm" icon={<LogOut className="size-4" />} onClick={logout}>خروج</Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
