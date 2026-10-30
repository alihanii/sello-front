"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { faDigits, toman } from "@/lib/format";
import { PlanCards } from "@/components/plans/PlanCards";
import { Button, Card, CardHeader, Field, Input, NumberInput, PageHeader, Select, Skeleton, Switch, Textarea } from "@/components/ui/primitives";

const LIMITS: [string, string][] = [["max_stores", "حداکثر فروشگاه"], ["max_channels", "حداکثر کانال"], ["max_products", "حداکثر محصول"], ["monthly_publishes", "انتشار در ماه"], ["monthly_ai_credits", "اعتبار AI در ماه"]];
const LABEL: Record<number, string> = { 1: "یک‌ماهه", 3: "سه‌ماهه", 12: "یک‌ساله" };

export default function AdminPlans() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-plan-config"], queryFn: () => api<any>("/admin/plan-config") });
  const [p, setP] = useState<any>(null);
  useEffect(() => { if (data) setP(data); }, [data]);
  const save = useMutation({
    mutationFn: () => api("/admin/plan-config", { method: "PUT", json: p }),
    onSuccess: (d: any) => { setP(d); qc.invalidateQueries({ queryKey: ["plans"] }); qc.setQueryData(["admin-plan-config"], d); toast.success("پلن ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!p) return <Skeleton className="h-96" />;
  const setPrice = (m: number, patch: any) => setP({ ...p, prices: p.prices.map((x: any) => (x.duration_months === m ? { ...x, ...patch } : x)) });
  const preview = p.prices.filter((x: any) => x.is_active).map((x: any) => ({ ...p, ...x, id: x.duration_months, is_featured: x.duration_months === 12 }));

  return (
    <>
      <PageHeader title="پلن" subtitle="یک پلن با همهٔ امکانات؛ فقط قیمت هر مدت (۱، ۳ و ۱۲ ماهه) جداست."
        actions={<Button loading={save.isPending} onClick={() => save.mutate()}>ذخیرهٔ تغییرات</Button>} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          <Card>
            <CardHeader title="قیمت هر مدت" subtitle="قیمت خط‌خورده اختیاری است و تخفیف را نشان می‌دهد." />
            <div className="px-4 sm:px-5 pb-5 space-y-3">
              {p.prices.map((x: any) => {
                const d = x.compare_at_toman ? Math.round(100 - (100 * x.price_toman) / x.compare_at_toman) : 0;
                return (
                  <div key={x.duration_months} className="grid grid-cols-2 sm:grid-cols-[110px_1fr_1fr_auto] items-end gap-3 p-3 rounded-2xl bg-subtle">
                    <div className="col-span-2 sm:col-span-1 font-bold text-[14px] pb-2.5">{LABEL[x.duration_months]}{d > 0 && <span className="block text-[12px] text-primary font-semibold">{faDigits(d)}٪ تخفیف</span>}</div>
                    <Field label="قیمت (تومان)"><NumberInput value={x.price_toman} onChange={(v) => setPrice(x.duration_months, { price_toman: v })} /></Field>
                    <Field label="قیمت خط‌خورده"><NumberInput value={x.compare_at_toman} onChange={(v) => setPrice(x.duration_months, { compare_at_toman: v })} /></Field>
                    <label className="col-span-2 sm:col-span-1 flex items-center gap-2 text-[13px] pb-2.5"><Switch checked={x.is_active} onChange={(v) => setPrice(x.duration_months, { is_active: v })} />فروش</label>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <CardHeader title="امکانات پلن" subtitle="برای همهٔ مدت‌ها یکسان است." />
            <div className="px-4 sm:px-5 pb-5 space-y-3">
              <Field label="نام"><Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
              <Field label="توضیح کوتاه"><Input value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} /></Field>
              <Field label="قابلیت‌ها (هر خط یک مورد)"><Textarea rows={6} value={p.features.join("\n")} onChange={(e) => setP({ ...p, features: e.target.value.split("\n") })} onBlur={() => setP({ ...p, features: p.features.filter((f: string) => f.trim()) })} /></Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LIMITS.map(([k, l]) => <Field key={k} label={l}><NumberInput value={p.limits[k] ?? 0} onChange={(v) => setP({ ...p, limits: { ...p.limits, [k]: v } })} /></Field>)}
                <Field label="فرکانس کرال"><Select value={p.limits.crawl_frequency ?? "daily"} onChange={(e) => setP({ ...p, limits: { ...p.limits, crawl_frequency: e.target.value } })}><option value="daily">روزانه</option><option value="hourly">ساعتی</option></Select></Field>
              </div>
            </div>
          </Card>
        </div>
        <div className="xl:sticky xl:top-24">
          <div className="text-[13px] font-bold text-muted mb-2">پیش‌نمایش صفحهٔ قیمت</div>
          {preview.length ? <PlanCards plans={preview} onSelect={() => {}} /> : <Card className="p-6 text-muted text-[14px]">هیچ مدتی برای فروش فعال نیست.</Card>}
          <p className="text-[12px] text-muted mt-2">قیمت ماهانه: {toman(p.prices.find((x: any) => x.duration_months === 1)?.price_toman ?? 0)}</p>
        </div>
      </div>
    </>
  );
}
