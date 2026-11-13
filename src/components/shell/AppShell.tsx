"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity, CalendarDays, ChevronDown, CreditCard, LayoutDashboard, LogOut, Menu, MessageCircle, Moon, Package,
  Plug, Settings, Shield, Store, Sun,
  ShoppingBag,
  Globe, KeyRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, logout as signOut, mediaUrl } from "@/lib/api";
import { faDigits, faNum } from "@/lib/format";
import { prefetchStorePage, useMe, useOperationsStream, useStores } from "@/lib/hooks";
import { Button, Dialog, Field, Input, Sheet, cn } from "@/components/ui/primitives";
import { toast } from "sonner";
import { NotificationBell } from "./Notifications";
import { Logo } from "./Brand";

export { Logo };

/** Days left on the seller's plan: amber in the last week, red once it has ended. */
function usePlan() {
  const { data } = useQuery({ queryKey: ["subscription"], queryFn: () => api<any>("/me/subscription"), staleTime: 5 * 60_000 });
  if (!data || data.status === "admin") return null;
  const ends = data.subscription?.ends_at ? new Date(data.subscription.ends_at).getTime() : 0;
  const days = ends ? Math.max(0, Math.ceil((ends - Date.now()) / 86_400_000)) : 0;
  const [title, note, action, tone] = data.status === "active"
    ? [`${faNum(days)} روز از پلن مانده`, data.subscription?.plan?.name ? `پلن ${data.subscription.plan.name}` : "", "تمدید یا تغییر پلن", days <= 7 ? "warn" : "ok"]
    : data.status === "free" ? ["حساب آزمایشی", "با خرید پلن همهٔ امکانات باز می‌شود.", "خرید پلن", "ok"]
    : data.status === "blocked" ? ["حساب غیرفعال است", "برای فعال‌سازی با پشتیبانی تماس بگیر.", "پلن و اشتراک", "bad"]
    : ["پلن تمام شده", "دستیار AI تا تمدید خاموش است.", "تمدید پلن", "bad"];
  return { title, note, action, tone: tone as "ok" | "warn" | "bad" };
}

function useTheme() {
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
  return { dark, toggle };
}

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label="تغییر تم">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

const TONE = {
  ok: "bg-subtle text-fg",
  warn: "bg-warning/15 text-warning",
  bad: "bg-danger/12 text-danger",
};

/** The seller's menu in the header: who is signed in, days left on the plan, dark mode and logout, in one dropdown. */
function AccountMenu({ me, onLogout }: { me: any; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const plan = usePlan();
  const { dark, toggle } = useTheme();
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  const name = me?.name || faDigits(me?.phone ?? "") || "کاربر";
  const alert = plan && plan.tone !== "ok";

  return (
    // Same anchoring as the notifications panel: full header width on phones, hanging under the button from sm up.
    <div className="sm:relative ps-1 sm:ps-2 sm:border-s border-edge" ref={box}>
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" aria-label="حساب کاربری"
        className="flex items-center gap-2 h-10 ps-1 pe-1 sm:pe-2 rounded-full hover:bg-subtle transition cursor-pointer">
        <span className="relative size-8 rounded-full bg-primary-soft text-primary grid place-items-center text-[13px] font-bold">
          {name[0]}
          {alert && <span className={cn("absolute -top-0.5 -end-0.5 size-3 rounded-full ring-2 ring-[var(--bg)]", plan.tone === "bad" ? "bg-danger" : "bg-warning")} aria-hidden />}
        </span>
        <span className="text-[13px] font-bold tnum hidden md:inline max-w-[140px] truncate">{name}</span>
        <ChevronDown className={cn("size-4 text-muted hidden sm:block transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <div role="menu" aria-label="حساب کاربری"
        className={cn("glass-strong [background:linear-gradient(var(--glass-strong),var(--glass-strong)),var(--bg)] absolute z-40 top-[calc(100%+8px)] inset-x-3 sm:inset-x-auto sm:top-12 sm:-end-2 sm:w-[300px] rounded-sheet p-2 origin-top sm:origin-top-left transition-all duration-200",
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1 pointer-events-none")}>
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="size-10 rounded-full bg-primary-soft text-primary grid place-items-center font-bold shrink-0">{name[0]}</span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-[14px] truncate">{me?.name || "کاربر"}</span>
            {me?.phone && <span className="block text-[12px] text-muted tnum">{faDigits(me.phone)}</span>}
          </span>
        </div>
        {plan && (
          <Link href="/app/billing" role="menuitem" className={cn("flex items-center gap-3 p-3 mt-1 rounded-2xl transition hover:opacity-90", TONE[plan.tone])}>
            <CreditCard className="size-5 shrink-0" aria-hidden />
            <span className="flex-1 min-w-0">
              <span className="block text-[14px] font-bold tnum">{plan.title}</span>
              {plan.note && <span className="block text-[12px] opacity-80 mt-0.5">{plan.note}</span>}
            </span>
            <span className="text-[12px] font-bold whitespace-nowrap opacity-90">{plan.action} ←</span>
          </Link>
        )}
        <div className="mt-1 flex flex-col">
          <button role="menuitemcheckbox" aria-checked={dark} onClick={toggle}
            className="flex items-center gap-3 h-11 px-3 rounded-2xl text-[14px] font-bold hover:bg-subtle transition cursor-pointer text-start">
            {dark ? <Sun className="size-[18px] text-muted" aria-hidden /> : <Moon className="size-[18px] text-muted" aria-hidden />}
            <span className="flex-1">حالت تاریک</span>
            <span className={cn("w-9 h-5 rounded-full p-0.5 transition-colors", dark ? "bg-primary" : "bg-subtle border border-edge")} aria-hidden>
              <span className={cn("block size-4 rounded-full bg-white shadow transition-transform", dark ? "-translate-x-4" : "translate-x-0")} />
            </span>
          </button>
          <button role="menuitem" onClick={() => { setOpen(false); setPw(true); }}
            className="flex items-center gap-3 h-11 px-3 rounded-2xl text-[14px] font-bold hover:bg-subtle transition cursor-pointer text-start">
            <KeyRound className="size-[18px] text-muted" aria-hidden />
            <span className="flex-1">{me?.has_password ? "تغییر رمز عبور" : "گذاشتن رمز عبور"}</span>
          </button>
          <button role="menuitem" onClick={onLogout}
            className="flex items-center gap-3 h-11 px-3 rounded-2xl text-[14px] font-bold text-danger hover:bg-danger/10 transition cursor-pointer text-start">
            <LogOut className="size-[18px]" aria-hidden />
            <span className="flex-1">خروج از حساب</span>
          </button>
        </div>
      </div>
      <PasswordDialog open={pw} onClose={() => setPw(false)} hasPassword={!!me?.has_password} phone={me?.phone ?? ""} />
    </div>
  );
}

/** Set or change the sign-in password. Other devices are signed out when it changes. */
function PasswordDialog({ open, onClose, hasPassword, phone }: { open: boolean; onClose: () => void; hasPassword: boolean; phone: string }) {
  const qc = useQueryClient();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setCurrent(""); setNext(""); } }, [open]);
  const save = async () => {
    setBusy(true);
    try {
      await api("/auth/password", { method: "POST", json: { password: next, current_password: current || undefined } });
      toast.success(hasPassword ? "رمز عوض شد؛ دستگاه‌های دیگر از حساب خارج شدند." : "رمز ذخیره شد؛ دفعهٔ بعد با شماره و رمز وارد شو.");
      qc.invalidateQueries({ queryKey: ["me"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title={hasPassword ? "تغییر رمز عبور" : "گذاشتن رمز عبور"}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <p className="text-[13px] text-muted">با رمز، بدون منتظر ماندن برای پیامک وارد می‌شوی. ورود با کد پیامکی هم همیشه هست.</p>
        <input type="text" name="username" autoComplete="username" value={phone} readOnly hidden />
        {hasPassword && (
          <Field label="رمز فعلی" hint="اگر یادت نیست: خارج شو، در صفحهٔ ورود «رمز را فراموش کرده‌ام» را بزن.">
            <Input dir="ltr" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className="text-left" />
          </Field>
        )}
        <Field label="رمز تازه" hint="دست‌کم ۸ نویسه">
          <Input dir="ltr" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className="text-left" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>انصراف</Button>
          <Button type="submit" loading={busy} disabled={next.length < 8}>ذخیره</Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Warms a page's data when the pointer/finger reaches its link, so it opens with content instead of a skeleton. */
function useWarm(storeId?: number) {
  const qc = useQueryClient();
  return (href: string) => { if (storeId) prefetchStorePage(qc, storeId, href); };
}

function NavItem({ href, icon: Icon, label, active, badge, storeId }: { href: string; icon: any; label: string; active: boolean; badge?: React.ReactNode; storeId?: number }) {
  const warm = useWarm(storeId);
  return (
    <Link
      href={href}
      onMouseEnter={() => warm(href)} onFocus={() => warm(href)} onTouchStart={() => warm(href)}
      className={cn(
        "group flex items-center gap-3 h-11 px-3 rounded-2xl text-[14px] font-bold transition-all",
        active ? "bg-nav-active text-fg shadow-[inset_-3px_0_0_var(--accent)]" : "text-muted hover:text-fg hover:bg-subtle",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("size-[18px]", active ? "text-accent" : "group-hover:text-fg")} aria-hidden />
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
      <button onClick={() => setOpen(!open)} className="w-full bg-subtle hover:bg-[color-mix(in_oklab,var(--fg)_12%,transparent)] transition rounded-2xl p-2.5 flex items-center gap-2.5 cursor-pointer text-start" aria-expanded={open}>
        {current?.logo_url ? <img src={mediaUrl(current.logo_url, 36)} alt="" className="size-9 rounded-xl object-cover" />
          : <span className="size-9 rounded-xl bg-primary/15 text-primary grid place-items-center"><Store className="size-4" /></span>}
        <span className="flex-1 min-w-0">
          <span className="block text-[11px] text-muted">فروشگاه</span>
          <span className="block font-bold text-[14px] truncate">{current?.name ?? "…"}</span>
        </span>
        <ChevronDown className="size-4 text-muted" />
      </button>
      {open && (
        // In the phone menu sheet the list opens in place under the button (the sheet scrolls); a floating list would be
        // clipped by the sheet's edge. In the desktop sidebar it floats over the nav.
        <div className="pop-in glass-strong mt-2 w-full rounded-card p-1.5 lg:absolute lg:z-30 lg:min-w-60">
          {stores?.map((s) => (
            <Link key={s.id} href={`/app/s/${s.id}`} onClick={() => setOpen(false)}
              className={cn("block px-3 py-3 lg:py-2 rounded-control text-[15px] lg:text-[14px] hover:bg-subtle", s.id === storeId && "font-bold text-primary")}>
              {s.name}
            </Link>
          ))}
          <Link href="/app/stores" onClick={() => setOpen(false)} className="block px-3 py-3 lg:py-2 rounded-control text-[13px] text-muted hover:bg-subtle border-t border-edge mt-1">
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
  const warm = useWarm(storeId);
  useEffect(() => setMore(false), [path]);

  const base = `/app/s/${storeId}`;
  const items = [
    { href: base, icon: LayoutDashboard, label: "داشبورد", short: "خانه", exact: true, tab: true },
    { href: `${base}/products`, icon: Package, label: "محصولات", short: "محصولات", tab: true },
    { href: `${base}/activity`, icon: Activity, label: "فعالیت‌ها و لاگ", short: "فعالیت"},
    { href: `${base}/calendar`, icon: CalendarDays, label: "تقویم" },
    { href: `${base}/orders`, icon: ShoppingBag, label: "سفارشات", tab: true, short: "سفارشات" },
    // Opened by the admin to a segment of sellers (admin › قابلیت‌ها).
    ...(me?.features?.site_builder ? [{ href: `${base}/site`, icon: Globe, label: "وبسایت ساز" }] : []),
    { href: `${base}/channels`, icon: Plug, label: "کانال‌ها" },
    { href: `${base}/chat`, icon: MessageCircle, label: "AI چت", short: "AI چت", tab: true },
  ];
  const secondary = [
    { href: `${base}/settings`, icon: Settings, label: "تنظیمات فروشگاه" },
    { href: "/app/billing", icon: CreditCard, label: "پلن و اشتراک", exact: true },
    ...(me?.role === "admin" ? [{ href: "/admin", icon: Shield, label: "پنل ادمین", exact: true }] : []),
  ];
  const isActive = (href: string, exact?: boolean) => (exact ? path === href : path.startsWith(href));
  const logout = async () => { await signOut(); router.push("/login"); };
  const moreActive = [...items.filter((i) => !i.tab), ...secondary].some((i) => isActive(i.href, (i as any).exact));

  return (
    <div className="min-h-dvh lg:ps-[292px]">
      {/* Desktop: floating glass sidebar */}
      <aside className="on-nav fixed inset-y-4 start-4 w-[268px] rounded-card p-4 hidden lg:flex flex-col gap-4 z-20">
        <div className="px-1 pt-1 shrink-0"><Logo /></div>
        <div className="shrink-0"><StoreSwitcher storeId={storeId} /></div>
        {/* The menu takes the space left and scrolls inside it when there are more items than fit (short screens, many features). */}
        <nav className="flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto overscroll-contain nav-scroll [&>*]:shrink-0" aria-label="منوی اصلی">
          {items.map((it) => <NavItem key={it.href} {...it} storeId={storeId} active={isActive(it.href, it.exact)} />)}
        </nav>
        <div className="shrink-0 flex flex-col gap-1 border-t border-edge pt-3">
          {secondary.map((it) => <NavItem key={it.href} {...it} storeId={storeId} active={isActive(it.href, it.exact)} />)}
        </div>
      </aside>

      <header className="sticky top-0 z-30 px-3 sm:px-4 lg:px-8 pt-3 lg:pt-4 max-w-[1440px] mx-auto">
        <div className="on-nav shadow-[var(--shadow)] rounded-2xl h-14 ps-2 pe-2 sm:ps-3 flex items-center gap-1.5 sm:gap-2">
          <Link href={base} className="lg:hidden ps-1 flex items-center" aria-label="داشبورد"><Logo className="text-[18px]" /></Link>
          <div className="flex-1" />
          <ActivityIndicator storeId={storeId} />
          <NotificationBell storeId={storeId} />
          <AccountMenu me={me} onLogout={logout} />
        </div>
      </header>

      <main key={path} className="page-in px-3 sm:px-4 lg:px-8 pt-5 sm:pt-7 pb-28 lg:pb-10 max-w-[1440px] mx-auto">{children}</main>

      {/* Mobile/tablet: bottom tab bar (4 primary destinations + more) */}
      <nav className="lg:hidden fixed inset-x-3 bottom-3 z-30 on-nav shadow-[var(--shadow)] rounded-sheet px-1.5 pt-1.5 pb-safe" aria-label="منوی اصلی">
        <div className="grid grid-cols-5">
          {items.filter((i) => i.tab).map((it) => {
            const active = isActive(it.href, it.exact);
            return (
              <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined} onTouchStart={() => warm(it.href)} onMouseEnter={() => warm(it.href)}
                className={cn("flex flex-col items-center justify-center gap-0.5 h-14 rounded-2xl text-[11px] font-bold transition", active ? "text-fg" : "text-muted")}>
                <span className={cn("grid place-items-center h-8 w-12 rounded-full transition", active && "bg-nav-active text-accent")}><it.icon className="size-[19px]" aria-hidden /></span>
                {it.short}
              </Link>
            );
          })}
          <button onClick={() => setMore(true)} aria-expanded={more}
            className={cn("flex flex-col items-center justify-center gap-0.5 h-14 rounded-2xl text-[11px] font-bold cursor-pointer", moreActive ? "text-fg" : "text-muted")}>
            <span className={cn("grid place-items-center h-8 w-12 rounded-full", moreActive && "bg-nav-active text-accent")}><Menu className="size-[19px]" aria-hidden /></span>
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
                <Link key={it.href} href={it.href} onTouchStart={() => warm(it.href)}
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
