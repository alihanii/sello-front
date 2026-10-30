"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Inbox, Play, Plus, Radar, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { api, mediaUrl } from "@/lib/api";
import { ago, faNum, toman } from "@/lib/format";
import { useChannels, useStoreId } from "@/lib/hooks";
import { PLATFORMS } from "@/lib/meta";
import { PlatformIcon, StatusChip } from "@/components/ui/status";
import { Button, Card, CardHeader, Chip, Dialog, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui/primitives";
import { AiSetupBanner } from "@/components/admin/AiKeyEditor";

const SCHEDULE: Record<string, string> = { manual: "دستی", hourly: "هر ساعت", daily: "روزانه", weekly: "هفتگی" };
const MODE: Record<string, string> = { auto: "خودکار (قاعده، سپس AI)", regex: "فقط قاعده‌محور", llm: "فقط AI" };

export default function Crawl() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const { data: channels = [] } = useChannels(sid);
  const { data: sources = [] } = useQuery({ queryKey: ["crawl-sources", sid], queryFn: () => api<any[]>(`/stores/${sid}/crawl-sources`) });
  const { data: runs } = useQuery({ queryKey: ["operations", sid, "crawl"], queryFn: () => api(`/stores/${sid}/operations?type=crawl&size=15`) });
  const { data: inbox = [] } = useQuery({ queryKey: ["products", sid, "inbox"], queryFn: () => api<any[]>(`/stores/${sid}/crawl-inbox`) });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ type: "channel_posts", schedule: "daily", extraction_mode: "auto" });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["crawl-sources", sid] }); qc.invalidateQueries({ queryKey: ["operations", sid] }); };
  const create = useMutation({
    mutationFn: () => api(`/stores/${sid}/crawl-sources`, { method: "POST", json: { ...form, channel_id: form.channel_id ? Number(form.channel_id) : null } }),
    onSuccess: () => { refresh(); setOpen(false); toast.success("منبع کرال اضافه شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  const run = useMutation({
    mutationFn: (id: number) => api(`/crawl-sources/${id}/run`, { method: "POST" }),
    onSuccess: () => { refresh(); toast.success("کرال شروع شد؛ نتیجه را پایین همین صفحه می‌بینی."); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({ mutationFn: (id: number) => api(`/crawl-sources/${id}`, { method: "DELETE" }), onSuccess: refresh });
  const decide = useMutation({
    mutationFn: (b: any) => api(`/stores/${sid}/crawl-inbox`, { method: "POST", json: b }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", sid] }),
  });

  return (
    <>
      <PageHeader title="کرال" subtitle="محصولات را از پست‌های کانال، پنل دیجی‌کالا یا یک لینک بیرون بکش."
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>منبع جدید</Button>} />
      <AiSetupBanner />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader title="منابع کرال" />
            {sources.length === 0 ? <EmptyState icon={<Radar className="size-6" />} title="هنوز منبعی نداری" text="یک کانال وصل‌شده یا یک لینک را منبع کرال کن." /> : (
              <ul className="divide-y divide-[var(--glass-edge)]">
                {sources.map((s: any) => {
                  const ch = channels.find((c: any) => c.id === s.channel_id);
                  return (
                    <li key={s.id} className="p-4 flex flex-wrap items-center gap-3">
                      {ch ? <PlatformIcon platform={ch.platform} /> : <span className="size-7 rounded-lg bg-crawl/15 text-crawl grid place-items-center"><Radar className="size-4" /></span>}
                      <div className="flex-1 min-w-40">
                        <div className="font-semibold text-[14px]">{s.name}</div>
                        <div className="text-[12px] text-muted">{SCHEDULE[s.schedule]} · {MODE[s.extraction_mode]} · آخرین اجرا {ago(s.last_run_at)}</div>
                      </div>
                      <Button size="sm" icon={<Play className="size-4" />} loading={run.isPending && run.variables === s.id} onClick={() => run.mutate(s.id)}>الان کرال کن</Button>
                      <Button size="sm" variant="ghost" aria-label="حذف" onClick={() => confirm("منبع حذف شود؟") && del.mutate(s.id)}><Trash2 className="size-4" /></Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="تاریخچهٔ کرال" subtitle="هر اجرا: چند آیتم دیده شد، چند محصول ساخته یا به‌روز شد، چند خطا" />
            <ul className="divide-y divide-[var(--glass-edge)]">
              {runs?.items?.map((o: any) => (
                <li key={o.id}>
                  <Link href={`/app/s/${sid}/activity/${o.id}`} className="p-4 flex flex-wrap items-center gap-3 hover:bg-subtle/60">
                    <StatusChip status={o.status} kind="op" />
                    <span className="font-semibold text-[14px] flex-1">{o.title_fa}</span>
                    {o.result?.seen != null && (
                      <span className="flex flex-wrap gap-1">
                        <Chip>{faNum(o.result.seen)} دیده‌شده</Chip>
                        <Chip tone="success">{faNum(o.result.created + (o.result.inbox ?? 0))} جدید</Chip>
                        {o.result.updated > 0 && <Chip tone="primary">{faNum(o.result.updated)} به‌روز</Chip>}
                        {o.result.failed > 0 && <Chip tone="danger">{faNum(o.result.failed)} خطا</Chip>}
                      </span>
                    )}
                    {o.error_message_fa && <span className="text-danger text-[13px] w-full">{o.error_message_fa}</span>}
                    {o.status === "succeeded" && o.result?.seen === 0 && o.result?.note && <span className="text-warning text-[13px] w-full leading-6">{o.result.note}</span>}
                    <span className="text-muted text-[12px]">{ago(o.created_at)}</span>
                  </Link>
                </li>
              ))}
              {runs?.items?.length === 0 && <li className="p-5 text-muted text-[14px]">هنوز کرالی اجرا نشده.</li>}
            </ul>
          </Card>
        </div>
        <Card className="self-start">
          <CardHeader title={<span className="flex items-center gap-2"><Inbox className="size-4" />صندوق ورودی</span>} subtitle="پیش‌نویس‌های کرال و AI که منتظر تأیید تو هستند" />
          {inbox.length === 0 ? <p className="px-5 pb-5 text-muted text-[14px]">چیزی منتظر بررسی نیست.</p> : (
            <ul className="px-3 pb-3 space-y-1">
              {inbox.slice(0, 20).map((p: any) => (
                <li key={p.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-subtle">
                  <div className="size-10 rounded-lg bg-subtle overflow-hidden shrink-0">{p.images[0] && <img src={mediaUrl(p.images[0].url)} alt="" className="size-full object-cover" />}</div>
                  <Link href={`/app/s/${sid}/products/${p.id}`} className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{p.title}</div>
                    <div className="text-[12px] text-muted tnum">{toman(p.price)}</div>
                  </Link>
                  <Button size="sm" variant="ghost" aria-label="تأیید" onClick={() => decide.mutate({ product_ids: [p.id], approve: true })}><Check className="size-4 text-success" /></Button>
                  <Button size="sm" variant="ghost" aria-label="رد" onClick={() => decide.mutate({ product_ids: [p.id], approve: false })}><X className="size-4 text-danger" /></Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title="منبع کرال جدید">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Field label="نوع منبع">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="channel_posts">پست‌های کانال (تلگرام، بله، اینستاگرام)</option>
              <option value="marketplace_listing">لیست محصولات من در دیجی‌کالا</option>
              <option value="url">لینک صفحهٔ محصول</option>
            </Select>
          </Field>
          {form.type === "url" ? (
            <Field label="لینک"><Input dir="ltr" className="text-left" onChange={(e) => setForm({ ...form, url: e.target.value })} required /></Field>
          ) : (
            <Field label="کانال">
              <Select value={form.channel_id ?? ""} onChange={(e) => setForm({ ...form, channel_id: e.target.value })} required>
                <option value="">انتخاب کنید</option>
                {channels.filter((c: any) => form.type === "marketplace_listing" ? c.platform === "digikala" : c.platform !== "digikala")
                  .map((c: any) => <option key={c.id} value={c.id}>{c.display_name} ({PLATFORMS[c.platform].label})</option>)}
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="زمان‌بندی"><Select value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })}>
              {Object.entries(SCHEDULE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
            <Field label="روش استخراج"><Select value={form.extraction_mode} onChange={(e) => setForm({ ...form, extraction_mode: e.target.value })}>
              {Object.entries(MODE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          </div>
          <Field label="نام (اختیاری)"><Input onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Button type="submit" className="w-full" loading={create.isPending}>افزودن</Button>
        </form>
      </Dialog>
    </>
  );
}
