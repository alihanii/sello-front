"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Check, Plus, Trash2, X, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago, faDigits, faNum } from "@/lib/format";
import { useChannels, useStoreId } from "@/lib/hooks";
import { TRIGGERS } from "@/lib/meta";
import { PlatformIcon } from "@/components/ui/status";
import { Button, Card, CardHeader, Dialog, EmptyState, Field, Input, PageHeader, Switch, cn } from "@/components/ui/primitives";

const SOURCES = [["manual", "دستی"], ["crawl", "کرال"], ["ai", "AI"]];

function RuleBuilder({ onClose }: { onClose: () => void }) {
  const sid = useStoreId();
  const qc = useQueryClient();
  const { data: channels = [] } = useChannels(sid);
  const [r, setR] = useState<any>({ name: "", trigger: "product_created", conditions: { has_price: true, min_images: 1, sources: [] }, actions: { channel_ids: [], mode: "approval", schedule_hour: 10 } });
  const c = r.conditions, a = r.actions;
  const setC = (k: string, v: any) => setR({ ...r, conditions: { ...c, [k]: v } });
  const setA = (k: string, v: any) => setR({ ...r, actions: { ...a, [k]: v } });
  const save = useMutation({
    mutationFn: () => api(`/stores/${sid}/automations`, { method: "POST", json: { ...r, name: r.name || TRIGGERS[r.trigger] } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations", sid] }); toast.success("اتوماسیون ساخته شد"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  const Block = ({ n, title, children }: any) => (
    <div className="rounded-2xl border border-edge p-4">
      <div className="flex items-center gap-2 font-bold text-[14px] mb-3"><span className="size-6 rounded-full bg-primary text-primary-fg grid place-items-center text-[12px]">{n}</span>{title}</div>
      {children}
    </div>
  );
  return (
    <Dialog open onClose={onClose} title="اتوماسیون جدید" wide>
      <div className="space-y-3">
        <Field label="نام"><Input value={r.name} placeholder="مثلاً انتشار خودکار محصولات کرال‌شده" onChange={(e) => setR({ ...r, name: e.target.value })} /></Field>
        <Block n="۱" title="وقتی…">
          <div className="flex flex-wrap gap-2">
            {Object.entries(TRIGGERS).map(([k, v]) => (
              <button key={k} type="button" onClick={() => setR({ ...r, trigger: k })}
                className={cn("px-3 h-9 rounded-xl text-[13px] font-semibold border cursor-pointer", r.trigger === k ? "bg-primary/10 border-primary text-primary" : "border-edge")}>{v}</button>
            ))}
          </div>
          {r.trigger === "schedule" && (
            <Field label="ساعت (به وقت تهران)" className="mt-3 max-w-40"><Input type="number" min={0} max={23} value={a.schedule_hour} onChange={(e) => setA("schedule_hour", Number(e.target.value))} /></Field>
          )}
        </Block>
        <Block n="۲" title="اگر…">
          <div className="space-y-3 text-[14px]">
            <div className="flex flex-wrap items-center gap-2"><span className="text-muted">منبع محصول:</span>
              {SOURCES.map(([k, v]) => (
                <button key={k} type="button" onClick={() => setC("sources", c.sources.includes(k) ? c.sources.filter((x: string) => x !== k) : [...c.sources, k])}
                  className={cn("px-3 h-8 rounded-full text-[12px] font-semibold border cursor-pointer", c.sources.includes(k) ? "bg-primary/10 border-primary text-primary" : "border-edge")}>{v}</button>
              ))}
              <span className="text-[12px] text-muted">(هیچ‌کدام = همه)</span>
            </div>
            <label className="flex items-center justify-between">قیمت داشته باشد<Switch checked={!!c.has_price} onChange={(v) => setC("has_price", v)} /></label>
            <label className="flex items-center justify-between">موجود باشد<Switch checked={!!c.in_stock} onChange={(v) => setC("in_stock", v)} /></label>
            <label className="flex items-center justify-between gap-3">حداقل تعداد عکس<Input type="number" min={0} className="w-24" value={c.min_images} onChange={(e) => setC("min_images", Number(e.target.value))} /></label>
          </div>
        </Block>
        <Block n="۳" title="آنگاه منتشر کن در…">
          <div className="flex flex-wrap gap-2 mb-3">
            {channels.filter((ch: any) => ch.platform !== "digikala").map((ch: any) => (
              <button key={ch.id} type="button" onClick={() => setA("channel_ids", a.channel_ids.includes(ch.id) ? a.channel_ids.filter((x: number) => x !== ch.id) : [...a.channel_ids, ch.id])}
                className={cn("flex items-center gap-2 px-3 h-10 rounded-xl text-[13px] font-semibold border cursor-pointer", a.channel_ids.includes(ch.id) ? "bg-primary/10 border-primary" : "border-edge")}>
                <PlatformIcon platform={ch.platform} size={20} />{ch.display_name}
              </button>
            ))}
            {channels.length === 0 && <span className="text-muted text-[13px]">کانالی وصل نیست.</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[["auto", "خودکار منتشر کن", "AI بدون تأیید تو منتشر می‌کند"], ["approval", "پیش‌نویس برای تأیید", "در صف تأیید می‌آید، با یک کلیک منتشر می‌شود"]].map(([k, t, d]) => (
              <button key={k} type="button" onClick={() => setA("mode", k)} className={cn("text-start p-3 rounded-xl border cursor-pointer", a.mode === k ? "bg-primary/10 border-primary" : "border-edge")}>
                <div className="font-semibold text-[14px]">{t}</div><div className="text-[12px] text-muted">{d}</div>
              </button>
            ))}
          </div>
        </Block>
        <Button className="w-full" size="lg" loading={save.isPending} disabled={!a.channel_ids.length} onClick={() => save.mutate()}>ذخیرهٔ اتوماسیون</Button>
      </div>
    </Dialog>
  );
}

export default function Automations() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: channels = [] } = useChannels(sid);
  const { data: rules = [] } = useQuery({ queryKey: ["automations", sid], queryFn: () => api<any[]>(`/stores/${sid}/automations`) });
  const { data: approvals = [] } = useQuery({ queryKey: ["approvals", sid], queryFn: () => api<any[]>(`/stores/${sid}/approvals`) });
  const toggle = useMutation({ mutationFn: (rule: any) => api(`/automations/${rule.id}`, { method: "PATCH", json: { ...rule, is_active: !rule.is_active } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["automations", sid] }) });
  const del = useMutation({ mutationFn: (id: number) => api(`/automations/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["automations", sid] }) });
  const decide = useMutation({
    mutationFn: ({ id, approve }: any) => api(`/approvals/${id}`, { method: "POST", json: { approve } }),
    onSuccess: (_, v: any) => { qc.invalidateQueries({ queryKey: ["approvals", sid] }); toast.success(v.approve ? "در صف انتشار قرار گرفت" : "رد شد"); },
  });
  const chName = (id: number) => channels.find((c: any) => c.id === id)?.display_name ?? `#${id}`;
  return (
    <>
      <PageHeader title="اتوماسیون" subtitle="قانون بگذار تا Sello خودش محصولات را در کانال‌ها منتشر کند."
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>اتوماسیون جدید</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-3">
          {rules.length === 0 ? <Card><EmptyState icon={<Zap className="size-6" />} title="هنوز اتوماسیونی نساختی" text="مثلاً: هر محصول جدید کرال‌شده که قیمت و عکس دارد را در تلگرام و بله منتشر کن." action={<Button onClick={() => setOpen(true)}>ساخت اولین اتوماسیون</Button>} /></Card>
            : rules.map((r: any) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="size-10 rounded-xl bg-ai/12 text-ai grid place-items-center"><Bot className="size-5" /></span>
                  <div className="flex-1">
                    <div className="font-bold">{r.name}</div>
                    <div className="text-[13px] text-muted mt-1 leading-7">
                      وقتی <b className="text-fg">{TRIGGERS[r.trigger]}</b>{r.trigger === "schedule" && ` (ساعت ${faDigits(r.actions.schedule_hour)})`}
                      {r.conditions.sources?.length ? `، اگر منبع ${r.conditions.sources.map((s: string) => ({ manual: "دستی", crawl: "کرال", ai: "AI" } as any)[s]).join("/")} بود` : ""}
                      {r.conditions.has_price ? "، قیمت داشت" : ""}{r.conditions.min_images ? `، حداقل ${faNum(r.conditions.min_images)} عکس داشت` : ""}{r.conditions.in_stock ? "، موجود بود" : ""}
                      ، {r.actions.mode === "auto" ? "خودکار منتشر کن در" : "برای تأیید آماده کن برای"} <b className="text-fg">{r.actions.channel_ids.map(chName).join("، ")}</b>
                    </div>
                    <div className="text-[12px] text-muted mt-1">{faNum(r.run_count)} بار اجرا شده · آخرین اجرا {ago(r.last_run_at)}</div>
                  </div>
                  <Switch checked={r.is_active} onChange={() => toggle.mutate(r)} label="فعال" />
                  <Button size="sm" variant="ghost" aria-label="حذف" onClick={() => confirm("حذف شود؟") && del.mutate(r.id)}><Trash2 className="size-4" /></Button>
                </div>
              </Card>
            ))}
        </div>
        <Card>
          <CardHeader title="صف تأیید" subtitle="محصولاتی که اتوماسیون آماده کرده و منتظر تأیید تو هستند" />
          {approvals.length === 0 ? <p className="px-5 pb-5 text-[14px] text-muted">چیزی منتظر تأیید نیست.</p> : (
            <ul className="px-3 pb-3 space-y-1">
              {approvals.map((a: any) => (
                <li key={a.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-subtle">
                  <div className="flex-1 min-w-0"><div className="text-[13px] font-semibold truncate">{a.product_title}</div>
                    <div className="text-[12px] text-muted truncate">{a.channel_ids.map(chName).join("، ")}</div></div>
                  <Button size="sm" variant="ghost" aria-label="تأیید" onClick={() => decide.mutate({ id: a.id, approve: true })}><Check className="size-4 text-success" /></Button>
                  <Button size="sm" variant="ghost" aria-label="رد" onClick={() => decide.mutate({ id: a.id, approve: false })}><X className="size-4 text-danger" /></Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {open && <RuleBuilder onClose={() => setOpen(false)} />}
    </>
  );
}
