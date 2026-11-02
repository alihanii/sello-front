"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Plus, RefreshCw, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago, faNum } from "@/lib/format";
import { Button, Card, CardHeader, Chip, Dialog, Field, Input, PageHeader, Switch, Tabs, Textarea, cn } from "@/components/ui/primitives";
import { ListRowsSkeleton } from "@/components/ui/skeletons";

type Health = { ok: boolean | null; latency_ms: number | null; error?: string; checked_at?: string };
type Node = { id: number; name: string; protocol: string; address: string; purposes: string[]; enabled: boolean; error: string; health: Record<string, Health>; active_for: string[] };
type Purpose = { id: string; label: string; mode: "auto" | "proxy" | "direct"; healthy: number; total: number };
type State = { nodes: Node[]; purposes: Purpose[]; xray: { installed: boolean; running: boolean; error: string } };

const MODES = [
  { value: "auto", label: "خودکار" },
  { value: "proxy", label: "فقط پروکسی" },
  { value: "direct", label: "بدون پروکسی" },
] as const;
const MODE_HINT: Record<string, string> = {
  auto: "از سریع‌ترین پروکسی سالم؛ اگر هیچ‌کدام وصل نشد، پروکسی تکی قدیمی و بعد اتصال مستقیم.",
  proxy: "فقط از پروکسی‌ها؛ هیچ‌وقت مستقیم وصل نمی‌شود.",
  direct: "بدون هیچ پروکسی، مستقیم از سرور (برای سرور خارج از ایران).",
};
const PROTO: Record<string, string> = { vless: "VLESS", vmess: "VMess", trojan: "Trojan", ss: "Shadowsocks", socks: "SOCKS", http: "HTTP" };

function HealthChip({ label, h, active }: { label: string; h?: Health; active: boolean }) {
  if (!h || h.ok == null) return <Chip>{label}: تست نشده</Chip>;
  return (
    <span title={h.error || (h.checked_at ? `بررسی ${ago(h.checked_at)}` : "")}>
      <Chip tone={h.ok ? (active ? "primary" : "success") : "danger"} icon={active ? <Zap className="size-3" aria-hidden /> : undefined}>
        {label}: {h.ok ? (h.latency_ms ? `${faNum(h.latency_ms)}ms` : "وصل") : "قطع"}
      </Chip>
    </span>
  );
}

function ImportDialog({ open, onClose, purposes, onDone }: { open: boolean; onClose: () => void; purposes: Purpose[]; onDone: (s: any) => void }) {
  const [text, setText] = useState("");
  const [sub, setSub] = useState("");
  const [use, setUse] = useState<string[]>(purposes.map((p) => p.id));
  const run = useMutation({
    mutationFn: () => api<any>("/admin/proxies/import", { method: "POST", json: { text, subscription_url: sub, purposes: use } }),
    onSuccess: (r) => {
      onDone(r);
      if (r.added) toast.success(`${faNum(r.added)} پروکسی اضافه شد؛ تست سلامت شروع شد.`);
      if (r.skipped.length) toast.warning(`${faNum(r.skipped.length)} خط رد شد: ${r.skipped.slice(0, 3).map((s: any) => s.error).join(" · ")}`);
      if (r.added) { setText(""); setSub(""); onClose(); }
    },
    onError: (e: any) => toast.error(e.message),
  });
  const toggle = (id: string) => setUse(use.includes(id) ? use.filter((x) => x !== id) : [...use, id]);
  return (
    <Dialog open={open} onClose={onClose} title="افزودن پروکسی" wide>
      <div className="space-y-4">
        <Field label="لینک‌ها" hint="هر لینک در یک خط: vless:// ، vmess:// ، trojan:// ، ss:// یا socks5:// و http://">
          <Textarea dir="ltr" rows={7} className="text-left font-mono text-[12px]" value={text} onChange={(e) => setText(e.target.value)}
            placeholder={"vless://uuid@host:443?security=reality&...#name\nvmess://eyJ2Ijoi..."} />
        </Field>
        <Field label="یا لینک اشتراک (subscription)" hint="لیست از این آدرس یک‌بار خوانده و اضافه می‌شود.">
          <Input dir="ltr" className="text-left font-mono text-[13px]" value={sub} onChange={(e) => setSub(e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="برای کدام کارها؟">
          <div className="flex flex-wrap gap-4">
            {purposes.map((p) => <label key={p.id} className="flex items-center gap-2 text-[14px]"><Switch checked={use.includes(p.id)} onChange={() => toggle(p.id)} />{p.label}</label>)}
          </div>
        </Field>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>انصراف</Button>
          <Button loading={run.isPending} disabled={!use.length || (!text.trim() && !sub.trim())} onClick={() => run.mutate()}>افزودن و تست</Button>
        </div>
      </div>
    </Dialog>
  );
}

export default function AdminProxies() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-proxies"], queryFn: () => api<State>("/admin/proxies"), refetchInterval: 20_000 });
  const [adding, setAdding] = useState(false);
  const set = (d: State) => qc.setQueryData(["admin-proxies"], d);
  const call = (path: string, init?: any) => api<State>(path, init).then(set).catch((e: any) => toast.error(e.message));
  const checkAll = useMutation({ mutationFn: () => api<State>("/admin/proxies/check", { method: "POST" }), onSuccess: set, onError: (e: any) => toast.error(e.message) });
  const [checking, setChecking] = useState<number | null>(null);

  if (!data) return (<><PageHeader title="پروکسی‌ها" /><Card strong><ListRowsSkeleton rows={6} icon={false} /></Card></>);
  const label = (id: string) => data.purposes.find((p) => p.id === id)?.label ?? id;
  const needsXray = data.nodes.some((n) => !["socks", "http"].includes(n.protocol));

  return (
    <>
      <PageHeader title="پروکسی‌ها" subtitle="برای کارهای تلگرام و اینستاگرام؛ هر درخواست از سریع‌ترین پروکسی سالم همان کار می‌رود و اگر قطع شد، سراغ بعدی."
        actions={<>
          <Button variant="secondary" icon={<RefreshCw className="size-4" />} loading={checkAll.isPending} disabled={!data.nodes.length} onClick={() => checkAll.mutate()}>تست همه</Button>
          <Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>افزودن</Button>
        </>} />

      {needsXray && !data.xray.running && (
        <Card className="p-4 mb-4 text-[14px] leading-7 border border-danger/30">
          <div className="font-bold text-danger">هستهٔ Xray اجرا نیست</div>
          <p className="text-muted">{data.xray.error || "لینک‌های v2ray بدون Xray کار نمی‌کنند."} ایمیج Docker بک‌اند Xray را دارد؛ روی اجرای لوکال، Xray را نصب کن و مسیرش را در SELLO_XRAY_PATH بگذار. پروکسی‌های socks/http ساده بدون Xray هم کار می‌کنند.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {data.purposes.map((p) => (
          <Card key={p.id}>
            <CardHeader title={p.label}
              subtitle={p.mode === "direct" ? "اتصال مستقیم" : `${faNum(p.healthy)} از ${faNum(p.total)} پروکسی سالم`}
              action={<Chip tone={p.mode === "direct" ? "neutral" : p.healthy ? "success" : p.total ? "danger" : "warning"}>
                {p.mode === "direct" ? "بدون پروکسی" : p.healthy ? "وصل" : p.total ? "همه قطع" : "پروکسی ندارد"}</Chip>} />
            <div className="px-4 sm:px-5 pb-5 space-y-2">
              <Tabs value={p.mode} onChange={(v) => call("/admin/proxies/modes", { method: "PUT", json: { modes: { [p.id]: v } } })} items={MODES.map((m) => ({ ...m }))} />
              <p className="text-[12px] text-muted leading-6">{MODE_HINT[p.mode]}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card strong>
        {data.nodes.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <Activity className="size-8 mx-auto text-muted" aria-hidden />
            <div className="font-bold">هنوز پروکسی‌ای اضافه نشده</div>
            <p className="text-[13px] text-muted">لینک‌های v2ray را یکجا paste کن؛ هر کدام با همان سرویسی که برایش گذاشتی تست می‌شود.</p>
            <Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>افزودن پروکسی</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-2">
              <div className="font-bold text-[14px]">{faNum(data.nodes.length)} پروکسی</div>
              <Button size="sm" variant="ghost" icon={<Trash2 className="size-4" />}
                onClick={() => confirm("همهٔ پروکسی‌هایی که در آخرین تست برای همهٔ کارهایشان قطع بودند حذف شوند؟") &&
                  api<any>("/admin/proxies/delete-failed", { method: "POST" }).then((r) => { set(r); toast.success(`${faNum(r.removed)} پروکسی حذف شد`); }).catch((e: any) => toast.error(e.message))}>
                حذف قطع‌ها</Button>
            </div>
            <ul className="divide-y divide-[var(--glass-edge)]">
              {data.nodes.map((n) => (
                <li key={n.id} className={cn("p-4 flex flex-wrap items-center gap-3", !n.enabled && "opacity-55")}>
                  <Switch checked={n.enabled} label={n.enabled ? "غیرفعال کن" : "فعال کن"} onChange={(v) => call(`/admin/proxies/${n.id}`, { method: "PATCH", json: { enabled: v } })} />
                  <div className="flex-1 min-w-48">
                    <div className="font-semibold text-[14px] flex items-center gap-2"><Chip>{PROTO[n.protocol] ?? n.protocol}</Chip><span className="truncate">{n.name || n.address}</span></div>
                    <div className="text-[12px] text-muted mt-1" dir="ltr">{n.address}</div>
                    {n.error && n.enabled && <div className="text-[12px] text-danger mt-1">{n.error}</div>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.purposes.map((p) => {
                      const on = n.purposes.includes(p.id);
                      return (
                        <button key={p.id} className="cursor-pointer" title={on ? `برداشتن از ${p.label}` : `استفاده برای ${p.label}`}
                          onClick={() => { const next = on ? n.purposes.filter((x) => x !== p.id) : [...n.purposes, p.id]; if (next.length) call(`/admin/proxies/${n.id}`, { method: "PATCH", json: { purposes: next } }); }}>
                          {on ? <HealthChip label={label(p.id)} h={n.health[p.id]} active={n.active_for.includes(p.id)} /> : <Chip className="opacity-50">+ {p.label}</Chip>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" aria-label="تست" icon={<RefreshCw className="size-4" />} loading={checking === n.id} disabled={!n.enabled}
                      onClick={() => { setChecking(n.id); call(`/admin/proxies/${n.id}/check`, { method: "POST" }).finally(() => setChecking(null)); }} />
                    <Button size="sm" variant="ghost" aria-label="حذف" icon={<Trash2 className="size-4 text-danger" />}
                      onClick={() => confirm(`«${n.name || n.address}» حذف شود؟`) && call(`/admin/proxies/${n.id}`, { method: "DELETE" })} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      <p className="text-[12px] text-muted mt-3 leading-6"><Zap className="size-3 inline" aria-hidden /> یعنی همین الان درخواست‌های آن کار از این پروکسی می‌رود. هر ۳ دقیقه همه تست می‌شوند و پروکسی‌ای که وسط کار قطع شود، زودتر دوباره تست می‌شود. بله همیشه مستقیم وصل می‌شود.</p>
      <ImportDialog open={adding} onClose={() => setAdding(false)} purposes={data.purposes} onDone={set} />
    </>
  );
}
