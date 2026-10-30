"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CreditCard } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago, faDigits, faNum, jDate, toman } from "@/lib/format";
import { PLATFORMS } from "@/lib/meta";
import { PlatformIcon } from "@/components/ui/status";
import { Button, Card, CardHeader, Chip, Dialog, Field, Input, Select, Skeleton } from "@/components/ui/primitives";

const HEALTH: Record<string, string> = { connected: "bg-success", error: "bg-danger", expired: "bg-danger", disconnected: "bg-neutral" };

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-user", id], queryFn: () => api(`/admin/users/${id}`) });
  const { data: plans = [] } = useQuery({ queryKey: ["admin-plans"], queryFn: () => api<any[]>("/admin/plans") });
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState("");
  const [note, setNote] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-user", id] });
  const activate = useMutation({
    mutationFn: () => api(`/admin/users/${id}/subscriptions`, { method: "POST", json: { plan_id: Number(planId), note } }),
    onSuccess: (r) => { toast.success(`پلن فعال شد تا ${jDate(r.ends_at)}`); setOpen(false); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });
  const cancel = useMutation({ mutationFn: (sid: number) => api(`/admin/subscriptions/${sid}/cancel`, { method: "POST" }), onSuccess: refresh });
  const setActive = useMutation({ mutationFn: (v: boolean) => api(`/admin/users/${id}/active`, { method: "POST", json: { is_active: v } }), onSuccess: refresh, onError: (e: any) => toast.error(e.message) });
  if (!data) return <Skeleton className="h-96" />;
  const u = data.user;
  return (
    <>
      <Link href="/admin/users" className="text-muted text-[13px] inline-flex items-center gap-1 hover:text-fg mb-3"><ArrowRight className="size-4" />کاربران</Link>
      <Card className="p-5 mb-4 flex flex-wrap items-center gap-4">
        <span className="size-14 rounded-2xl bg-primary/12 text-primary grid place-items-center text-[20px] font-black">{(u.name || "ک")[0]}</span>
        <div className="flex-1">
          <h1 className="text-[20px] font-extrabold">{u.name || "بدون نام"}</h1>
          <div className="text-muted text-[13px] tnum">{faDigits(u.phone)} · عضو از {jDate(u.created_at)} · آخرین ورود {ago(u.last_login_at)}</div>
        </div>
        <Button icon={<CreditCard className="size-4" />} onClick={() => setOpen(true)}>فعال‌سازی / تمدید پلن</Button>
        {u.role !== "admin" && <Button variant={u.is_active ? "danger" : "secondary"} onClick={() => setActive.mutate(!u.is_active)}>{u.is_active ? "غیرفعال کردن" : "فعال کردن"}</Button>}
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
        <Card>
          <CardHeader title="اشتراک‌ها" />
          <ul className="px-5 pb-5 space-y-3">
            {data.subscriptions.length === 0 && <li className="text-muted text-[13px]">بدون اشتراک (رایگان)</li>}
            {data.subscriptions.map((s: any) => (
              <li key={s.id} className="rounded-xl bg-subtle p-3 text-[13px]">
                <div className="flex justify-between font-bold">{s.plan} ({faNum(s.duration_months)} ماهه)<Chip tone={s.status === "active" ? "success" : "neutral"}>{s.status === "active" ? "فعال" : "لغوشده"}</Chip></div>
                <div className="text-muted mt-1">{jDate(s.starts_at)} تا {jDate(s.ends_at)}</div>
                {s.note && <div className="text-muted">{s.note}</div>}
                {s.status === "active" && <button className="text-danger text-[12px] mt-1 cursor-pointer" onClick={() => confirm("اشتراک لغو شود؟") && cancel.mutate(s.id)}>لغو اشتراک</button>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title="فعال‌سازی پلن">
        <div className="space-y-4">
          <Field label="پلن"><Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
            <option value="">انتخاب کنید</option>
            {plans.filter((p) => p.is_active).map((p) => <option key={p.id} value={p.id}>{p.name} · {faNum(p.duration_months)} ماهه · {toman(p.price_toman)}</option>)}
          </Select></Field>
          <Field label="یادداشت (مثلاً شمارهٔ پرداخت)"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <p className="text-[12px] text-muted">اگر کاربر اشتراک فعال داشته باشد، پلن جدید بعد از پایان آن شروع می‌شود.</p>
          <Button className="w-full" disabled={!planId} loading={activate.isPending} onClick={() => activate.mutate()}>فعال‌سازی</Button>
        </div>
      </Dialog>
    </>
  );
}
