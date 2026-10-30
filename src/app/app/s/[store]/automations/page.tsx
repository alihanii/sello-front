"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, ImagePlus, Link2, Play, Plus, Sparkles, Trash2, Workflow, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, mediaUrl } from "@/lib/api";
import { ago, faDigits, faNum, toman } from "@/lib/format";
import { useChannels, useStoreId } from "@/lib/hooks";
import { TRIGGERS } from "@/lib/meta";
import { ImageUploader } from "@/components/products/ImageUploader";
import { PlatformIcon } from "@/components/ui/status";
import { Button, Card, Chip, Dialog, EmptyState, Field, Input, NumberInput, PageHeader, Select, Switch, Tabs, Textarea, cn } from "@/components/ui/primitives";
import { AiSetupBanner } from "@/components/admin/AiKeyEditor";

const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const SOURCES: [string, string][] = [["manual", "دستی"], ["crawl", "کرال"], ["ai", "AI"]];
const RULE_TRIGGERS = Object.fromEntries(Object.entries(TRIGGERS).filter(([k]) => k !== "ai_content"));

function Toggle({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={cn("inline-flex items-center gap-2 px-3.5 h-10 rounded-full text-[13px] font-bold border cursor-pointer transition-all duration-200",
        on ? "bg-primary-soft text-primary border-primary/40" : "border-edge hover:border-primary/50 hover:bg-subtle", className)}>
      {children}
    </button>
  );
}

function Section({ n, title, hint, children }: { n: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] bg-subtle/60 p-4">
      <div className="flex items-center gap-2 font-bold text-[14px]"><span className="size-6 rounded-full bg-primary-soft text-primary grid place-items-center text-[12px]">{n}</span>{title}</div>
      {hint && <p className="text-[12px] text-muted mt-1 ms-8">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ChannelPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const sid = useStoreId();
  const { data: channels = [] } = useChannels(sid);
  const usable = channels.filter((c: any) => c.status === "connected");
  if (!usable.length) return <p className="text-[13px] text-muted">کانال وصلی نداری. <Link className="text-primary font-bold" href={`/app/s/${sid}/channels`}>اول یک کانال وصل کن</Link></p>;
  return (
    <div className="flex flex-wrap gap-2">
      {usable.map((ch: any) => (
        <Toggle key={ch.id} on={value.includes(ch.id)} onClick={() => onChange(value.includes(ch.id) ? value.filter((x) => x !== ch.id) : [...value, ch.id])}>
          <PlatformIcon platform={ch.platform} size={18} />{ch.display_name}
        </Toggle>
      ))}
    </div>
  );
}

const emptyRef = () => ({ images: [] as string[], urls: [] as string[], note: "", price: 0 });

function AiContentBuilder({ onClose }: { onClose: () => void }) {
  const sid = useStoreId();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [a, setA] = useState<any>({ channel_ids: [], weekdays: [0, 2, 4], hour: 11, posts_per_run: 1, source: "catalog",
    brief: "", tone: "", use_style_profile: true, mode: "approval", queue: [] });
  const [draft, setDraft] = useState(emptyRef());
  const [link, setLink] = useState("");
  const set = (k: string, v: any) => setA((x: any) => ({ ...x, [k]: v }));
  const save = useMutation({
    mutationFn: () => api(`/stores/${sid}/automations`, { method: "POST", json: { name: name || "تولید محتوای AI", trigger: "ai_content", conditions: {}, actions: a } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations", sid] }); toast.success("اتوماسیون محتوا ساخته شد"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  const addRef = () => {
    const item = { ...draft, urls: link.trim() ? [link.trim()] : [] };
    if (!item.images.length && !item.urls.length) return toast.error("حداقل یک عکس یا لینک اضافه کن");
    set("queue", [...a.queue, item]);
    setDraft(emptyRef());
    setLink("");
  };
  return (
    <Dialog open onClose={onClose} title="تولید محتوای خودکار با AI" wide>
      <div className="space-y-3">
        <Field label="نام"><Input value={name} placeholder="مثلاً پست‌های سه‌روز در هفته" onChange={(e) => setName(e.target.value)} /></Field>

        <Section n="۱" title="چه روزهایی و چه ساعتی؟">
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d, i) => (
              <Toggle key={d} on={a.weekdays.includes(i)} onClick={() => set("weekdays", a.weekdays.includes(i) ? a.weekdays.filter((x: number) => x !== i) : [...a.weekdays, i].sort())}>{d}</Toggle>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 max-w-md">
            <Field label="ساعت (وقت تهران)">
              <Select value={a.hour} onChange={(e) => set("hour", Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{faDigits(String(h).padStart(2, "0"))}:۰۰</option>)}
              </Select>
            </Field>
            <Field label="تعداد پست هر بار">
              <Select value={a.posts_per_run} onChange={(e) => set("posts_per_run", Number(e.target.value))}>
                {[1, 2, 3].map((n) => <option key={n} value={n}>{faNum(n)} پست</option>)}
              </Select>
            </Field>
          </div>
        </Section>

        <Section n="۲" title="پست درباره چه باشد؟">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[["catalog", "از محصولات فروشگاهم", "AI محصولی که هنوز منتشر نشده را برمی‌دارد و برایش پست می‌نویسد."],
              ["references", "از رفرنس‌هایی که می‌دهم", "عکس یا لینک محصول بده؛ هر بار یکی از صف برمی‌دارد و پست کامل می‌سازد."]].map(([k, t, d]) => (
              <button key={k} type="button" onClick={() => set("source", k)}
                className={cn("text-start p-4 rounded-2xl border cursor-pointer transition-all duration-200", a.source === k ? "border-primary bg-primary/8" : "border-edge hover:bg-subtle")}>
                <div className="font-bold text-[14px]">{t}</div><div className="text-[12px] text-muted mt-1 leading-6">{d}</div>
              </button>
            ))}
          </div>
          {a.source === "references" && (
            <div className="mt-3 space-y-3">
              {a.queue.length > 0 && (
                <ul className="space-y-2">
                  {a.queue.map((q: any, i: number) => (
                    <li key={i} className="flex items-center gap-3 p-2 rounded-2xl bg-glass-strong">
                      {q.images[0] ? <img src={mediaUrl(q.images[0])} alt="" className="size-12 rounded-xl object-cover" /> : <span className="size-12 rounded-xl bg-subtle grid place-items-center"><Link2 className="size-4 text-muted" /></span>}
                      <span className="flex-1 min-w-0 text-[13px]"><b>رفرنس {faNum(i + 1)}</b><span className="block text-muted truncate">{q.note || q.urls[0] || `${faNum(q.images.length)} عکس`}</span></span>
                      <Button size="sm" variant="ghost" aria-label="حذف" onClick={() => set("queue", a.queue.filter((_: any, j: number) => j !== i))}><X className="size-4" /></Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="rounded-2xl border border-dashed border-edge p-3 space-y-3">
                <div className="text-[13px] font-bold flex items-center gap-1.5"><ImagePlus className="size-4" />رفرنس جدید</div>
                <ImageUploader storeId={sid} value={draft.images} onChange={(v) => setDraft({ ...draft, images: v })} max={6} />
                <Input dir="ltr" placeholder="لینک محصول (اختیاری)" value={link} onChange={(e) => setLink(e.target.value)} />
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-2">
                  <Input placeholder="توضیح کوتاه (اختیاری)؛ مثلاً مانتو لینن، سایز ۳۶ تا ۴۲" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
                  <NumberInput placeholder="قیمت (تومان)" value={draft.price} onChange={(v) => setDraft({ ...draft, price: v })} />
                </div>
                <Button variant="secondary" size="sm" icon={<Plus className="size-4" />} onClick={addRef}>افزودن به صف</Button>
              </div>
            </div>
          )}
        </Section>

        <Section n="۳" title="به چه سبکی؟" hint="AI از سبک پست‌های قبلی فروشگاهت و توضیح تو پیروی می‌کند.">
          <Textarea rows={3} value={a.brief} onChange={(e) => set("brief", e.target.value)}
            placeholder="مثلاً: لحن صمیمی، جملهٔ اول جذاب، تأکید روی ارسال رایگان، آخر پست دعوت به دایرکت" />
          <label className="flex items-center justify-between gap-3 mt-3 text-[14px]">
            <span>از سبک پست‌های قبلی فروشگاه استفاده شود<span className="block text-[12px] text-muted">پروفایل سبک را از صفحهٔ «ساخت با AI» می‌سازی</span></span>
            <Switch checked={a.use_style_profile} onChange={(v) => set("use_style_profile", v)} />
          </label>
        </Section>

        <Section n="۴" title="کجا منتشر شود؟">
          <ChannelPicker value={a.channel_ids} onChange={(v) => set("channel_ids", v)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {[["approval", "اول به من نشان بده", "نوتیف می‌آید؛ متن را می‌بینی، ویرایش یا تأیید می‌کنی و می‌رود در صف انتشار."],
              ["auto", "خودکار منتشر کن", "AI بدون تأیید تو منتشر می‌کند."]].map(([k, t, d]) => (
              <button key={k} type="button" onClick={() => set("mode", k)}
                className={cn("text-start p-4 rounded-2xl border cursor-pointer transition-all duration-200", a.mode === k ? "border-primary bg-primary/8" : "border-edge hover:bg-subtle")}>
                <div className="font-bold text-[14px]">{t}</div><div className="text-[12px] text-muted mt-1 leading-6">{d}</div>
              </button>
            ))}
          </div>
        </Section>

        <Button className="w-full" size="lg" loading={save.isPending}
          disabled={!a.channel_ids.length || !a.weekdays.length || (a.source === "references" && !a.queue.length)} onClick={() => save.mutate()}>
          ذخیرهٔ اتوماسیون
        </Button>
      </div>
    </Dialog>
  );
}

function RuleBuilder({ onClose }: { onClose: () => void }) {
  const sid = useStoreId();
  const qc = useQueryClient();
  const [r, setR] = useState<any>({ name: "", trigger: "product_created", conditions: { has_price: true, min_images: 1, sources: [] }, actions: { channel_ids: [], mode: "approval", schedule_hour: 10 } });
  const c = r.conditions, a = r.actions;
  const setC = (k: string, v: any) => setR((x: any) => ({ ...x, conditions: { ...x.conditions, [k]: v } }));
  const setA = (k: string, v: any) => setR((x: any) => ({ ...x, actions: { ...x.actions, [k]: v } }));
  const save = useMutation({
    mutationFn: () => api(`/stores/${sid}/automations`, { method: "POST", json: { ...r, name: r.name || RULE_TRIGGERS[r.trigger] } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations", sid] }); toast.success("اتوماسیون ساخته شد"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open onClose={onClose} title="قانون انتشار خودکار" wide>
      <div className="space-y-3">
        <Field label="نام"><Input value={r.name} placeholder="مثلاً انتشار خودکار محصولات کرال‌شده" onChange={(e) => setR({ ...r, name: e.target.value })} /></Field>
        <Section n="۱" title="وقتی…">
          <div className="flex flex-wrap gap-2">
            {Object.entries(RULE_TRIGGERS).map(([k, v]) => <Toggle key={k} on={r.trigger === k} onClick={() => setR({ ...r, trigger: k })}>{v}</Toggle>)}
          </div>
          {r.trigger === "schedule" && (
            <Field label="ساعت (وقت تهران)" className="mt-3 max-w-40">
              <Select value={a.schedule_hour} onChange={(e) => setA("schedule_hour", Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{faDigits(String(h).padStart(2, "0"))}:۰۰</option>)}
              </Select>
            </Field>
          )}
        </Section>
        <Section n="۲" title="اگر…">
          <div className="space-y-3 text-[14px]">
            <div className="flex flex-wrap items-center gap-2"><span className="text-muted">منبع محصول:</span>
              {SOURCES.map(([k, v]) => <Toggle key={k} on={c.sources.includes(k)} onClick={() => setC("sources", c.sources.includes(k) ? c.sources.filter((x: string) => x !== k) : [...c.sources, k])}>{v}</Toggle>)}
              <span className="text-[12px] text-muted">(هیچ‌کدام = همه)</span>
            </div>
            <label className="flex items-center justify-between">قیمت داشته باشد<Switch checked={!!c.has_price} onChange={(v) => setC("has_price", v)} /></label>
            <label className="flex items-center justify-between">موجود باشد<Switch checked={!!c.in_stock} onChange={(v) => setC("in_stock", v)} /></label>
            <label className="flex items-center justify-between gap-3">حداقل تعداد عکس<NumberInput grouping={false} className="w-24" value={c.min_images} onChange={(v) => setC("min_images", v)} /></label>
          </div>
        </Section>
        <Section n="۳" title="آنگاه منتشر کن در…">
          <ChannelPicker value={a.channel_ids} onChange={(v) => setA("channel_ids", v)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {[["approval", "اول به من نشان بده", "در صف تأیید می‌آید و با یک کلیک منتشر می‌شود."], ["auto", "خودکار منتشر کن", "بدون تأیید تو منتشر می‌شود."]].map(([k, t, d]) => (
              <button key={k} type="button" onClick={() => setA("mode", k)} className={cn("text-start p-4 rounded-2xl border cursor-pointer transition-all duration-200", a.mode === k ? "border-primary bg-primary/8" : "border-edge hover:bg-subtle")}>
                <div className="font-bold text-[14px]">{t}</div><div className="text-[12px] text-muted mt-1">{d}</div>
              </button>
            ))}
          </div>
        </Section>
        <Button className="w-full" size="lg" loading={save.isPending} disabled={!a.channel_ids.length} onClick={() => save.mutate()}>ذخیرهٔ اتوماسیون</Button>
      </div>
    </Dialog>
  );
}

function ApprovalCard({ item, highlight }: { item: any; highlight: boolean }) {
  const sid = useStoreId();
  const qc = useQueryClient();
  const { data: channels = [] } = useChannels(sid);
  const [caption, setCaption] = useState(item.caption || "");
  const [chs, setChs] = useState<number[]>(item.channel_ids);
  const decide = useMutation({
    mutationFn: (approve: boolean) => api(`/approvals/${item.id}`, { method: "POST", json: { approve, caption, channel_ids: chs } }),
    onSuccess: (_, approve) => {
      qc.invalidateQueries({ queryKey: ["approvals", sid] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(approve ? "تأیید شد و رفت در صف انتشار" : "رد شد");
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Card className={cn("p-4 sm:p-5 transition-shadow duration-300", highlight && "ring-2 ring-primary")}>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex md:flex-col gap-2 md:w-40 shrink-0 overflow-x-auto no-scrollbar">
          {item.images.length ? item.images.slice(0, 4).map((u: string) => <img key={u} src={mediaUrl(u)} alt="" className="size-24 md:size-40 rounded-2xl object-cover shrink-0 first:md:block md:[&:not(:first-child)]:hidden" />)
            : <div className="size-24 md:size-40 rounded-2xl bg-subtle" />}
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/app/s/${sid}/products/${item.product_id}`} className="font-bold hover:text-primary">{item.product_title}</Link>
            {item.price > 0 && <span className="text-[13px] text-muted tnum">{toman(item.price)}</span>}
            {item.kind === "ai_post" && <Chip tone="primary" icon={<Sparkles className="size-3" />}>نوشتهٔ AI</Chip>}
          </div>
          <div className="text-[12px] text-muted">{item.automation_name ?? "اتوماسیون"} · {ago(item.created_at)}</div>
          {item.kind === "ai_post"
            ? <Field label="متن پست (قابل ویرایش)"><Textarea rows={6} value={caption} onChange={(e) => setCaption(e.target.value)} /></Field>
            : <p className="text-[13px] text-muted line-clamp-3">{item.description}</p>}
          <div className="flex flex-wrap gap-2">
            {channels.filter((c: any) => c.status === "connected").map((c: any) => (
              <Toggle key={c.id} on={chs.includes(c.id)} onClick={() => setChs(chs.includes(c.id) ? chs.filter((x) => x !== c.id) : [...chs, c.id])} className="h-9">
                <PlatformIcon platform={c.platform} size={16} />{c.display_name}
              </Toggle>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button icon={<Check className="size-4" />} loading={decide.isPending && decide.variables === true} disabled={!chs.length} onClick={() => decide.mutate(true)}>تأیید و ارسال به صف انتشار</Button>
            <Button variant="secondary" icon={<X className="size-4" />} loading={decide.isPending && decide.variables === false} onClick={() => decide.mutate(false)}>رد</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function describeRule(r: any, chName: (id: number) => string) {
  const a = r.actions || {};
  if (r.trigger === "ai_content") {
    const days = (a.weekdays || []).map((d: number) => WEEKDAYS[d]).join("، ");
    return <>هر <b className="text-fg">{days}</b> ساعت {faDigits(a.hour)}، {faNum(a.posts_per_run || 1)} پست {a.source === "references" ? `از صف رفرنس‌ها (${faNum(a.queue?.length || 0)} مانده)` : "از محصولات فروشگاه"} بساز و {a.mode === "auto" ? "خودکار منتشر کن در" : "برای تأیید بفرست؛ بعد منتشر کن در"} <b className="text-fg">{(a.channel_ids || []).map(chName).join("، ")}</b></>;
  }
  const c = r.conditions || {};
  return <>وقتی <b className="text-fg">{TRIGGERS[r.trigger]}</b>{r.trigger === "schedule" && ` (ساعت ${faDigits(a.schedule_hour)})`}
    {c.sources?.length ? `، اگر منبع ${c.sources.map((s: string) => ({ manual: "دستی", crawl: "کرال", ai: "AI" } as any)[s]).join("/")} بود` : ""}
    {c.has_price ? "، قیمت داشت" : ""}{c.min_images ? `، حداقل ${faNum(c.min_images)} عکس داشت` : ""}{c.in_stock ? "، موجود بود" : ""}
    ، {a.mode === "auto" ? "خودکار منتشر کن در" : "برای تأیید آماده کن برای"} <b className="text-fg">{(a.channel_ids || []).map(chName).join("، ")}</b></>;
}

export default function Automations() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const sp = useSearchParams();
  const focus = Number(sp.get("approval")) || null;
  const [tab, setTab] = useState<"rules" | "approvals">(focus ? "approvals" : "rules");
  const [open, setOpen] = useState<null | "ai" | "rule">(null);
  useEffect(() => { if (focus) setTab("approvals"); }, [focus]);
  const { data: channels = [] } = useChannels(sid);
  const { data: rules = [] } = useQuery({ queryKey: ["automations", sid], queryFn: () => api<any[]>(`/stores/${sid}/automations`) });
  const { data: approvals = [] } = useQuery({ queryKey: ["approvals", sid], queryFn: () => api<any[]>(`/stores/${sid}/approvals`), refetchInterval: 20_000 });
  const toggle = useMutation({ mutationFn: (rule: any) => api(`/automations/${rule.id}`, { method: "PATCH", json: { ...rule, is_active: !rule.is_active } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["automations", sid] }) });
  const del = useMutation({ mutationFn: (id: number) => api(`/automations/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["automations", sid] }) });
  const run = useMutation({
    mutationFn: (id: number) => api(`/automations/${id}/run`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations", sid] }); toast.success("در حال ساخت پست… وقتی آماده شد نوتیف می‌آید."); },
    onError: (e: any) => toast.error(e.message),
  });
  const chName = (id: number) => channels.find((c: any) => c.id === id)?.display_name ?? `#${id}`;

  return (
    <>
      <PageHeader title="اتوماسیون" subtitle="AI برایت پست می‌سازد، تو تأیید می‌کنی و Sello منتشر می‌کند."
        actions={<>
          <Button icon={<Sparkles className="size-4" />} onClick={() => setOpen("ai")}>تولید محتوای AI</Button>
          <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => setOpen("rule")}>قانون انتشار</Button>
        </>} />
      <AiSetupBanner />
      <div className="mb-4">
        <Tabs value={tab} onChange={setTab} items={[{ value: "rules", label: `اتوماسیون‌ها (${faNum(rules.length)})` }, { value: "approvals", label: `منتظر تأیید (${faNum(approvals.length)})` }]} />
      </div>

      {tab === "rules" ? (
        rules.length === 0 ? (
          <Card><EmptyState icon={<Workflow className="size-6" />} title="هنوز اتوماسیونی نساختی"
            text="مثلاً: شنبه، دوشنبه و چهارشنبه ساعت ۱۱، AI از محصولاتت پست بسازد، تو تأیید کنی و در تلگرام و اینستاگرام منتشر شود."
            action={<Button icon={<Sparkles className="size-4" />} onClick={() => setOpen("ai")}>ساخت اتوماسیون محتوا</Button>} /></Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {rules.map((r: any) => (
              <Card key={r.id} className={cn("p-4 sm:p-5 transition-opacity duration-200", !r.is_active && "opacity-60")}>
                <div className="flex items-start gap-3">
                  <span className={cn("size-10 rounded-2xl grid place-items-center shrink-0", r.trigger === "ai_content" ? "bg-primary/15 text-primary" : "bg-subtle text-muted")}>
                    {r.trigger === "ai_content" ? <Sparkles className="size-5" /> : <Workflow className="size-5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">{r.name}</div>
                    <div className="text-[13px] text-muted mt-1 leading-7">{describeRule(r, chName)}</div>
                    <div className="text-[12px] text-muted mt-1 flex items-center gap-1"><Clock className="size-3" />{faNum(r.run_count)} بار اجرا · آخرین اجرا {ago(r.last_run_at)}</div>
                  </div>
                  <Switch checked={r.is_active} onChange={() => toggle.mutate(r)} label="فعال" />
                </div>
                <div className="flex flex-wrap justify-end gap-1 mt-3">
                  {r.trigger === "ai_content" && <Button size="sm" variant="secondary" icon={<Play className="size-4" />} loading={run.isPending && run.variables === r.id} onClick={() => run.mutate(r.id)}>همین الان یک پست بساز</Button>}
                  <Button size="sm" variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => confirm("این اتوماسیون حذف شود؟") && del.mutate(r.id)}>حذف</Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : approvals.length === 0 ? (
        <Card><EmptyState icon={<Check className="size-6" />} title="چیزی منتظر تأیید نیست" text="پست‌هایی که AI می‌سازد اینجا می‌آیند و برایت نوتیف هم فرستاده می‌شود." /></Card>
      ) : (
        <div className="space-y-3">{approvals.map((a: any) => <ApprovalCard key={a.id} item={a} highlight={a.id === focus} />)}</div>
      )}

      {open === "ai" && <AiContentBuilder onClose={() => setOpen(null)} />}
      {open === "rule" && <RuleBuilder onClose={() => setOpen(null)} />}
    </>
  );
}
