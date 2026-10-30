"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Coins, Timer } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { ago, faDigits, faNum, jDate, jDateTime, ms, toman } from "@/lib/format";
import { Card, CardHeader, Chip, PageHeader, Select, Skeleton } from "@/components/ui/primitives";

export default function AiUsage() {
  const [days, setDays] = useState("30");
  const [provider, setProvider] = useState("");
  const { data } = useQuery({ queryKey: ["ai-usage", days, provider], queryFn: () => api(`/admin/ai/usage?days=${days}${provider ? `&provider_id=${provider}` : ""}`) });
  if (!data) return <Skeleton className="h-96" />;
  const t = data.totals;
  const chart = data.daily.map((d: any) => ({ day: jDate(d.day, "d MMM"), موفق: d.ok, ناموفق: d.failed }));
  const tip = { contentStyle: { background: "var(--glass-strong)", border: "1px solid var(--glass-border)", borderRadius: 12, direction: "rtl" as const, fontFamily: "inherit" }, formatter: (v: any) => faNum(v) };
  return (
    <>
      <PageHeader title="مانیتورینگ AI" subtitle="مصرف، هزینه و خطای هر کلید"
        actions={<>
          <Select className="w-auto" value={provider} onChange={(e) => setProvider(e.target.value)}><option value="">همهٔ کلیدها</option>{data.providers.map((p: any) => <option key={p.provider.id} value={p.provider.id}>{p.provider.name}</option>)}</Select>
          <Select className="w-auto" value={days} onChange={(e) => setDays(e.target.value)}><option value="1">۲۴ ساعت</option><option value="7">۷ روز</option><option value="30">۳۰ روز</option><option value="90">۹۰ روز</option></Select>
        </>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[[Activity, "درخواست‌ها", faNum(t.calls), `${faNum(t.ok)} موفق`], [AlertTriangle, "نرخ خطا", `${faDigits(t.error_rate)}٪`, `${faNum(t.failed)} ناموفق`],
          [Coins, "هزینهٔ تقریبی", toman(t.cost_toman), `${faNum(t.input_tokens + t.output_tokens)} توکن`], [Timer, "میانگین زمان پاسخ", ms(t.avg_latency_ms), ""]].map(([I, l, v, h]: any) => (
          <Card key={l} className="p-5"><div className="flex items-center justify-between text-muted text-[13px] font-semibold">{l}<I className="size-4" /></div><div className="text-[24px] font-black tnum mt-1">{v}</div><div className="text-[12px] text-muted">{h}</div></Card>
        ))}
      </div>
      <Card className="mt-4">
        <CardHeader title="درخواست‌های روزانه" />
        <div className="h-64 px-2 pb-4" dir="ltr">
          <ResponsiveContainer>
            <BarChart data={chart}>
              <CartesianGrid stroke="var(--glass-edge)" vertical={false} />
              <XAxis dataKey="day" reversed tick={{ fill: "var(--muted-fg)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis orientation="right" tick={{ fill: "var(--muted-fg)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={faNum} />
              <Tooltip {...tip} /><Legend />
              <Bar dataKey="موفق" stackId="a" fill="var(--primary)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="ناموفق" stackId="a" fill="var(--danger)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card strong className="mt-4 overflow-x-auto">
        <CardHeader title="به تفکیک کلید" />
        <table className="w-full text-[14px] min-w-[900px]">
          <thead className="text-muted text-[12px]"><tr className="border-y border-edge">{["کلید", "درخواست", "خطا", "توکن ورودی / خروجی", "هزینه", "مصرف بودجهٔ این ماه", "زمان پاسخ", "آخرین استفاده"].map((h) => <th key={h} className="p-3 text-start font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {data.providers.map((p: any) => (
              <tr key={p.provider.id} className="border-b border-edge last:border-0">
                <td className="p-3 font-semibold">{p.provider.name}<span className="block text-[11px] text-muted" dir="ltr">••••{p.provider.key_hint}</span></td>
                <td className="p-3 tnum">{faNum(p.calls)}</td>
                <td className="p-3">{p.failed ? <Chip tone="danger">{faNum(p.failed)} ({faDigits(p.error_rate)}٪)</Chip> : <span className="text-muted">۰</span>}</td>
                <td className="p-3 tnum text-[13px]">{faNum(p.input_tokens)} / {faNum(p.output_tokens)}</td>
                <td className="p-3 tnum">{toman(p.cost_toman)}</td>
                <td className="p-3 min-w-36">{p.budget_used_pct == null ? <span className="text-muted text-[12px]">بدون بودجه</span> : (
                  <><div className="text-[12px] tnum">{faDigits(p.budget_used_pct)}٪</div><div className="h-1.5 rounded-full bg-subtle overflow-hidden mt-1"><div className={`h-full ${p.budget_used_pct > 90 ? "bg-danger" : p.budget_used_pct > 70 ? "bg-warning" : "bg-primary"}`} style={{ width: `${Math.min(100, p.budget_used_pct)}%` }} /></div></>
                )}</td>
                <td className="p-3 text-[13px]">{ms(p.avg_latency_ms)}</td>
                <td className="p-3 text-muted text-[13px]">{ago(p.last_used)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader title="به تفکیک کار" />
          <ul className="px-5 pb-5 space-y-2">{data.by_task.map((r: any) => (
            <li key={r.task} className="flex items-center justify-between text-[14px]"><span>{r.label}</span><span className="text-muted tnum text-[13px]">{faNum(r.calls)} درخواست · {toman(r.cost_toman)}{r.failed ? ` · ${faNum(r.failed)} خطا` : ""}</span></li>
          ))}{data.by_task.length === 0 && <li className="text-muted text-[13px]">داده‌ای نیست.</li>}</ul>
        </Card>
        <Card>
          <CardHeader title="پرمصرف‌ترین فروشگاه‌ها" />
          <ul className="px-5 pb-5 space-y-2">{data.by_store.map((r: any) => (
            <li key={r.store_id} className="flex items-center justify-between text-[14px]"><span>{r.store}</span><span className="text-muted tnum text-[13px]">{faNum(r.calls)} درخواست · {toman(r.cost_toman)}</span></li>
          ))}{data.by_store.length === 0 && <li className="text-muted text-[13px]">داده‌ای نیست.</li>}</ul>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader title="آخرین خطاها" />
        <ul className="divide-y divide-[var(--glass-edge)]">
          {data.errors.map((e: any) => (
            <li key={e.id} className="p-4 text-[13px] flex flex-wrap gap-3">
              <span className="text-muted w-36">{jDateTime(e.created_at)}</span>
              <Chip tone="danger">{e.error_code}</Chip>
              <span className="text-muted" dir="ltr">{e.model}</span>
              <span className="w-full text-danger">{e.error_message}</span>
            </li>
          ))}
          {data.errors.length === 0 && <li className="p-5 text-muted text-[14px]">خطایی ثبت نشده.</li>}
        </ul>
      </Card>
    </>
  );
}
