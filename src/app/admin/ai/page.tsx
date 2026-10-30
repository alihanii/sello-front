"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Pencil, Plus, Trash2, XCircle, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago, ms, toman } from "@/lib/format";
import { Button, Card, CardHeader, Chip, EmptyState, Input, PageHeader, Select } from "@/components/ui/primitives";

import { EMPTY_KEY, KIND_LABEL, KeyEditor } from "@/components/admin/AiKeyEditor";

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
    onError: (e: any) => toast.error(e.message),
  });
  const providers: any[] = data?.providers ?? [];
  const active = providers.filter((p) => p.is_active);
  const empty = EMPTY_KEY;

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

/** Models the chosen key can use, filtered to what this task needs (text/JSON vs image output). */
function useTaskModels(providerId: number | null, providers: any[], needs: string) {
  const p = providers.find((x) => x.id === providerId);
  const { data } = useQuery({
    queryKey: ["ai-models", providerId], enabled: !!p, staleTime: 10 * 60_000, retry: false,
    queryFn: () => api<{ models: string[]; image_models: string[] }>(`/admin/ai/models?provider_id=${p.id}`, {
      method: "POST", json: { kind: p.kind, base_url: p.base_url, api_key: "", proxy: p.proxy ?? "" } }),
  });
  return (needs === "image" ? data?.image_models : data?.models) ?? [];
}

function ModelPick({ value, models, needs, onChange }: { value: string; models: string[]; needs: string; onChange: (v: string) => void }) {
  if (!models.length) return <Input dir="ltr" className="h-9 text-[13px]" placeholder={needs === "image" ? "gemini-…-image" : "پیش‌فرض کلید"} value={value} onChange={(e) => onChange(e.target.value)} />;
  return (
    <Select dir="ltr" className="h-9 text-[13px] text-left" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{needs === "image" ? "— انتخاب مدل تصویری —" : "پیش‌فرض کلید"}</option>
      {value && !models.includes(value) && <option value={value}>{value} (نامناسب)</option>}
      {models.map((m) => <option key={m} value={m}>{m}</option>)}
    </Select>
  );
}

function RouteRow({ route, providers, onSave }: { route: any; providers: any[]; onSave: (r: any) => void }) {
  const [r, setR] = useState(route);
  const dirty = JSON.stringify(r) !== JSON.stringify(route);
  const models = useTaskModels(r.provider_id, providers, route.needs);
  const fbModels = useTaskModels(r.fallback_provider_id, providers, route.needs);
  const sel = (k: string) => (
    <Select className="h-9 text-[13px]" value={r[k] ?? ""} onChange={(e) => setR({ ...r, [k]: e.target.value ? Number(e.target.value) : null })}>
      <option value="">—</option>{providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </Select>
  );
  return (
    <tr className="border-b border-edge last:border-0">
      <td className="p-3 font-semibold">{route.label}{route.needs === "image" && <div className="text-[11px] text-muted font-normal mt-0.5">فقط مدل‌هایی که عکس می‌سازند</div>}</td>
      <td className="p-2">{sel("provider_id")}</td>
      <td className="p-2"><ModelPick value={r.model} models={models} needs={route.needs} onChange={(v) => setR({ ...r, model: v })} /></td>
      <td className="p-2">{sel("fallback_provider_id")}</td>
      <td className="p-2"><ModelPick value={r.fallback_model} models={fbModels} needs={route.needs} onChange={(v) => setR({ ...r, fallback_model: v })} /></td>
      <td className="p-2"><Input dir="ltr" type="number" className="h-9 w-20 text-[13px]" value={r.temperature / 100} step={0.1} min={0} max={1} onChange={(e) => setR({ ...r, temperature: Math.round(Number(e.target.value) * 100) })} /></td>
      <td className="p-2"><Button size="sm" disabled={!dirty} onClick={() => onSave(r)}>ذخیره</Button></td>
    </tr>
  );
}
