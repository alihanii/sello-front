"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Ban, CreditCard, LockOpen } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago, faDigits, faNum, jDate, toman } from "@/lib/format";
import { PLATFORMS } from "@/lib/meta";
import { PlatformIcon } from "@/components/ui/status";
import { Button, Card, CardHeader, Chip, Dialog, Field, Input, Select, Switch } from "@/components/ui/primitives";
import { AdminDetailSkeleton } from "@/components/ui/skeletons";

const STATUS: Record<string, [string, string]> = {
  active: ["success", "پلن فعال"], free: ["neutral", "آزمایشی (بدون پلن)"], expired: ["danger", "پلن تمام شده · AI خاموش"],
  blocked: ["danger", "بلاک · AI خاموش"], admin: ["warning", "ادمین"],
};
const HEALTH: Record<string, string> = { connected: "bg-success", error: "bg-danger", expired: "bg-danger", disconnected: "bg-neutral" };

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-user", id], queryFn: () => api(`/admin/users/${id}`) });
  const { data: plans = [] } = useQuery({ queryKey: ["admin-plans"], queryFn: () => api<any[]>("/admin/plans") });
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"now" | "after">("after");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-user", id] });
  const activate = useMutation({
    mutationFn: () => api(`/admin/users/${id}/subscriptions`, { method: "POST", json: { plan_id: Number(planId), note, mode } }),
    onSuccess: (r) => { toast.success(`پلن فعال شد تا ${jDate(r.ends_at)}`); setOpen(false); setPlanId(""); setNote(""); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });
  const cancel = useMutation({ mutationFn: (sid: number) => api(`/admin/subscriptions/${sid}/cancel`, { method: "POST" }), onSuccess: refresh });
  const setActive = useMutation({
    mutationFn: (v: boolean) => api(`/admin/users/${id}/active`, { method: "POST", json: { is_active: v } }),
    onSuccess: (_r, v) => { toast.success(v ? "کاربر از بلاک خارج شد" : "کاربر بلاک شد"); refresh(); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const feature = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => api(`/admin/users/${id}/features/${key}`, { method: "POST", json: { enabled } }),
    onSuccess: () => { refresh(); qc.invalidateQueries({ queryKey: ["admin-features"] }); }, onError: (e: any) => toast.error(e.message),
  });
  if (!data) return <AdminDetailSkeleton />;
  const u = data.user;
  const hasActive = data.subscriptions.some((s: any) => s.status === "active" && new Date(s.ends_at) > new Date());
  const [tone, statusLabel] = STATUS[data.plan_status] ?? ["neutral", data.plan_status];
  return (
    <>
      <Link href="/admin/users" className="text-muted text-[13px] inline-flex items-center gap-1 hover:text-fg mb-3"><ArrowRight className="size-4" />کاربران</Link>
      <Card className="p-5 mb-4 flex flex-wrap items-center gap-4">
        <span className="size-14 rounded-2xl bg-primary/12 text-primary grid place-items-center text-[20px] font-black">{(u.name || "ک")[0]}</span>
        <div className="flex-1">
          <h1 className="text-[20px] font-extrabold flex flex-wrap items-center gap-2">{u.name || "بدون نام"}<Chip tone={tone}>{statusLabel}</Chip></h1>
          <div className="text-muted text-[13px] tnum">{faDigits(u.phone)} · عضو از {jDate(u.created_at)} · آخرین ورود {ago(u.last_login_at)}</div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button className="flex-1 sm:flex-none" icon={<CreditCard className="size-4" />} onClick={() => { setMode(hasActive ? "now" : "after"); setOpen(true); }}>{hasActive ? "تغییر / تمدید پلن" : "گذاشتن پلن"}</Button>
          {u.role !== "admin" && <Button className="flex-1 sm:flex-none" variant={u.is_active ? "danger" : "secondary"} loading={setActive.isPending}
            icon={u.is_active ? <Ban className="size-4" /> : <LockOpen className="size-4" />}
            onClick={() => (!u.is_active || confirm("کاربر بلاک شود؟ نمی‌تواند وارد شود و دستیار چت فروشگاه‌هایش خاموش می‌شود.")) && setActive.mutate(!u.is_active)}>
            {u.is_active ? "بلاک" : "رفع بلاک"}</Button>}
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          {data.stores.length === 0 && <Card className="p-5 text-muted">این کاربر هنوز فروشگاهی نساخته.</Card>}
          {data.stores.map((s: any) => (
            <Card key={s.id}>
              <CardHeader title={s.name} subtitle={`${faNum(s.products)} محصول · ${faNum(s.publishes)} انتشار موفق · ساخته‌شده ${jDate(s.created_at)}`}
                action={<Link href={`/admin/stores?focus=${s.id}`} className="text-primary text-[13px]">جزئیات</Link>} />
              <div className="px-5 pb-5 flex flex-wrap gap-2">
                {s.channels.length === 0 ? <span className="text-muted text-[13px]">بدون کانال</span> : s.channels.map((c: any) => (
                  <span key={c.id} className="glass rounded-xl px-3 py-2 flex items-center gap-2 text-[13px]">
                    <PlatformIcon platform={c.platform} size={22} />{c.display_name || PLATFORMS[c.platform].label}
                    <span className={`size-2 rounded-full ${HEALTH[c.status]}`} />
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-4">
        {data.limits && (
          <Card>
            <CardHeader title="مصرف این ماه" />
            <div className="px-5 pb-5 space-y-3 text-[13px]">
              {[["جواب AI چت", data.usage.chat_messages, data.limits.monthly_chat_messages], ["اعتبار AI", data.usage.ai_credits, data.limits.monthly_ai_credits],
                ["محصول", data.usage.products, data.limits.max_products], ["کانال", data.usage.channels, data.limits.max_channels], ["فروشگاه", data.usage.stores, data.limits.max_stores]]
                .map(([l, used, lim]: any) => {
                  const pct = lim >= 100000 ? 0 : lim ? Math.min(100, Math.round((100 * used) / lim)) : 100;
                  return (
                    <div key={l}>
                      <div className="flex justify-between gap-2"><span className="font-semibold">{l}</span><span className="text-muted tnum">{lim >= 100000 ? "نامحدود" : `${faNum(used)} از ${faNum(lim)}`}</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-subtle overflow-hidden"><div className={`h-full rounded-full ${pct >= 100 ? "bg-danger" : pct >= 80 ? "bg-warning" : "bg-primary"}`} style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
            </div>
          </Card>
        )}
        <Card>
          <CardHeader title="اشتراک‌ها" />
          <ul className="px-5 pb-5 space-y-3">
            {data.subscriptions.length === 0 && <li className="text-muted text-[13px]">بدون اشتراک (رایگان)</li>}
            {data.subscriptions.map((s: any) => (
              <li key={s.id} className="rounded-xl bg-subtle p-3 text-[13px]">
                <div className="flex justify-between font-bold">{s.plan} ({faNum(s.duration_months)} ماهه)<Chip tone={s.status !== "active" ? "neutral" : new Date(s.ends_at) < new Date() ? "danger" : new Date(s.starts_at) > new Date() ? "warning" : "success"}>{s.status !== "active" ? "لغوشده" : new Date(s.ends_at) < new Date() ? "تمام‌شده" : new Date(s.starts_at) > new Date() ? "در صف" : "فعال"}</Chip></div>
                <div className="text-muted mt-1">{jDate(s.starts_at)} تا {jDate(s.ends_at)}</div>
                {s.note && <div className="text-muted">{s.note}</div>}
                {s.status === "active" && new Date(s.ends_at) > new Date() && <button className="text-danger text-[12px] mt-1 cursor-pointer" onClick={() => confirm("اشتراک لغو شود؟") && cancel.mutate(s.id)}>لغو اشتراک</button>}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="قابلیت‌ها" action={<Link href="/admin/features" className="text-primary text-[13px] font-bold">همهٔ کاربران</Link>} />
          <ul className="px-5 pb-5 space-y-3">
            {Object.entries(data.features ?? {}).map(([key, f]: any) => (
              <li key={key} className="flex items-center justify-between gap-3 text-[14px]">
                <span>{f.label}
                  <span className="block text-[12px] text-muted">{u.role === "admin" ? "ادمین همیشه دارد" : f.mode === "all" ? "برای همه باز است" : f.mode === "none" ? "برای همه بسته است" : f.allowed ? "دسترسی دارد" : "دسترسی ندارد"}</span>
                </span>
                <Switch checked={f.selected || f.mode === "all" || u.role === "admin"} disabled={f.mode !== "selected" || u.role === "admin" || feature.isPending}
                  onChange={(v) => feature.mutate({ key, enabled: v })} label={f.label} />
              </li>
            ))}
          </ul>
        </Card>
        </div>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title={hasActive ? "تغییر یا تمدید پلن" : "گذاشتن پلن"}>
        <div className="space-y-4">
          <Field label="پلن" hint="پلن‌هایی که فروششان خاموش است هم اینجا هستند؛ ادمین می‌تواند آن‌ها را بدهد."><Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
            <option value="">انتخاب کنید</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name} · {faNum(p.duration_months)} ماهه · {toman(p.price_toman)}{p.is_active ? "" : " (فروش خاموش)"}</option>)}
          </Select></Field>
          {hasActive && (
            <div role="radiogroup" aria-label="شروع پلن" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([["now", "همین الان عوض شود", "پلن فعلی تمام می‌شود و پلن جدید از امروز شروع می‌شود."], ["after", "بعد از پلن فعلی", "تمدید: پلن جدید بعد از تمام شدن پلن فعلی شروع می‌شود."]] as const).map(([m, t, d]) => (
                <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
                  className={`rounded-xl border p-3 text-start text-[13px] cursor-pointer transition ${mode === m ? "border-primary bg-primary/8" : "border-edge hover:bg-subtle"}`}>
                  <span className="block font-bold">{t}</span><span className="block text-muted text-[12px] mt-0.5">{d}</span>
                </button>
              ))}
            </div>
          )}
          <Field label="یادداشت (مثلاً شمارهٔ پرداخت)"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <Button className="w-full" disabled={!planId} loading={activate.isPending} onClick={() => activate.mutate()}>{hasActive && mode === "now" ? "عوض کردن پلن" : "فعال‌سازی"}</Button>
        </div>
      </Dialog>
    </>
  );
}
