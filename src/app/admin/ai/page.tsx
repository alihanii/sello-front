"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Pencil, Plus, Trash2, XCircle, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago, ms, toman } from "@/lib/format";
import { Button, Card, CardHeader, Chip, Dialog, EmptyState, Field, Input, PageHeader, Select, Switch } from "@/components/ui/primitives";

const KIND_LABEL: Record<string, string> = { gemini: "Gemini / متیس", openai: "OpenAI سازگار", anthropic: "Claude" };

function KeyEditor({ value, kinds, onClose }: { value: any; kinds: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [k, setK] = useState<any>({ api_key: "", ...value });
  const kindInfo = kinds.find((x) => x.kind === k.kind);
  const save = useMutation({
    mutationFn: () => api(value.id ? `/admin/ai/providers/${value.id}` : "/admin/ai/providers", { method: value.id ? "PUT" : "POST", json: k }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ai-providers"] }); toast.success("ذخیره شد"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open onClose={onClose} title={value.id ? "ویرایش کلید" : "افزودن کلید AI"}>
      <div className="space-y-3">
        <Field label="نام نمایشی"><Input value={k.name} onChange={(e) => setK({ ...k, name: e.target.value })} placeholder="مثلاً متیس اصلی" /></Field>
        <Field label="نوع سرویس"><Select value={k.kind} onChange={(e) => setK({ ...k, kind: e.target.value, base_url: "" })}>
          {kinds.map((x) => <option key={x.kind} value={x.kind}>{x.label}</option>)}</Select></Field>
        <Field label="آدرس پایه (Base URL)" hint={kindInfo?.hint || `پیش‌فرض: ${kindInfo?.base_url}`}>
          <Input dir="ltr" className="text-left" value={k.base_url} placeholder={kindInfo?.base_url} onChange={(e) => setK({ ...k, base_url: e.target.value })} />
        </Field>
        <Field label="کلید API" hint={value.id ? `کلید فعلی: ••••${value.key_hint}؛ برای تغییر، کلید جدید وارد کنید` : "رمزنگاری‌شده ذخیره می‌شود و دیگر نمایش داده نمی‌شود"}>
          <Input dir="ltr" type="password" className="text-left font-mono" value={k.api_key} onChange={(e) => setK({ ...k, api_key: e.target.value })} autoComplete="off" />
        </Field>
        <Field label="مدل پیش‌فرض"><Input dir="ltr" className="text-left" value={k.default_model} placeholder="gemini-2.5-flash" onChange={(e) => setK({ ...k, default_model: e.target.value })} /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Field label="قیمت ورودی/۱M توکن"><Input dir="ltr" type="number" value={k.input_price_per_m} onChange={(e) => setK({ ...k, input_price_per_m: Number(e.target.value) })} /></Field>
          <Field label="قیمت خروجی/۱M توکن"><Input dir="ltr" type="number" value={k.output_price_per_m} onChange={(e) => setK({ ...k, output_price_per_m: Number(e.target.value) })} /></Field>
          <Field label="بودجهٔ ماهانه"><Input dir="ltr" type="number" value={k.monthly_budget_toman} onChange={(e) => setK({ ...k, monthly_budget_toman: Number(e.target.value) })} /></Field>
        </div>
        <p className="text-[12px] text-muted">قیمت‌ها به تومان و فقط برای تخمین هزینه در مانیتورینگ استفاده می‌شوند.</p>
        <label className="flex items-center gap-2 text-[14px]"><Switch checked={k.is_active} onChange={(v) => setK({ ...k, is_active: v })} />فعال</label>
        <Button className="w-full" loading={save.isPending} disabled={!k.name || (!value.id && !k.api_key)} onClick={() => save.mutate()}>ذخیره</Button>
      </div>
    </Dialog>
  );
}

export default function AiKeys() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["ai-providers"], queryFn: () => api("/admin/ai/providers") });
  const { data: routes = [] } = useQuery({ queryKey: ["ai-routes"], queryFn: () => api<any[]>("/admin/ai/routes") });
  const [edit, setEdit] = useState<any>(null);
  const test = useMutation({
    mutationFn: (id: number) => api(`/admin/ai/providers/${id}/test`, { method: "POST" }),
    onSuccess: (r) => { if (r.ok) toast.success(`${r.message} (${ms(r.latency_ms)})`); else toast.error(r.message); qc.invalidateQueries({ queryKey: ["ai-providers"] }); },
  });
  const del = useMutation({ mutationFn: (id: number) => api(`/admin/ai/providers/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-providers"] }) });
  const setRoute = useMutation({
    mutationFn: (r: any) => api(`/admin/ai/routes/${r.task}`, { method: "PUT", json: r }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ai-routes"] }); toast.success("مسیر ذخیره شد"); },
  });
  const providers: any[] = data?.providers ?? [];
  const active = providers.filter((p) => p.is_active);
  const empty = { name: "", kind: "gemini", base_url: "https://api.metisai.ir", default_model: "gemini-2.5-flash", input_price_per_m: 0, output_price_per_m: 0, monthly_budget_toman: 0, is_active: true };

  return (
    <>
      <PageHeader title="کلیدهای AI" subtitle="کلیدها را اضافه کن و برای هر کار مشخص کن از کدام کلید و مدل استفاده شود."
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setEdit(empty)}>افزودن کلید</Button>} />
      {providers.length === 0 ? (
        <Card className="mb-6"><EmptyState icon={<KeyRound className="size-6" />} title="هنوز کلیدی اضافه نشده" text="تا وقتی کلیدی نباشد، کرال فقط قاعده‌محور کار می‌کند و ساخت محصول با AI غیرفعال است." action={<Button onClick={() => setEdit(empty)}>افزودن اولین کلید</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {providers.map((p) => (
            <Card key={p.id} className={`p-5 ${!p.is_active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div><div className="font-bold">{p.name}</div><div className="text-[12px] text-muted">{KIND_LABEL[p.kind]} · <span dir="ltr">••••{p.key_hint}</span></div></div>
                {p.is_active ? <Chip tone="success">فعال</Chip> : <Chip>غیرفعال</Chip>}
              </div>
              <div className="text-[12px] text-muted mt-3 space-y-0.5" dir="ltr" style={{ textAlign: "right" }}>
                <div>{p.base_url || "default"}</div><div>{p.default_model}</div>
              </div>
              {p.last_test_at && (
                <div className={`mt-3 text-[13px] flex items-center gap-1.5 ${p.last_test_ok ? "text-success" : "text-danger"}`}>
                  {p.last_test_ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}{p.last_test_message} · {ago(p.last_test_at)}
                </div>
              )}
              {p.monthly_budget_toman > 0 && <div className="text-[12px] text-muted mt-1">بودجه: {toman(p.monthly_budget_toman)} در ماه</div>}
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="secondary" icon={<Zap className="size-4" />} loading={test.isPending && test.variables === p.id} onClick={() => test.mutate(p.id)} disabled={!p.is_active}>تست کلید</Button>
                <Button size="sm" variant="ghost" icon={<Pencil className="size-4" />} onClick={() => setEdit(p)}>ویرایش</Button>
                <Button size="sm" variant="ghost" aria-label="حذف" onClick={() => confirm("کلید حذف شود؟") && del.mutate(p.id)}><Trash2 className="size-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Card strong>
        <CardHeader title="مسیردهی کارها" subtitle="هر کار از کدام کلید و مدل استفاده کند؛ اگر کلید اصلی خطا داد، کلید پشتیبان امتحان می‌شود. بدون مسیر، اولین کلید فعال استفاده می‌شود." />
        <div className="overflow-x-auto">
          <table className="w-full text-[14px] min-w-[860px]">
            <thead className="text-muted text-[12px]"><tr className="border-y border-edge">{["کار", "کلید اصلی", "مدل", "کلید پشتیبان", "مدل پشتیبان", "دما", ""].map((h) => <th key={h} className="p-3 text-start font-semibold">{h}</th>)}</tr></thead>
            <tbody>{routes.map((r) => <RouteRow key={r.task} route={r} providers={active} onSave={(v) => setRoute.mutate(v)} />)}</tbody>
          </table>
        </div>
      </Card>
      {edit && <KeyEditor value={edit} kinds={data?.kinds ?? []} onClose={() => setEdit(null)} />}
    </>
  );
}

function RouteRow({ route, providers, onSave }: { route: any; providers: any[]; onSave: (r: any) => void }) {
  const [r, setR] = useState(route);
  const dirty = JSON.stringify(r) !== JSON.stringify(route);
  const sel = (k: string) => (
    <Select className="h-9 text-[13px]" value={r[k] ?? ""} onChange={(e) => setR({ ...r, [k]: e.target.value ? Number(e.target.value) : null })}>
      <option value="">—</option>{providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </Select>
  );
  return (
    <tr className="border-b border-edge last:border-0">
      <td className="p-3 font-semibold">{route.label}</td>
      <td className="p-2">{sel("provider_id")}</td>
      <td className="p-2"><Input dir="ltr" className="h-9 text-[13px]" placeholder="پیش‌فرض کلید" value={r.model} onChange={(e) => setR({ ...r, model: e.target.value })} /></td>
      <td className="p-2">{sel("fallback_provider_id")}</td>
      <td className="p-2"><Input dir="ltr" className="h-9 text-[13px]" value={r.fallback_model} onChange={(e) => setR({ ...r, fallback_model: e.target.value })} /></td>
      <td className="p-2"><Input dir="ltr" type="number" className="h-9 w-20 text-[13px]" value={r.temperature / 100} step={0.1} min={0} max={1} onChange={(e) => setR({ ...r, temperature: Math.round(Number(e.target.value) * 100) })} /></td>
      <td className="p-2"><Button size="sm" disabled={!dirty} onClick={() => onSave(r)}>ذخیره</Button></td>
    </tr>
  );
}
