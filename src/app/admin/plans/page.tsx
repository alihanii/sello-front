"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { faDigits, faNum, toman } from "@/lib/format";
import { AdminFormsSkeleton } from "@/components/ui/skeletons";
import { PlanCards } from "@/components/plans/PlanCards";
import { Button, Card, CardHeader, Chip, Field, Input, NumberInput, PageHeader, Switch, Textarea, cn, FormActions } from "@/components/ui/primitives";

const LIMITS: [string, string][] = [["max_stores", "حداکثر فروشگاه"], ["max_channels_per_platform", "کانال از هر پلتفرم (در هر فروشگاه)"], ["max_products", "حداکثر محصول"], ["monthly_ai_credits", "ساخت محصول با AI در ماه"], ["monthly_chat_messages", "جواب AI دستیار چت در ماه"]];
const LABEL: Record<number, string> = { 1: "یک‌ماهه", 3: "سه‌ماهه", 12: "یک‌ساله" };
const DISCOUNTS: Record<number, number> = { 1: 0, 3: 10, 12: 25 };
// Rough AI cost on Gemini 2.5 Flash-Lite at 300,000 toman a dollar (see the cost report): per chat reply and per credit.
const COST_CHAT = 63;
const COST_CREDIT = 400;

const blank = (sort: number) => ({
  tier: `plan${Date.now().toString(36)}`, name: "", description: "", features: [], sort_order: sort, is_featured: false, is_active: true, subscribers: 0, isNew: true,
  limits: { max_stores: 1, max_channels_per_platform: 2, max_products: 300, monthly_ai_credits: 50, monthly_chat_messages: 1000, ai_images: false },
  prices: [1, 3, 12].map((m) => ({ duration_months: m, price_toman: 0, compare_at_toman: 0, is_active: true, plan_id: null, max_stores: null })),
});

export default function AdminPlans() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-plan-tiers"], queryFn: () => api<any[]>("/admin/plan-tiers") });
  const [drafts, setDrafts] = useState<any[] | null>(null);
  const [openTier, setOpenTier] = useState<string | null>(null);
  useEffect(() => { if (data) { setDrafts(data); setOpenTier((t) => t ?? data[0]?.tier ?? null); } }, [data]);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-plan-tiers"] }); qc.invalidateQueries({ queryKey: ["plans"] }); qc.invalidateQueries({ queryKey: ["admin-plans"] }); };
  if (!drafts) return <AdminFormsSkeleton />;
  const setDraft = (tier: string, next: any) => setDrafts(drafts.map((d) => (d.tier === tier ? next : d)));
  const add = () => { const b = blank(drafts.length + 1); setDrafts([...drafts, b]); setOpenTier(b.tier); };
  const preview = drafts.filter((d) => d.is_active && !d.isNew).flatMap((d) => d.prices.filter((x: any) => x.is_active)
    .map((x: any) => ({ ...d, ...x, id: x.plan_id ?? `${d.tier}-${x.duration_months}` })));

  return (
    <>
      <PageHeader title="پلن‌ها" subtitle="قیمت هر مدت، سقف‌ها و قابلیت‌های هر پلن. خاموش کردن یک پلن فقط فروشش را می‌بندد؛ خریداران فعلی تا پایان اشتراک آن را دارند."
        actions={<Button icon={<Plus className="size-4" />} variant="secondary" onClick={add}>پلن جدید</Button>} />
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          {drafts.map((d) => (
            <TierEditor key={d.tier} draft={d} open={openTier === d.tier} onOpen={() => setOpenTier(openTier === d.tier ? null : d.tier)}
              onChange={(n) => setDraft(d.tier, n)} onSaved={(saved) => { setDraft(d.tier, saved); refresh(); }}
              onDeleted={() => { setDrafts(drafts.filter((x) => x.tier !== d.tier)); refresh(); }} />
          ))}
          <FreeLimits />
        </div>
        <div className="xl:sticky xl:top-24 min-w-0">
          <div className="text-[13px] font-bold text-muted mb-2">پیش‌نمایش صفحهٔ خرید (بعد از ذخیره)</div>
          {preview.length ? <PlanCards plans={preview} onSelect={() => {}} /> : <Card className="p-6 text-muted text-[14px]">هیچ پلنی برای فروش روشن نیست.</Card>}
        </div>
      </div>
    </>
  );
}

function TierEditor({ draft: p, open, onOpen, onChange, onSaved, onDeleted }: {
  draft: any; open: boolean; onOpen: () => void; onChange: (p: any) => void; onSaved: (p: any) => void; onDeleted: () => void;
}) {
  const save = useMutation({
    mutationFn: () => api(`/admin/plan-tiers/${encodeURIComponent(p.tier)}`, { method: "PUT", json: p }),
    onSuccess: (d: any) => { onSaved(d); toast.success("پلن ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: (v: boolean) => api(`/admin/plan-tiers/${encodeURIComponent(p.tier)}/active`, { method: "POST", json: { is_active: v } }),
    onSuccess: (d: any) => { onSaved(d); toast.success(d.is_active ? "فروش پلن روشن شد" : "فروش پلن خاموش شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: () => api(`/admin/plan-tiers/${encodeURIComponent(p.tier)}`, { method: "DELETE" }),
    onSuccess: () => { onDeleted(); toast.success("پلن حذف شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  const setPrice = (m: number, patch: any) => onChange({ ...p, prices: p.prices.map((x: any) => (x.duration_months === m ? { ...x, ...patch } : x)) });
  const setLimit = (k: string, v: any) => onChange({ ...p, limits: { ...p.limits, [k]: v } });
  const monthly = p.prices.find((x: any) => x.duration_months === 1)?.price_toman ?? 0;
  const fillPrices = () => onChange({ ...p, prices: p.prices.map((x: any) => {
    const full = monthly * x.duration_months;
    return x.duration_months === 1 ? x : { ...x, price_toman: Math.round((full * (100 - DISCOUNTS[x.duration_months])) / 100 / 10000) * 10000, compare_at_toman: full };
  }) });
  const aiCost = (p.limits.monthly_chat_messages ?? 0) * COST_CHAT + (p.limits.monthly_ai_credits ?? 0) * COST_CREDIT;
  const share = monthly ? Math.round((100 * aiCost) / monthly) : 0;

  return (
    <Card className={cn(!p.is_active && !p.isNew && "opacity-80")}>
      <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-start cursor-pointer">
          <div className="flex flex-wrap items-center gap-2 font-extrabold text-[16px]">
            {p.name || "پلن بدون نام"}
            {p.isNew ? <Chip tone="warning">ذخیره نشده</Chip> : p.is_active ? <Chip tone="success">در حال فروش</Chip> : <Chip>فروش خاموش</Chip>}
            {p.is_featured && <Chip tone="primary">پیشنهاد ما</Chip>}
          </div>
          <div className="text-[12px] text-muted mt-0.5">{toman(monthly)} در ماه · {faNum(p.subscribers ?? 0)} خریدار فعال</div>
        </button>
        {!p.isNew && <label className="flex items-center gap-2 text-[13px]"><Switch checked={p.is_active} disabled={toggle.isPending} onChange={(v) => toggle.mutate(v)} label="فروش پلن" />فروش</label>}
        <Button size="sm" variant="ghost" onClick={onOpen}>{open ? "بستن" : "ویرایش"}</Button>
      </div>
      {open && (
        <div className="px-4 sm:px-5 pb-5 space-y-5 border-t border-edge pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="نام"><Input value={p.name} onChange={(e) => onChange({ ...p, name: e.target.value })} /></Field>
            <Field label="توضیح کوتاه"><Input value={p.description} onChange={(e) => onChange({ ...p, description: e.target.value })} /></Field>
            <Field label="ترتیب نمایش"><NumberInput value={p.sort_order} onChange={(v) => onChange({ ...p, sort_order: v })} /></Field>
            <label className="flex items-center gap-2 text-[13px] sm:pt-7"><Switch checked={p.is_featured} onChange={(v) => onChange({ ...p, is_featured: v })} label="پیشنهاد ما" />نشان «پیشنهاد ما» (فقط یک پلن)</label>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-[14px] font-bold">قیمت هر مدت</div>
              <button type="button" className="text-primary text-[12px] font-bold cursor-pointer" onClick={fillPrices}>پر کردن از قیمت ماهانه (۱۰٪ و ۲۵٪ تخفیف)</button>
            </div>
            <div className="space-y-2">
              {p.prices.map((x: any) => {
                const d = x.compare_at_toman > x.price_toman ? Math.round(100 - (100 * x.price_toman) / x.compare_at_toman) : 0;
                return (
                  <div key={x.duration_months} className="grid grid-cols-2 items-end gap-3 p-3 rounded-2xl bg-subtle">
                    <div className="col-span-2 font-bold text-[14px]">{LABEL[x.duration_months]}{d > 0 && <span className="block text-[12px] text-primary font-semibold">{faDigits(d)}٪ تخفیف</span>}</div>
                    <Field label="قیمت (تومان)"><NumberInput value={x.price_toman} onChange={(v) => setPrice(x.duration_months, { price_toman: v })} /></Field>
                    <Field label="قیمت خط‌خورده"><NumberInput value={x.compare_at_toman} onChange={(v) => setPrice(x.duration_months, { compare_at_toman: v })} /></Field>
                    <Field label="فروشگاه"><NumberInput value={x.max_stores ?? p.limits.max_stores ?? 1} onChange={(v) => setPrice(x.duration_months, { max_stores: v === (p.limits.max_stores ?? 1) ? null : v })} /></Field>
                    <label className="flex items-center gap-2 text-[13px] pb-2.5"><Switch checked={x.is_active} onChange={(v) => setPrice(x.duration_months, { is_active: v })} label={`فروش ${LABEL[x.duration_months]}`} />فروش</label>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[14px] font-bold mb-2">سقف‌ها</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LIMITS.map(([k, l]) => <Field key={k} label={l}><NumberInput value={p.limits[k] ?? 0} onChange={(v) => setLimit(k, v)} /></Field>)}
              <label className="flex items-center gap-2 text-[13px] sm:pt-7"><Switch checked={!!p.limits.ai_images} onChange={(v) => setLimit("ai_images", v)} label="ساخت عکس با AI" />ساخت و تمیز کردن عکس با AI</label>
            </div>
            <p className="text-[12px] text-muted mt-2">انتشار و کرال سقف ندارند. ستون «فروشگاه» در قیمت‌ها برای مدتی است که فروشگاه بیشتری می‌دهد (مثلاً یک‌ساله: ۲).</p>
            <p className={cn("text-[12px] mt-2", share > 50 ? "text-danger" : "text-muted")}>
              بیشترین هزینهٔ AI در ماه اگر همهٔ سقف مصرف شود (بدون کرال): حدود {toman(aiCost)}{monthly ? ` (${faDigits(share)}٪ قیمت ماهانه)` : ""}. هر جواب چت حدود {faNum(COST_CHAT)} و ساخت هر محصول حدود {faNum(COST_CREDIT)} تومان با Gemini 2.5 Flash-Lite؛ هر پست کرال‌شده با AI حدود ۶۰ تومان و هر عکس ساخته‌شده حدود ۲۰ هزار تومان.
            </p>
          </div>

          <Field label="قابلیت‌ها در صفحهٔ خرید (هر خط یک مورد)">
            <Textarea rows={6} value={p.features.join("\n")} onChange={(e) => onChange({ ...p, features: e.target.value.split("\n") })} />
          </Field>

          <FormActions className="justify-between">
            {!p.isNew ? (
              <Button variant="danger" size="sm" icon={<Trash2 className="size-4" />} loading={remove.isPending}
                onClick={() => confirm(`پلن «${p.name}» حذف شود؟ پلنی که خریدار داشته حذف نمی‌شود.`) && remove.mutate()}>حذف پلن</Button>
            ) : <span />}
            <Button loading={save.isPending} disabled={!p.name.trim()} onClick={() => save.mutate()}>{p.isNew ? "ساخت پلن" : "ذخیرهٔ تغییرات"}</Button>
          </FormActions>
        </div>
      )}
    </Card>
  );
}

function FreeLimits() {
  const { data } = useQuery({ queryKey: ["admin-free-limits"], queryFn: () => api<any>("/admin/free-limits") });
  const [l, setL] = useState<any>(null);
  useEffect(() => { if (data) setL(data.limits); }, [data]);
  const save = useMutation({
    mutationFn: () => api("/admin/free-limits", { method: "PUT", json: { limits: l } }),
    onSuccess: (d: any) => { setL(d.limits); toast.success("ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!l) return null;
  return (
    <Card>
      <CardHeader title="کاربران بدون پلن (آزمایشی)" subtitle="برای کسی که هنوز پلن نخریده. بعد از تمام شدن پلن یا بلاک شدن، هیچ کار AI برای کاربر انجام نمی‌شود." />
      <div className="px-4 sm:px-5 pb-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LIMITS.map(([k, lab]) => <Field key={k} label={lab}><NumberInput value={l[k] ?? 0} onChange={(v) => setL({ ...l, [k]: v })} /></Field>)}
        </div>
        <FormActions><Button variant="secondary" loading={save.isPending} onClick={() => save.mutate()}>ذخیره</Button></FormActions>
      </div>
    </Card>
  );
}
