"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { faDigits, faNum } from "@/lib/format";
import { Button, Card, cn } from "@/components/ui/primitives";

const LABEL: Record<number, string> = { 1: "یک‌ماهه", 3: "سه‌ماهه", 12: "یک‌ساله" };
const SHORT: Record<number, string> = { 1: "۱ ماه", 3: "۳ ماه", 12: "۱۲ ماه" };
const periodLabel = (m: number) => LABEL[m] ?? `${faDigits(m)} ماهه`;
const discount = (p: any) => (p.compare_at_toman > p.price_toman ? Math.round(100 - (100 * p.price_toman) / p.compare_at_toman) : 0);

/** Price without the tabular-figure gaps the font puts around «۰» in big bold numbers. */
function Price({ value, className }: { value: number; className?: string }) {
  return <span className={cn("whitespace-nowrap", className)}>{faNum(value)}<span className="text-[0.7em] font-bold text-muted ms-1">تومان</span></span>;
}

type Props = {
  plans: any[];
  onSelect: (plan: any) => void;
  /** The plan the seller has now: its button says «تمدید» (a renewal starts after the current period). */
  currentPlanId?: number;
  loadingId?: number;
  /** A purchase request is waiting for the admin: no second one. */
  pending?: boolean;
};

/**
 * One plan: its features beside a list of billing periods. Several plans: one period switch on top and a card
 * per plan. Either way the buyer picks a plan and a period, and the button buys exactly that.
 */
export function PlanCards({ plans, onSelect, currentPlanId, loadingId, pending }: Props) {
  const tiers = useMemo(() => {
    const by = new Map<string, any[]>();
    for (const p of plans) by.set(p.tier || "", [...(by.get(p.tier || "") ?? []), p]);
    return [...by.values()].map((rows) => rows.sort((a, b) => a.duration_months - b.duration_months))
      .sort((a, b) => (a[0].sort_order ?? 0) - (b[0].sort_order ?? 0) || a[0].price_toman - b[0].price_toman);
  }, [plans]);
  const periods = useMemo(() => [...new Set(plans.map((p) => p.duration_months))].sort((a, b) => a - b), [plans]);
  const best = periods.reduce((m, d) => Math.max(m, ...plans.filter((p) => p.duration_months === d).map(discount)) > 0 ? d : m, periods[0]);
  const [period, setPeriod] = useState<number | undefined>();
  const current = period && periods.includes(period) ? period : best;
  if (!tiers.length) return null;

  const button = (p: any, size: "lg" | "md" = "lg") => {
    const renew = currentPlanId != null && plans.find((x) => x.id === currentPlanId)?.tier === p.tier;
    return (
      <Button size={size} className="w-full" onClick={() => onSelect(p)} loading={loadingId === p.id} disabled={pending || loadingId != null}
        variant={p.is_featured || tiers.length === 1 ? "primary" : "secondary"}>
        {pending ? "درخواست قبلی در حال بررسی است" : `${renew ? "تمدید" : "خرید"} ${periodLabel(p.duration_months)}`}
      </Button>
    );
  };

  if (tiers.length === 1) {
    const options = tiers[0];
    const selected = options.find((p) => p.duration_months === current) ?? options[0];
    return (
      <div className="@container">
      <Card strong className="max-w-4xl mx-auto p-5 sm:p-8 grid grid-cols-1 @3xl:grid-cols-[1fr_1.1fr] gap-6 @3xl:gap-10">
        <Features plan={selected} />
        <div className="flex flex-col gap-3 min-w-0">
          <div className="text-[13px] font-bold text-muted">مدت اشتراک</div>
          <div role="radiogroup" aria-label="مدت اشتراک" className="flex flex-col gap-2">
            {options.map((p) => {
              const active = p.id === selected.id;
              const d = discount(p);
              return (
                <button key={p.id} type="button" role="radio" aria-checked={active} onClick={() => setPeriod(p.duration_months)}
                  className={cn("flex items-center gap-3 rounded-2xl border p-3.5 sm:p-4 text-start cursor-pointer transition-all duration-200",
                    active ? "border-primary bg-primary/8 shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_18%,transparent)]" : "border-edge hover:border-primary/40 hover:bg-subtle")}>
                  <span className={cn("size-5 rounded-full border-2 grid place-items-center shrink-0 transition", active ? "border-primary" : "border-edge")}>
                    <span className={cn("size-2.5 rounded-full bg-primary transition-transform duration-200", active ? "scale-100" : "scale-0")} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold text-[15px]">
                      {periodLabel(p.duration_months)}
                      {d > 0 && <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-accent text-accent-fg whitespace-nowrap">{faDigits(d)}٪ تخفیف</span>}
                    </span>
                    <span className="block text-[12px] text-muted">
                      {p.duration_months > 1 ? <>ماهی {faNum(Math.round(p.price_toman / p.duration_months))} تومان</> : "پرداخت ماهانه"}
                    </span>
                  </span>
                  <span className="text-end shrink-0">
                    {d > 0 && <span className="block text-[12px] text-muted line-through whitespace-nowrap">{faNum(p.compare_at_toman)}</span>}
                    <Price value={p.price_toman} className="block font-black text-[16px]" />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-2">{button(selected)}</div>
        </div>
      </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto @container">
      {periods.length > 1 && (
        <div role="radiogroup" aria-label="مدت اشتراک" className="mx-auto mb-6 flex w-fit max-w-full rounded-full border border-edge bg-subtle p-1">
          {periods.map((m) => {
            const d = Math.max(0, ...plans.filter((p) => p.duration_months === m).map(discount));
            return (
              <button key={m} type="button" role="radio" aria-checked={m === current} onClick={() => setPeriod(m)}
                className={cn("rounded-full px-3 sm:px-4 py-2 text-[13px] font-bold whitespace-nowrap cursor-pointer transition",
                  m === current ? "bg-raised text-fg shadow-sm" : "text-muted hover:text-fg")}>
                {SHORT[m] ?? periodLabel(m)}{d > 0 && <span className="ms-1 text-[11px] text-primary">{faDigits(d)}٪-</span>}
              </button>
            );
          })}
        </div>
      )}
      <div className={cn("grid grid-cols-1 gap-4 items-stretch", tiers.length === 2 ? "@2xl:grid-cols-2 max-w-3xl mx-auto" : "@3xl:grid-cols-3")}>
        {tiers.map((rows) => {
          const p = rows.find((x) => x.duration_months === current);
          const featured = rows.some((x) => x.is_featured);
          return (
            <Card key={rows[0].tier} strong={featured}
              className={cn("relative p-5 sm:p-6 flex flex-col gap-5", featured && "border-primary shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_14%,transparent)]")}>
              {featured && <span className="absolute -top-3 start-5 rounded-full bg-primary text-primary-fg px-3 py-0.5 text-[12px] font-bold">پیشنهاد ما</span>}
              <Features plan={p ?? rows[0]} compact />
              <div className="mt-auto space-y-3">
                {p ? (
                  <div>
                    {discount(p) > 0 && <div className="text-[12px] text-muted"><span className="line-through">{faNum(p.compare_at_toman)}</span> · {faDigits(discount(p))}٪ تخفیف</div>}
                    <Price value={p.price_toman} className="font-black text-[24px]" />
                    <div className="text-[12px] text-muted">{p.duration_months > 1 ? `ماهی ${faNum(Math.round(p.price_toman / p.duration_months))} تومان` : "پرداخت ماهانه"}</div>
                  </div>
                ) : <div className="text-[13px] text-muted py-3">این مدت برای این پلن فروخته نمی‌شود.</div>}
                {p ? button(p) : <Button size="lg" className="w-full" variant="secondary" disabled>ناموجود</Button>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Features({ plan, compact }: { plan: any; compact?: boolean }) {
  return (
    <div className="min-w-0">
      <h3 className={cn("font-black tracking-tight", compact ? "text-[20px]" : "text-[22px]")}>{plan.name}</h3>
      {plan.description && <p className="text-muted text-[14px] mt-1">{plan.description}</p>}
      <ul className={cn("space-y-3", compact ? "mt-4" : "mt-5")}>
        {(plan.features ?? []).map((f: string) => (
          <li key={f} className="flex items-start gap-2.5 text-[14px]">
            <span className="size-5 rounded-full bg-primary/15 text-primary grid place-items-center mt-0.5 shrink-0"><Check className="size-3" /></span>{f}
          </li>
        ))}
      </ul>
    </div>
  );
}
