"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { addDays, addMonths, format as jf, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { faDigits, faNum, jDate, toman } from "@/lib/format";
import { ORDER_SOURCE, SOURCES, isoDay, orderQueries } from "@/lib/orders";
import { Button, Card, CardHeader, Tabs, cn } from "@/components/ui/primitives";
import { ChartCardSkeleton } from "@/components/ui/skeletons";

/** 1_250_000 → «۱٫۳ م», 450_000 → «۴۵۰ ه» */
export function shortToman(n: number) {
  if (n >= 1e9) return `${faDigits((n / 1e9).toFixed(1).replace(/\.0$/, "")).replace(".", "٫")} میلیارد`;
  if (n >= 1e6) return `${faDigits((n / 1e6).toFixed(1).replace(/\.0$/, "")).replace(".", "٫")} م`;
  if (n >= 1e3) return `${faNum(Math.round(n / 1e3))} ه`;
  return faNum(n);
}

const tooltipStyle = { background: "var(--glass-strong)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-card)", direction: "rtl" as const, fontFamily: "inherit" };

export function FinanceChart({ sid }: { sid: number }) {
  const [view, setView] = useState<"toman" | "orders">("toman");
  const { data } = useQuery(orderQueries.finance(sid));
  const rows = useMemo(() => {
    if (!data) return [];
    return Array.from({ length: 30 }, (_, i) => {
      const d = isoDay(new Date(Date.now() - (29 - i) * 864e5));
      const v = data.days[d] ?? {};
      const row: any = { day: jDate(d, "d MMM") };
      for (const s of SOURCES) row[ORDER_SOURCE[s].label] = v[`${s}_${view}`] ?? 0;
      return row;
    });
  }, [data, view]);
  if (!data) return <ChartCardSkeleton className="lg:col-span-2" />;
  const t = data.totals;
  const change = t.prev_income ? Math.round((100 * (t.income - t.prev_income)) / t.prev_income) : null;
  const stats = [
    { label: "درآمد ۳۰ روز", value: toman(t.income) === "—" ? "۰ تومان" : toman(t.income),
      hint: change == null ? "دورهٔ قبل فروشی نبود" : <span className={cn("inline-flex items-center gap-1", change >= 0 ? "text-success" : "text-danger")}>{change >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}{faDigits(Math.abs(change))}٪ نسبت به ۳۰ روز قبل</span> },
    { label: "تعداد سفارش", value: faNum(t.orders), hint: `میانگین هر سفارش ${t.avg_order ? toman(t.avg_order) : "—"}` },
    { label: "منتظر تأیید فیش", value: t.pending_toman ? toman(t.pending_toman) : "۰", hint: t.open_invoices_toman ? `${toman(t.open_invoices_toman)} فاکتور پرداخت‌نشده` : "فاکتور باز نیست" },
  ];
  return (
    <Card className="flex flex-col">
      <CardHeader title="گزارش مالی" subtitle="درآمد و فروش ۳۰ روز اخیر، به تفکیک منبع سفارش"
        action={<Tabs value={view} onChange={setView} items={[{ value: "toman", label: "درآمد" }, { value: "orders", label: "تعداد فروش" }]} />} />
      <div className="px-4 sm:px-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-subtle p-3">
            <div className="text-[12px] text-muted font-semibold">{s.label}</div>
            <div className="text-[18px] sm:text-[20px] font-black tnum mt-1 truncate">{s.value}</div>
            <div className="text-[11px] text-muted mt-1">{s.hint}</div>
          </div>
        ))}
      </div>
      <div className="h-56 sm:h-64 px-2 pb-2 mt-3" dir="ltr">
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid stroke="var(--glass-edge)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "var(--muted-fg)", fontSize: 11 }} tickLine={false} axisLine={false} interval={6} reversed />
            <YAxis orientation="right" width={view === "toman" ? 44 : 28} tick={{ fill: "var(--muted-fg)", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false}
              tickFormatter={(v) => (view === "toman" ? shortToman(v) : faNum(v))} />
            <Tooltip cursor={{ fill: "var(--subtle)" }} contentStyle={tooltipStyle} formatter={(v: any) => (view === "toman" ? toman(v) || "۰" : faNum(v))} />
            {SOURCES.map((s, i) => (
              <Bar key={s} isAnimationActive={false} dataKey={ORDER_SOURCE[s].label} stackId="m" fill={ORDER_SOURCE[s].color} radius={i === SOURCES.length - 1 ? [4, 4, 0, 0] : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="px-4 sm:px-5 pb-4 text-[12px] text-muted">
        {faNum(t.sale_days)} روز با فروش · {faNum(t.no_sale_days)} روز بدون فروش
      </div>
    </Card>
  );
}

const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const jfa = (d: Date, f: string) => faDigits(jf(d, f, { locale: faIR }));

/** Month calendar of orders taken: each day shows how many orders came in and how much was earned. */
export function OrdersCalendar({ sid, month: controlled }: { sid: number; month?: Date }) {
  const [own, setCursor] = useState(new Date());
  const cursor = controlled ?? own;
  const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 6 });
  const cells = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart.getTime()]); // eslint-disable-line
  const { data } = useQuery({ ...orderQueries.finance(sid, isoDay(cells[0]), isoDay(cells[41])), placeholderData: keepPreviousData });
  const today = new Date();
  const day = (d: Date) => {
    const v = data?.days?.[isoDay(d)] ?? {};
    return { orders: SOURCES.reduce((a, s) => a + (v[`${s}_orders`] ?? 0), 0), toman: SOURCES.reduce((a, s) => a + (v[`${s}_toman`] ?? 0), 0), v };
  };
  const month = cells.filter((d) => isSameMonth(d, cursor)).reduce((a, d) => { const x = day(d); return { orders: a.orders + x.orders, toman: a.toman + x.toman }; }, { orders: 0, toman: 0 });
  const max = Math.max(1, ...cells.map((d) => day(d).orders));
  const rows = cells[35] && !isSameMonth(cells[35], cursor) ? 5 : 6;
  return (
    <Card>
      <CardHeader title="تقویم سفارش‌ها"
        subtitle={data ? <span className="tnum">{jfa(cursor, "MMMM")}: {faNum(month.orders)} سفارش · {month.toman ? toman(month.toman) : "بدون درآمد"}</span> : <span className="inline-block h-3 w-40 rounded bg-subtle animate-pulse" />}
        action={!controlled && <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setCursor(addMonths(cursor, -1))} aria-label="ماه قبل"><ChevronRight className="size-4" /></Button>
          <span className="font-bold text-[14px] min-w-24 text-center">{jfa(cursor, "MMMM yyyy")}</span>
          <Button variant="ghost" size="sm" onClick={() => setCursor(addMonths(cursor, 1))} aria-label="ماه بعد"><ChevronLeft className="size-4" /></Button>
        </div>} />
      <div className="px-3 sm:px-5 pb-5">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[11px] text-muted font-bold mb-1">{WEEKDAYS.map((w) => <span key={w}>{w}</span>)}</div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {cells.slice(0, rows * 7).map((d) => {
            const x = day(d);
            const inMonth = isSameMonth(d, cursor);
            const future = d > today && !isSameDay(d, today);
            const body = (
              <>
                <span className={cn("text-[12px] sm:text-[13px] font-bold tnum", isSameDay(d, today) && "size-6 rounded-full bg-accent text-accent-fg grid place-items-center")}>{jfa(d, "d")}</span>
                {x.orders > 0 && <span className="text-[11px] sm:text-[12px] font-black tnum text-primary leading-none">{faNum(x.orders)}<span className="hidden sm:inline font-semibold"> سفارش</span></span>}
                {x.toman > 0 && <span className="hidden sm:block text-[10px] text-muted tnum leading-none">{shortToman(x.toman)}</span>}
                {x.orders > 0 && <span className="flex gap-0.5 mt-auto">{SOURCES.filter((s) => x.v[`${s}_orders`]).map((s) => <i key={s} className="size-1.5 rounded-full" style={{ background: ORDER_SOURCE[s].color }} />)}</span>}
              </>
            );
            const cls = cn("relative h-14 sm:h-[72px] rounded-xl p-1 sm:p-1.5 flex flex-col items-center gap-0.5 transition", !inMonth && "opacity-35", future && "opacity-50");
            const bg = x.orders ? { background: `color-mix(in oklab, var(--primary) ${Math.round(8 + 22 * (x.orders / max))}%, transparent)` } : undefined;
            return x.orders > 0
              ? <Link key={d.toISOString()} href={`/app/s/${sid}/orders?day=${isoDay(d)}`} className={cn(cls, "hover:ring-2 hover:ring-primary/40")} style={bg}
                  title={`${jfa(d, "d MMMM")}: ${faNum(x.orders)} سفارش${x.toman ? ` · ${toman(x.toman)}` : ""}`}>{body}</Link>
              : <div key={d.toISOString()} className={cn(cls, "bg-subtle/60")}>{body}</div>;
          })}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[11px] text-muted">
          {SOURCES.map((s) => <span key={s} className="inline-flex items-center gap-1"><i className="size-2 rounded-full" style={{ background: ORDER_SOURCE[s].color }} />{ORDER_SOURCE[s].label}</span>)}
          <span className="ms-auto">روی هر روز بزن تا سفارش‌هایش را ببینی</span>
        </div>
      </div>
    </Card>
  );
}
