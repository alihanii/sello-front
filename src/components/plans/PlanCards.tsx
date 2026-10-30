"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { faDigits, toman } from "@/lib/format";
import { Button, Card, cn } from "@/components/ui/primitives";

const LABEL: Record<number, string> = { 1: "یک‌ماهه", 3: "سه‌ماهه", 12: "یک‌ساله" };

/** One plan, one feature list; the buyer only picks the billing period. */
export function PlanCards({ plans, onSelect, currentPlanId, loadingId }: {
  plans: any[]; onSelect: (plan: any) => void; currentPlanId?: number; loadingId?: number;
}) {
  const options = [...plans].sort((a, b) => a.duration_months - b.duration_months);
  const [selectedId, setSelectedId] = useState<number | undefined>();
  useEffect(() => {
    if (selectedId == null && options.length) setSelectedId((options.find((p) => p.is_featured) ?? options[0]).id);
  }, [options, selectedId]);
  const selected = options.find((p) => p.id === selectedId) ?? options[0];
  if (!selected) return null;
  const discount = (p: any) => (p.compare_at_toman ? Math.round(100 - (100 * p.price_toman) / p.compare_at_toman) : 0);

  return (
    <Card strong className="max-w-4xl mx-auto p-5 sm:p-8 grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-6 md:gap-10">
      <div>
        <h3 className="text-[22px] font-black tracking-tight">{selected.name}</h3>
        <p className="text-muted text-[14px] mt-1">{selected.description}</p>
        <ul className="mt-5 space-y-3">
          {selected.features.map((f: string) => (
            <li key={f} className="flex items-start gap-2.5 text-[14px]">
              <span className="size-5 rounded-full bg-primary/15 text-primary grid place-items-center mt-0.5 shrink-0"><Check className="size-3" /></span>{f}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3">
        <div className="text-[13px] font-bold text-muted">مدت اشتراک</div>
        <div role="radiogroup" aria-label="مدت اشتراک" className="flex flex-col gap-2">
          {options.map((p) => {
            const active = p.id === selected.id;
            const d = discount(p);
            return (
              <button key={p.id} role="radio" aria-checked={active} onClick={() => setSelectedId(p.id)}
                className={cn("flex items-center gap-3 rounded-2xl border p-4 text-start cursor-pointer transition-all duration-200",
                  active ? "border-primary bg-primary/8 shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_18%,transparent)]" : "border-edge hover:border-primary/40 hover:bg-subtle")}>
                <span className={cn("size-5 rounded-full border-2 grid place-items-center shrink-0 transition", active ? "border-primary" : "border-edge")}>
                  <span className={cn("size-2.5 rounded-full bg-primary transition-transform duration-200", active ? "scale-100" : "scale-0")} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 font-bold text-[15px]">
                    {LABEL[p.duration_months] ?? `${faDigits(p.duration_months)} ماهه`}
                    {d > 0 && <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-primary text-primary-fg">{faDigits(d)}٪ تخفیف</span>}
                  </span>
                  <span className="block text-[12px] text-muted tnum">
                    {p.duration_months > 1 ? <>ماهی {toman(Math.round(p.price_toman / p.duration_months))}</> : "پرداخت ماهانه"}
                  </span>
                </span>
                <span className="text-end">
                  {p.compare_at_toman > 0 && <span className="block text-[12px] text-muted line-through tnum">{toman(p.compare_at_toman)}</span>}
                  <span className="block font-black text-[16px] tnum">{toman(p.price_toman)}</span>
                </span>
              </button>
            );
          })}
        </div>
        <Button size="lg" className="mt-2 w-full" onClick={() => onSelect(selected)} loading={loadingId === selected.id}
          disabled={currentPlanId === selected.id}>
          {currentPlanId === selected.id ? "اشتراک فعلی شما" : `خرید اشتراک ${LABEL[selected.duration_months] ?? ""}`}
        </Button>
      </div>
    </Card>
  );
}
