"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { faNum, toman } from "@/lib/format";
import { PlanCards } from "@/components/plans/PlanCards";
import { Button, Card, Chip, Dialog, Field, Input, PageHeader, Select, Switch, Textarea } from "@/components/ui/primitives";

const LIMITS: [string, string][] = [["max_stores", "حداکثر فروشگاه"], ["max_channels", "حداکثر کانال"], ["max_products", "حداکثر محصول"], ["monthly_publishes", "انتشار در ماه"], ["monthly_ai_credits", "اعتبار AI در ماه"]];
const empty = { name: "", tier: "", duration_months: 1, price_toman: 0, compare_at_toman: 0, description: "", features: [], limits: { max_stores: 1, max_channels: 2, max_products: 100, monthly_publishes: 100, monthly_ai_credits: 20, crawl_frequency: "daily" }, is_featured: false, is_active: true, sort_order: 0 };

function PlanEditor({ plan, onClose }: { plan: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [p, setP] = useState<any>(plan);
  const save = useMutation({
    mutationFn: () => api(plan.id ? `/admin/plans/${plan.id}` : "/admin/plans", { method: plan.id ? "PUT" : "POST", json: p }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-plans"] }); qc.invalidateQueries({ queryKey: ["plans"] }); toast.success("ذخیره شد"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  const n = (v: string) => Number(v.replace(/\D/g, "") || 0);
  return (
    <Dialog open onClose={onClose} title={plan.id ? "ویرایش پلن" : "پلن جدید"} wide>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="نام"><Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
            <Field label="گروه (tier)" hint="نسخه‌های ۱/۳/۱۲ ماههٔ یک پلن"><Input dir="ltr" value={p.tier} onChange={(e) => setP({ ...p, tier: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="مدت"><Select value={p.duration_months} onChange={(e) => setP({ ...p, duration_months: Number(e.target.value) })}><option value={1}>یک‌ماهه</option><option value={3}>سه‌ماهه</option><option value={12}>یک‌ساله</option></Select></Field>
            <Field label="قیمت (تومان)"><Input dir="ltr" className="tnum" value={p.price_toman.toLocaleString("en")} onChange={(e) => setP({ ...p, price_toman: n(e.target.value) })} /></Field>
            <Field label="قیمت خط‌خورده"><Input dir="ltr" className="tnum" value={p.compare_at_toman.toLocaleString("en")} onChange={(e) => setP({ ...p, compare_at_toman: n(e.target.value) })} /></Field>
          </div>
          <Field label="توضیح کوتاه"><Input value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} /></Field>
          <Field label="قابلیت‌ها (هر خط یک مورد؛ روی کارت نمایش داده می‌شود)"><Textarea rows={5} value={p.features.join("\n")} onChange={(e) => setP({ ...p, features: e.target.value.split("\n").filter(Boolean) })} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LIMITS.map(([k, l]) => <Field key={k} label={l}><Input dir="ltr" type="number" value={p.limits[k] ?? 0} onChange={(e) => setP({ ...p, limits: { ...p.limits, [k]: Number(e.target.value) } })} /></Field>)}
            <Field label="فرکانس کرال"><Select value={p.limits.crawl_frequency} onChange={(e) => setP({ ...p, limits: { ...p.limits, crawl_frequency: e.target.value } })}><option value="daily">روزانه</option><option value="hourly">ساعتی</option></Select></Field>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-[14px]"><Switch checked={p.is_featured} onChange={(v) => setP({ ...p, is_featured: v })} />پیشنهادی</label>
            <label className="flex items-center gap-2 text-[14px]"><Switch checked={p.is_active} onChange={(v) => setP({ ...p, is_active: v })} />فعال</label>
          </div>
          <Button className="w-full" loading={save.isPending} onClick={() => save.mutate()}>ذخیره</Button>
        </div>
        <div>
          <div className="text-[13px] font-bold text-muted mb-2">پیش‌نمایش کارت</div>
          <div className="[&_.grid]:!grid-cols-1 [&>div>div:first-child]:hidden"><PlanCards plans={[{ ...p, id: p.id ?? -1, duration_months: 1 }]} onSelect={() => {}} /></div>
        </div>
      </div>
    </Dialog>
  );
}

export default function AdminPlans() {
  const { data = [] } = useQuery({ queryKey: ["admin-plans"], queryFn: () => api<any[]>("/admin/plans") });
  const [edit, setEdit] = useState<any>(null);
  return (
    <>
      <PageHeader title="پلن‌ها" subtitle="کارت‌های قیمت، قابلیت‌ها و محدودیت‌ها از اینجا مدیریت می‌شوند" actions={<Button icon={<Plus className="size-4" />} onClick={() => setEdit(empty)}>پلن جدید</Button>} />
      <Card strong className="overflow-x-auto">
        <table className="w-full text-[14px] min-w-[720px]">
          <thead className="text-muted text-[12px]"><tr className="border-b border-edge">{["نام", "مدت", "قیمت", "محدودیت‌ها", "وضعیت", ""].map((h) => <th key={h} className="p-3 text-start font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id} className="border-b border-edge last:border-0">
                <td className="p-3 font-semibold">{p.name} {p.is_featured && <Chip tone="primary">پیشنهادی</Chip>}</td>
                <td className="p-3">{faNum(p.duration_months)} ماهه</td>
                <td className="p-3 tnum">{toman(p.price_toman)}{p.compare_at_toman > 0 && <span className="block text-[12px] text-muted line-through">{toman(p.compare_at_toman)}</span>}</td>
                <td className="p-3 text-[12px] text-muted">{faNum(p.limits.max_stores)} فروشگاه · {faNum(p.limits.max_channels)} کانال · {faNum(p.limits.max_products)} محصول</td>
                <td className="p-3">{p.is_active ? <Chip tone="success">فعال</Chip> : <Chip>غیرفعال</Chip>}</td>
                <td className="p-3"><Button size="sm" variant="ghost" icon={<Pencil className="size-4" />} onClick={() => setEdit(p)}>ویرایش</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {edit && <PlanEditor plan={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
