"use client";

import { Check, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { faDigits, toman } from "@/lib/format";
import { Button, Card, Chip, Tabs, cn } from "@/components/ui/primitives";

export function PlanCards({ plans, onSelect, currentPlanId, loadingId }: {
  plans: any[]; onSelect: (plan: any) => void; currentPlanId?: number; loadingId?: number;
}) {
  const [period, setPeriod] = useState<"1" | "3" | "12">("1");
  const visible = useMemo(() => plans.filter((p) => String(p.duration_months) === period), [plans, period]);
  const label = { "1": "یک‌ماهه", "3": "سه‌ماهه", "12": "یک‌ساله" };
  const maxDiscount = (m: string) => {
    const ps = plans.filter((p) => String(p.duration_months) === m && p.compare_at_toman);
    const d = Math.max(0, ...ps.map((p) => Math.round(100 - (100 * p.price_toman) / p.compare_at_toman)));
    return d ? ` (تا ${faDigits(d)}٪ تخفیف)` : "";
  };
  return (
    <div>
      <div className="flex justify-center mb-8">
        <Tabs value={period} onChange={setPeriod} items={(["1", "3", "12"] as const).map((v) => ({ value: v, label: label[v] + maxDiscount(v) }))} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {visible.map((p) => {
          const monthly = Math.round(p.price_toman / p.duration_months);
          const discount = p.compare_at_toman ? Math.round(100 - (100 * p.price_toman) / p.compare_at_toman) : 0;
          return (
            <Card key={p.id} strong={p.is_featured} className={cn("p-6 flex flex-col relative", p.is_featured && "md:-my-3 ring-2 ring-primary/50")}>
              {p.is_featured && <Chip tone="primary" className="absolute -top-3 start-6" icon={<Sparkles className="size-3" />}>پیشنهادی</Chip>}
              <h3 className="text-[18px] font-extrabold">{p.name}</h3>
              <p className="text-muted text-[13px] min-h-10">{p.description}</p>
              <div className="mt-4">
                {p.compare_at_toman > 0 && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="line-through text-muted tnum">{toman(p.compare_at_toman)}</span>
                    <Chip tone="success">{faDigits(discount)}٪ تخفیف</Chip>
                  </div>
                )}
                <div className="text-[28px] font-black tnum leading-10">{toman(p.price_toman)}</div>
                <div className="text-muted text-[13px]">
                  {p.duration_months > 1 ? <>معادل ماهی <span className="tnum">{toman(monthly)}</span></> : "ماهانه"}
                </div>
              </div>
              <ul className="mt-5 space-y-2.5 flex-1">
                {p.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2 text-[14px]">
                    <Check className="size-4 text-success mt-1 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full" variant={p.is_featured ? "primary" : "secondary"} size="lg"
                onClick={() => onSelect(p)} loading={loadingId === p.id} disabled={currentPlanId === p.id}>
                {currentPlanId === p.id ? "پلن فعلی شما" : "انتخاب این پلن"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
