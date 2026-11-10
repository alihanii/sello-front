"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, ArrowDown, ArrowUp, BadgeCheck, CheckCircle2, ExternalLink, Globe, ImagePlus, MessageCircle, Plus,
  RefreshCw, Trash2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api, mediaUrl } from "@/lib/api";
import { faDigits, faNum, jDateTime } from "@/lib/format";
import { storeQueries, useStoreId } from "@/lib/hooks";
import { copyText } from "@/lib/orders";
import {
  Button, Card, CardHeader, Chip, Field, Input, NumberInput, PageHeader, Select, Spinner, Switch, Tabs, Textarea, cn,
} from "@/components/ui/primitives";
import { SettingsSkeleton } from "@/components/ui/skeletons";

type Banner = { image_url: string; mobile_image_url: string; title: string; subtitle: string; link: string; button: string };
type Badge = { kind: string; title: string; href: string; img: string; code?: string };
type Cfg = {
  title: string; tagline: string; logo_url: string;
  palette: { preset: string; primary: string; accent: string };
  banners: Banner[];
  about: { title: string; text: string; image_url: string };
  contact: Record<string, string>;
  badges: Badge[];
  chat: { enabled: boolean; greeting: string; position: string };
  seo: { title: string; description: string; keywords: string };
  shipping: { fee_toman: number; free_over_toman: number; note: string };
  home: { show_categories: boolean; show_new: boolean; show_sale: boolean };
};
type Draft = { enabled: boolean; subdomain: string; custom_domain: string; config: Cfg };

const TABS = [
  { value: "address", label: "آدرس سایت" },
  { value: "look", label: "ظاهر و بنر" },
  { value: "about", label: "درباره و تماس" },
  { value: "footer", label: "نمادهای فوتر" },
  { value: "chat", label: "چت سایت" },
  { value: "seo", label: "ارسال و سئو" },
] as const;
type Tab = (typeof TABS)[number]["value"];

/** Ready palettes for the 60/30/10 rule: ivory base (60%, fixed), primary for the frame (30%: header, footer, menu)
 * and accent for the main action and highlights (10%). Each primary passes 4.5:1 with white text. */
/** White or near-black text, whichever reads better on a colour (same rule as the storefront). */
function onColor(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#fff";
  const n = parseInt(m[1], 16);
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return 1.05 / (L + 0.05) >= (L + 0.05) / 0.0137 ? "#fff" : "#1c1f1b";
}

const PRESETS = [
  { key: "emerald", label: "زمردی", primary: "#173d35", accent: "#c6a66b" },
  { key: "navy", label: "سرمه‌ای", primary: "#1e3a8a", accent: "#f59e0b" },
  { key: "plum", label: "آلبالویی", primary: "#7a1f3d", accent: "#d4a373" },
  { key: "charcoal", label: "ذغالی", primary: "#27272a", accent: "#e11d48" },
  { key: "ocean", label: "اقیانوسی", primary: "#0e7490", accent: "#f97316" },
  { key: "violet", label: "بنفش", primary: "#5b21b6", accent: "#10b981" },
];

const IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];

function useUpload() {
  const sid = useStoreId();
  return async (file: File): Promise<string | null> => {
    if (!IMG_TYPES.includes(file.type)) { toast.error("عکس باید JPG، PNG یا WEBP باشد."); return null; }
    if (file.size > 5 * 1024 * 1024) { toast.error("حجم عکس حداکثر ۵ مگابایت است."); return null; }
    const body = new FormData();
    body.append("files", file);
    try {
      const { urls } = await api<{ urls: string[] }>(`/stores/${sid}/uploads`, { method: "POST", body });
      return urls[0];
    } catch (e: any) { toast.error(e.message); return null; }
  };
}

/** An image slot: click to upload, preview, remove. `ratio` is the aspect the site shows it at. */
function ImageSlot({ value, onChange, label, ratio = "aspect-[8/3]", hint }: { value: string; onChange: (v: string) => void; label: string; ratio?: string; hint?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUpload();
  const [busy, setBusy] = useState(false);
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    const url = await upload(f);
    setBusy(false);
    if (input.current) input.current.value = "";
    if (url) onChange(url);
  };
  return (
    <div>
      <button type="button" onClick={() => input.current?.click()} aria-label={label}
        className={cn("relative w-full rounded-card bg-subtle border border-dashed border-edge overflow-hidden grid place-items-center cursor-pointer hover:border-primary transition", ratio)}>
        {value ? <img src={mediaUrl(value)} alt="" className="absolute inset-0 size-full object-cover" />
          : <span className="flex flex-col items-center gap-1 text-muted text-[13px]"><ImagePlus className="size-6" />{label}</span>}
        {busy && <span className="absolute inset-0 bg-black/30 grid place-items-center"><Spinner className="text-white" /></span>}
      </button>
      <div className="flex items-center justify-between gap-2 mt-1.5">
        <span className="text-[12px] text-muted">{hint}</span>
        {value && <Button type="button" size="sm" variant="ghost" className="text-danger" icon={<Trash2 className="size-4" />} onClick={() => onChange("")}>حذف</Button>}
      </div>
      <input ref={input} type="file" accept={IMG_TYPES.join(",")} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

function Row({ title, text, children }: { title: string; text?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 text-[14px]">
      <span>{title}{text && <span className="block text-[12px] text-muted">{text}</span>}</span>{children}
    </label>
  );
}

/** What still blocks a working site, in the order the seller should fix it. */
function Checklist({ s, d, sid }: { s: any; d: Draft; sid: number }) {
  const items = [
    { ok: !!(d.subdomain || d.custom_domain), text: "آدرس سایت انتخاب شده", fix: null },
    { ok: s.products > 0, text: s.products > 0 ? `${faNum(s.products)} محصول آماده روی سایت` : "هنوز محصول آماده‌ای نداری", fix: <Link className="text-primary font-bold" href={`/app/s/${sid}/products/new`}>افزودن محصول</Link> },
    { ok: s.payment_ready, text: s.payment_ready ? "روش پرداخت (کارت یا لینک) تنظیم شده" : "روش پرداخت تنظیم نشده؛ مشتری نمی‌تواند سفارش بدهد", fix: <Link className="text-primary font-bold" href={`/app/s/${sid}/orders?tab=settings`}>تنظیم پرداخت</Link> },
    { ok: s.assistant_enabled || !d.config.chat.enabled, text: s.assistant_enabled ? "دستیار چت روشن است" : "برای چت سایت، دستیار AI چت را روشن کن", fix: <Link className="text-primary font-bold" href={`/app/s/${sid}/chat?tab=settings`}>AI چت</Link> },
  ];
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it.text} className="flex items-start gap-2 text-[13px]">
          {it.ok ? <CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" /> : <AlertTriangle className="size-4 text-warning mt-0.5 shrink-0" />}
          <span className="flex-1">{it.text}</span>{!it.ok && it.fix}
        </li>
      ))}
    </ul>
  );
}

function AddressTab({ s, d, set, sid }: { s: any; d: Draft; set: (f: (d: Draft) => Draft) => void; sid: number }) {
  const qc = useQueryClient();
  const check = useMutation({
    mutationFn: () => api(`/stores/${sid}/site/check-domain`, { method: "POST" }),
    onSuccess: (r: any) => { qc.setQueryData(["site", sid], r); (r.domain_status === "active" ? toast.success : toast.warning)(r.message); },
    onError: (e: any) => toast.error(e.message),
  });
  const root = s.root_domain || "localhost";
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <Card className="p-5 space-y-5">
        <Row title="سایت روشن باشد" text="خاموش که باشد، کسی سایت را نمی‌بیند."><Switch checked={d.enabled} onChange={(v) => set((x) => ({ ...x, enabled: v }))} /></Row>
        <Field label="آدرس روی دامنهٔ ما" hint="فقط حروف انگلیسی کوچک، عدد و خط تیره." >
          <div className="flex items-stretch gap-0" dir="ltr">
            <Input className="rounded-e-none text-left" placeholder={s.suggested_subdomain} value={d.subdomain}
              onChange={(e) => set((x) => ({ ...x, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} />
            <span className="px-3 grid place-items-center rounded-e-control border border-s-0 border-control-border bg-subtle text-[13px] text-muted whitespace-nowrap">.{root}</span>
          </div>
        </Field>
        <div className="border-t border-edge pt-5 space-y-3">
          <Field label="دامنهٔ خودت (اختیاری)" hint="مثل myshop.ir؛ بدون www و https.">
            <Input dir="ltr" className="text-left" placeholder="myshop.ir" value={d.custom_domain}
              onChange={(e) => set((x) => ({ ...x, custom_domain: e.target.value.trim().toLowerCase() }))} />
          </Field>
          {s.custom_domain && (
            <div className="rounded-card bg-subtle p-4 text-[13px] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <b>وضعیت دامنه</b>
                <Chip tone={s.domain_status === "active" ? "success" : "warning"}>{s.domain_status === "active" ? "وصل است" : "منتظر تنظیم DNS"}</Chip>
              </div>
              <p className="text-muted">در پنل دامنه (مثل ایرنیک یا کلودفلر) این دو رکورد را بساز:</p>
              <div dir="ltr" className="font-mono text-[12px] bg-control border border-control-border rounded-control p-3 space-y-1">
                <div>A&nbsp;&nbsp;&nbsp;&nbsp;@&nbsp;&nbsp;&nbsp;→ {s.server_ip || "IP سرور (از پشتیبانی بپرس)"}</div>
                <div>CNAME www → {s.custom_domain}</div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-muted">{s.domain_checked_at ? `آخرین بررسی ${jDateTime(s.domain_checked_at)}` : "هنوز بررسی نشده"}</span>
                <Button type="button" size="sm" variant="secondary" icon={<RefreshCw className="size-4" />} loading={check.isPending} onClick={() => check.mutate()}>بررسی</Button>
              </div>
            </div>
          )}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-extrabold text-[15px] mb-3">برای شروع فروش</h3>
        <Checklist s={s} d={d} sid={sid} />
        <p className="text-[12px] text-muted mt-4 leading-6">سفارش‌های سایت با برچسب «وبسایت» در <Link className="text-primary font-bold" href={`/app/s/${sid}/orders`}>سفارشات</Link> می‌آیند و مثل فاکتور، مشتری کارت‌به‌کارت می‌کند و فیش می‌فرستد.</p>
      </Card>
    </div>
  );
}

function LookTab({ d, set, store }: { d: Draft; set: (f: (d: Draft) => Draft) => void; store: any }) {
  const c = d.config;
  const cfg = (f: (c: Cfg) => Cfg) => set((x) => ({ ...x, config: f(x.config) }));
  const banners = c.banners;
  const setBanner = (i: number, b: Partial<Banner>) => cfg((c) => ({ ...c, banners: c.banners.map((x, j) => (j === i ? { ...x, ...b } : x)) }));
  const move = (i: number, by: number) => cfg((c) => {
    const list = [...c.banners];
    const [it] = list.splice(i, 1);
    list.splice(i + by, 0, it);
    return { ...c, banners: list };
  });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Card className="p-5 space-y-4">
          <Field label="نام سایت" hint={`خالی بماند، «${store.name}» نوشته می‌شود.`}><Input value={c.title} maxLength={80} placeholder={store.name} onChange={(e) => cfg((c) => ({ ...c, title: e.target.value }))} /></Field>
          <Field label="شعار کوتاه" hint="زیر نام، در صفحهٔ اول. مثلاً «هودی با طرح خودت، ارسال سراسر ایران»."><Input value={c.tagline} maxLength={160} onChange={(e) => cfg((c) => ({ ...c, tagline: e.target.value }))} /></Field>
          <Field label="لوگو" hint="خالی بماند، لوگوی فروشگاه استفاده می‌شود.">
            <div className="w-28"><ImageSlot ratio="aspect-square" label="لوگو" value={c.logo_url} onChange={(v) => cfg((c) => ({ ...c, logo_url: v }))} /></div>
          </Field>
        </Card>
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="font-extrabold text-[15px]">پالت رنگ</h3>
            <p className="text-[12px] text-muted mt-1 leading-6">سایت با قاعدهٔ ۶۰/۳۰/۱۰ رنگ می‌گیرد: ۶۰٪ زمینهٔ عاجی و کارت‌های سفید، ۳۰٪ رنگ ساختاری و ۱۰٪ رنگ تأکیدی.</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PRESETS.map((p) => (
              <button type="button" key={p.key} onClick={() => cfg((c) => ({ ...c, palette: { preset: p.key, primary: p.primary, accent: p.accent } }))}
                className={cn("rounded-card border p-2 flex flex-col items-center gap-1.5 cursor-pointer transition text-[12px]",
                  c.palette.preset === p.key ? "border-primary ring-2 ring-primary/20" : "border-edge hover:border-primary/40")}>
                <span className="flex"><i className="size-6 rounded-full" style={{ background: p.primary }} /><i className="size-6 rounded-full -ms-2 ring-2 ring-[var(--glass)]" style={{ background: p.accent }} /></span>
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["primary", "accent"] as const).map((k) => (
              <Field key={k} label={k === "primary" ? "رنگ ساختاری ۳۰٪" : "رنگ تأکیدی ۱۰٪"} hint={k === "primary" ? "هدر، فوتر و منوی فعال" : "دکمهٔ افزودن به سبد و پرداخت، تخفیف‌ها"}>
                <div className="flex items-center gap-2">
                  <input type="color" aria-label={k} value={c.palette[k]} onChange={(e) => cfg((c) => ({ ...c, palette: { ...c.palette, preset: "custom", [k]: e.target.value } }))}
                    className="h-11 w-12 rounded-control border border-control-border bg-control cursor-pointer p-1" />
                  <Input dir="ltr" className="text-left font-mono" value={c.palette[k]} maxLength={7}
                    onChange={(e) => cfg((c) => ({ ...c, palette: { ...c.palette, preset: "custom", [k]: e.target.value } }))} />
                </div>
              </Field>
            ))}
          </div>
          {/* The share of each colour, then a small page in the chosen colours. */}
          <div className="flex h-2.5 rounded-full overflow-hidden" aria-hidden>
            <i className="basis-[60%] bg-[#f8f7f3] border border-edge rounded-s-full" /><i className="basis-[30%]" style={{ background: c.palette.primary }} /><i className="basis-[10%]" style={{ background: c.palette.accent }} />
          </div>
          <div className="rounded-card border border-edge overflow-hidden text-[13px] bg-[#f8f7f3]" aria-hidden>
            <div className="px-4 py-3 text-white font-bold flex justify-between" style={{ background: c.palette.primary }}>
              <span>{c.title || store.name}</span>
              <span className="flex gap-1 text-[12px]"><i className="not-italic rounded-md px-2 py-0.5" style={{ background: `color-mix(in oklab, ${c.palette.primary}, white 13%)` }}>محصولات</i><i className="not-italic px-2 py-0.5 opacity-75">تماس</i></span>
            </div>
            <div className="p-4">
              <div className="rounded-lg bg-white border border-[#e7e5de] p-3 text-[#252923] flex items-center justify-between gap-3">
                <span className="flex flex-col"><span>هودی نمونه</span><b>۴۵۰٬۰۰۰ تومان</b></span>
                <span className="rounded-lg px-3 py-2 text-[12px] font-bold" style={{ background: c.palette.accent, color: onColor(c.palette.accent) }}>افزودن به سبد</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="بنرهای صفحهٔ اول" subtitle="تا ۸ بنر؛ به ترتیب نمایش. اندازهٔ پیشنهادی ۱۶۰۰×۶۰۰ و برای موبایل ۸۰۰×۸۰۰."
          action={banners.length < 8 && <Button type="button" size="sm" variant="secondary" icon={<Plus className="size-4" />}
            onClick={() => cfg((c) => ({ ...c, banners: [...c.banners, { image_url: "", mobile_image_url: "", title: "", subtitle: "", link: "", button: "" }] }))}>بنر تازه</Button>} />
        <div className="px-4 sm:px-5 pb-5 space-y-4">
          {!banners.length && <p className="text-[13px] text-muted">بنری نداری؛ بدون بنر، صفحهٔ اول با نام و شعار سایت شروع می‌شود.</p>}
          {banners.map((b, i) => (
            <div key={i} className="rounded-card border border-edge p-4 grid grid-cols-1 md:grid-cols-[1fr_160px_1fr] gap-4">
              <ImageSlot label="عکس دسکتاپ" value={b.image_url} onChange={(v) => setBanner(i, { image_url: v })} hint="۱۶۰۰×۶۰۰" />
              <ImageSlot ratio="aspect-square" label="موبایل (اختیاری)" value={b.mobile_image_url} onChange={(v) => setBanner(i, { mobile_image_url: v })} hint="۸۰۰×۸۰۰" />
              <div className="space-y-3">
                <Input placeholder="عنوان (اختیاری)" maxLength={120} value={b.title} onChange={(e) => setBanner(i, { title: e.target.value })} />
                <Input placeholder="زیرعنوان (اختیاری)" maxLength={240} value={b.subtitle} onChange={(e) => setBanner(i, { subtitle: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input dir="ltr" className="text-left" placeholder="/products?sale=1" value={b.link} onChange={(e) => setBanner(i, { link: e.target.value })} />
                  <Input placeholder="متن دکمه" maxLength={40} value={b.button} onChange={(e) => setBanner(i, { button: e.target.value })} />
                </div>
                <div className="flex gap-1 justify-end">
                  <Button type="button" size="sm" variant="ghost" aria-label="بالاتر" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
                  <Button type="button" size="sm" variant="ghost" aria-label="پایین‌تر" disabled={i === banners.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
                  <Button type="button" size="sm" variant="ghost" className="text-danger" icon={<Trash2 className="size-4" />} onClick={() => cfg((c) => ({ ...c, banners: c.banners.filter((_, j) => j !== i) }))}>حذف</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5 space-y-4">
        <h3 className="font-extrabold text-[15px]">بخش‌های صفحهٔ اول</h3>
        <Row title="دسته‌بندی‌ها"><Switch checked={c.home.show_categories} onChange={(v) => cfg((c) => ({ ...c, home: { ...c.home, show_categories: v } }))} /></Row>
        <Row title="تخفیف‌دارها" text="محصولاتی که قیمت قبل از تخفیف دارند."><Switch checked={c.home.show_sale} onChange={(v) => cfg((c) => ({ ...c, home: { ...c.home, show_sale: v } }))} /></Row>
        <Row title="تازه‌ترین محصولات"><Switch checked={c.home.show_new} onChange={(v) => cfg((c) => ({ ...c, home: { ...c.home, show_new: v } }))} /></Row>
      </Card>
    </div>
  );
}

const CONTACT_FIELDS: { key: string; label: string; ltr?: boolean; placeholder?: string }[] = [
  { key: "phone", label: "تلفن", ltr: true, placeholder: "021..." },
  { key: "email", label: "ایمیل", ltr: true, placeholder: "info@myshop.ir" },
  { key: "instagram", label: "اینستاگرام", ltr: true, placeholder: "myshop" },
  { key: "telegram", label: "تلگرام", ltr: true, placeholder: "myshop" },
  { key: "whatsapp", label: "واتساپ", ltr: true, placeholder: "0912..." },
  { key: "hours", label: "ساعت پاسخگویی", placeholder: "شنبه تا پنجشنبه ۹ تا ۱۸" },
  { key: "map_url", label: "لینک نقشه", ltr: true, placeholder: "https://nshn.ir/..." },
];

function AboutTab({ d, set }: { d: Draft; set: (f: (d: Draft) => Draft) => void }) {
  const c = d.config;
  const cfg = (f: (c: Cfg) => Cfg) => set((x) => ({ ...x, config: f(x.config) }));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <Card className="p-5 space-y-4">
        <h3 className="font-extrabold text-[15px]">درباره ما</h3>
        <Field label="عنوان"><Input value={c.about.title} maxLength={80} onChange={(e) => cfg((c) => ({ ...c, about: { ...c.about, title: e.target.value } }))} /></Field>
        <Field label="متن" hint="از کجا شروع کردی، چه چیزی می‌فروشی و چرا از تو بخرند. پاراگراف‌ها را با خط خالی جدا کن.">
          <Textarea rows={8} maxLength={8000} value={c.about.text} onChange={(e) => cfg((c) => ({ ...c, about: { ...c.about, text: e.target.value } }))} /></Field>
        <Field label="عکس (اختیاری)"><ImageSlot ratio="aspect-video" label="عکس فروشگاه یا تیم" value={c.about.image_url} onChange={(v) => cfg((c) => ({ ...c, about: { ...c.about, image_url: v } }))} /></Field>
      </Card>
      <Card className="p-5 space-y-4">
        <h3 className="font-extrabold text-[15px]">ارتباط با ما</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CONTACT_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              <Input dir={f.ltr ? "ltr" : undefined} className={f.ltr ? "text-left" : ""} placeholder={f.placeholder} value={c.contact[f.key] ?? ""}
                onChange={(e) => cfg((c) => ({ ...c, contact: { ...c.contact, [f.key]: e.target.value } }))} />
            </Field>
          ))}
        </div>
        <Field label="آدرس"><Textarea rows={2} value={c.contact.address ?? ""} onChange={(e) => cfg((c) => ({ ...c, contact: { ...c.contact, address: e.target.value } }))} /></Field>
      </Card>
    </div>
  );
}

function FooterTab({ d, set }: { d: Draft; set: (f: (d: Draft) => Draft) => void }) {
  const badges = d.config.badges;
  const setBadges = (f: (b: Badge[]) => Badge[]) => set((x) => ({ ...x, config: { ...x.config, badges: f(x.config.badges) } }));
  return (
    <Card>
      <CardHeader title="نمادهای فوتر" subtitle="اینماد، ساماندهی یا هر نماد اعتماد دیگر. کدی که سایت صادرکننده می‌دهد را کامل کپی کن؛ فقط لینک و عکسش برداشته می‌شود."
        action={badges.length < 6 && <Button type="button" size="sm" variant="secondary" icon={<Plus className="size-4" />}
          onClick={() => setBadges((b) => [...b, { kind: "enamad", title: "", href: "", img: "", code: "" }])}>نماد تازه</Button>} />
      <div className="px-4 sm:px-5 pb-5 space-y-4">
        {!badges.length && <p className="text-[13px] text-muted">نمادی اضافه نکرده‌ای.</p>}
        {badges.map((b, i) => (
          <div key={i} className="rounded-card border border-edge p-4 grid grid-cols-1 md:grid-cols-[180px_1fr_96px] gap-3 items-start">
            <div className="space-y-2">
              <Select value={b.kind} onChange={(e) => setBadges((l) => l.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)))}>
                <option value="enamad">اینماد</option><option value="samandehi">ساماندهی</option><option value="custom">نماد دیگر</option>
              </Select>
              {b.kind === "custom" && <Input placeholder="نام نماد" value={b.title} onChange={(e) => setBadges((l) => l.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />}
            </div>
            <Textarea dir="ltr" rows={3} className="text-left font-mono text-[12px]" placeholder={"<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=...'>..."}
              value={b.code ?? (b.href ? b.href : "")} onChange={(e) => setBadges((l) => l.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} />
            <div className="flex md:flex-col items-center gap-2">
              {b.img ? <img src={b.img} alt={b.title} className="size-20 object-contain rounded-control bg-white border border-edge" referrerPolicy="origin" /> : <span className="size-20 rounded-control bg-subtle grid place-items-center"><BadgeCheck className="size-6 text-muted" /></span>}
              <Button type="button" size="sm" variant="ghost" className="text-danger" icon={<Trash2 className="size-4" />} onClick={() => setBadges((l) => l.filter((_, j) => j !== i))}>حذف</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ChatTab({ s, d, set, sid }: { s: any; d: Draft; set: (f: (d: Draft) => Draft) => void; sid: number }) {
  const ch = d.config.chat;
  const cfg = (v: Partial<Cfg["chat"]>) => set((x) => ({ ...x, config: { ...x.config, chat: { ...x.config.chat, ...v } } }));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <Card className="p-5 space-y-4">
        <Row title="دکمهٔ چت روی سایت" text="پیام‌ها در «AI چت › گفتگوها» با برچسب سایت می‌آیند و همان دستیار جواب می‌دهد؛ هر وقت خواستی خودت جواب بده.">
          <Switch checked={ch.enabled} onChange={(v) => cfg({ enabled: v })} /></Row>
        <Field label="پیام خوشامد"><Textarea rows={2} maxLength={300} value={ch.greeting} onChange={(e) => cfg({ greeting: e.target.value })} /></Field>
        <Field label="جای دکمه">
          <Select value={ch.position} onChange={(e) => cfg({ position: e.target.value })}><option value="left">پایین چپ</option><option value="right">پایین راست</option></Select>
        </Field>
      </Card>
      <Card className="p-5 space-y-3 text-[13px]">
        <div className="flex items-center gap-2 font-bold"><MessageCircle className="size-4 text-primary" />وضعیت دستیار</div>
        {s.assistant_enabled
          ? <p className="text-muted">دستیار روشن است و به پیام‌های سایت هم جواب می‌دهد.</p>
          : <p className="text-warning">دستیار AI چت خاموش است؛ تا روشنش نکنی دکمهٔ چت روی سایت دیده نمی‌شود.</p>}
        <Link href={`/app/s/${sid}/chat?tab=settings`}><Button type="button" size="sm" variant="secondary">تنظیمات AI چت</Button></Link>
      </Card>
    </div>
  );
}

function SeoTab({ d, set, url, store }: { d: Draft; set: (f: (d: Draft) => Draft) => void; url: string; store: any }) {
  const c = d.config;
  const cfg = (f: (c: Cfg) => Cfg) => set((x) => ({ ...x, config: f(x.config) }));
  const title = c.seo.title || c.title || store.name;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <Card className="p-5 space-y-4">
        <h3 className="font-extrabold text-[15px]">ارسال</h3>
        <Field label="هزینهٔ ارسال (تومان)" hint="صفر یعنی رایگان."><NumberInput value={c.shipping.fee_toman} onChange={(v) => cfg((c) => ({ ...c, shipping: { ...c.shipping, fee_toman: v } }))} /></Field>
        <Field label="ارسال رایگان از خرید بالای (تومان)" hint="خالی یعنی همیشه هزینهٔ ارسال گرفته شود."><NumberInput value={c.shipping.free_over_toman} onChange={(v) => cfg((c) => ({ ...c, shipping: { ...c.shipping, free_over_toman: v } }))} /></Field>
        <Field label="توضیح ارسال" hint="مثلاً «ارسال با پست پیشتاز، ۲ تا ۴ روز کاری»."><Input maxLength={300} value={c.shipping.note} onChange={(e) => cfg((c) => ({ ...c, shipping: { ...c.shipping, note: e.target.value } }))} /></Field>
      </Card>
      <Card className="p-5 space-y-4">
        <h3 className="font-extrabold text-[15px]">سئوی صفحهٔ اول</h3>
        <Field label="عنوان" hint={`${faDigits(title.length)} از ۶۰ حرف پیشنهادی`}><Input maxLength={70} placeholder={c.title || store.name} value={c.seo.title} onChange={(e) => cfg((c) => ({ ...c, seo: { ...c.seo, title: e.target.value } }))} /></Field>
        <Field label="توضیحات" hint={`${faDigits(c.seo.description.length)} از ۱۶۰ حرف پیشنهادی`}><Textarea rows={3} maxLength={320} value={c.seo.description} onChange={(e) => cfg((c) => ({ ...c, seo: { ...c.seo, description: e.target.value } }))} /></Field>
        <Field label="کلمات کلیدی" hint="با ویرگول جدا کن."><Input maxLength={300} value={c.seo.keywords} onChange={(e) => cfg((c) => ({ ...c, seo: { ...c.seo, keywords: e.target.value } }))} /></Field>
        <div className="rounded-card border border-edge p-4 bg-white text-[#202124]" aria-label="پیش‌نمایش در گوگل">
          <div className="text-[12px] text-[#4d5156]" dir="ltr">{url || "https://..."}</div>
          <div className="text-[18px] text-[#1a0dab] leading-7 truncate">{title}</div>
          <div className="text-[13px] text-[#4d5156] line-clamp-2">{c.seo.description || c.tagline || "توضیحی نوشته نشده."}</div>
        </div>
        <p className="text-[12px] text-muted">صفحهٔ هر محصول عنوان، توضیح، عکس و برچسب‌های ترب را خودکار از خود محصول می‌گیرد. نقشهٔ سایت: <span dir="ltr">{url ? `${url}/sitemap.xml` : "/sitemap.xml"}</span></p>
      </Card>
    </div>
  );
}

const fromServer = (s: any): Draft => ({
  enabled: s.enabled, subdomain: s.subdomain, custom_domain: s.custom_domain,
  config: { ...s.config, badges: (s.config.badges ?? []).map((b: Badge) => ({ ...b, code: b.href })) },
});

export default function MySite() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const router = useRouter();
  const path = usePathname();
  const tab = (useSearchParams().get("tab") as Tab) || "address";
  const { data: s } = useQuery(storeQueries.site(sid));
  const [d, setD] = useState<Draft | null>(null);
  const [base, setBase] = useState("");
  useEffect(() => {
    if (s) { const v = fromServer(s); setD(v); setBase(JSON.stringify(v)); }
  }, [s]);
  const dirty = useMemo(() => !!d && JSON.stringify(d) !== base, [d, base]);
  const save = useMutation({
    mutationFn: (v: Draft) => api(`/stores/${sid}/site`, { method: "PUT", json: {
      enabled: v.enabled, subdomain: v.subdomain, custom_domain: v.custom_domain, ...v.config,
      // A badge whose code wasn't changed is sent back as its saved link and image.
      badges: v.config.badges.map((b) => (b.code && b.code !== b.href ? { kind: b.kind, title: b.title, code: b.code } : { kind: b.kind, title: b.title, href: b.href, img: b.img })),
    } }),
    onSuccess: (r: any) => { qc.setQueryData(["site", sid], r); toast.success("ذخیره شد؛ تا یک دقیقه روی سایت دیده می‌شود."); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!s || !d) return <SettingsSkeleton />;
  const set = (f: (d: Draft) => Draft) => setD((x) => (x ? f(x) : x));
  const go = (t: Tab) => router.replace(`${path}?tab=${t}`, { scroll: false });
  return (
    <div className="pb-24 lg:pb-0">
      <PageHeader title="وبسایت ساز"
        subtitle={s.url ? <span className="inline-flex items-center gap-2 flex-wrap"><Chip tone={s.enabled ? "success" : "neutral"}>{s.enabled ? "روشن" : "خاموش"}</Chip>
          <button type="button" dir="ltr" className="text-primary font-bold cursor-pointer" onClick={() => copyText(s.url, "آدرس کپی شد")}>{s.url.replace(/^https?:\/\//, "")}</button></span>
          : "سایت فروشگاهی خودت با سبد خرید، ثبت سفارش و چت؛ سفارش‌ها می‌آیند توی سفارشات."}
        actions={<>
          {s.url && s.enabled && <a href={s.url} target="_blank" rel="noopener"><Button type="button" variant="secondary" icon={<ExternalLink className="size-4" />}>دیدن سایت</Button></a>}
          <Button type="button" loading={save.isPending} disabled={!dirty} onClick={() => save.mutate(d)} icon={<Globe className="size-4" />}>ذخیره</Button>
        </>} />
      <div className="mb-5"><Tabs value={tab} onChange={go} items={TABS as any} /></div>
      {tab === "address" && <AddressTab s={s} d={d} set={set} sid={sid} />}
      {tab === "look" && <LookTab d={d} set={set} store={s.store} />}
      {tab === "about" && <AboutTab d={d} set={set} />}
      {tab === "footer" && <FooterTab d={d} set={set} />}
      {tab === "chat" && <ChatTab s={s} d={d} set={set} sid={sid} />}
      {tab === "seo" && <SeoTab d={d} set={set} url={s.url} store={s.store} />}
      {/* On phones the save button sits above the tab bar, so it's never scrolled away from the change. */}
      {dirty && (
        <div className="lg:hidden fixed inset-x-3 bottom-24 z-30 glass-strong rounded-card p-3 flex items-center justify-between gap-3 fade-in">
          <span className="text-[13px] font-bold">تغییرات ذخیره نشده</span>
          <Button type="button" size="sm" loading={save.isPending} onClick={() => save.mutate(d)}>ذخیره</Button>
        </div>
      )}
    </div>
  );
}
