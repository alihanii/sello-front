"use client";

import { useQuery } from "@tanstack/react-query";
import { Bot, Coins, Database, MessageCircle, ShoppingBag, Zap } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { faNum, jDate, jDateTime, ms, toman } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { MSG_SOURCE } from "@/lib/chat";
import { PlatformIcon } from "@/components/ui/status";
import { Card, CardHeader, Select, Skeleton } from "@/components/ui/primitives";

export const tip = { contentStyle: { background: "var(--glass-strong)", border: "1px solid var(--glass-border)", borderRadius: 12, direction: "rtl" as const, fontFamily: "inherit" }, formatter: (v: any) => faNum(v) };

export function ChatUsage() {
  const sid = useStoreId();
  const [days, setDays] = useState("30");
  const { data } = useQuery({ queryKey: ["chat-usage", sid, days], queryFn: () => api(`/stores/${sid}/chat/usage?days=${days}`) });
  if (!data) return <Skeleton className="h-96" />;
  const t = data.totals;
  const chart = data.series.map((d: any) => ({ day: jDate(d.day, "d MMM"), "با AI": d.llm, "بدون هزینه": d.ai - d.llm, "پیام مشتری": d.customer }));
  const free = t.ai_replies ? Math.round((100 * t.without_llm) / t.ai_replies) : 0;
  const cards: [any, string, string, string][] = [
    [MessageCircle, "گفتگو", faNum(t.conversations), `${faNum(t.customer_messages)} پیام مشتری`],
    [Bot, "پاسخ دستیار", faNum(t.ai_replies), `${faNum(t.llm_calls)} با AI · ${faNum(t.without_llm)} بدون هزینه (${faNum(free)}٪)`],
    [Coins, "توکن", faNum(t.input_tokens + t.output_tokens), `میانگین ${faNum(t.avg_tokens_per_call)} توکن هر پاسخ AI`],
    [Database, "توکن کش‌شده", faNum(t.cached_tokens), "بخش ثابت پرامپت که ارزان‌تر حساب شده"],
    [Zap, "هزینهٔ تقریبی", toman(t.cost_toman), "بر اساس قیمت کلید AI"],
    [ShoppingBag, "سفارش با AI", faNum(t.orders), ""],
  ];
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select className="w-auto" value={days} onChange={(e) => setDays(e.target.value)}><option value="1">امروز</option><option value="7">۷ روز</option><option value="30">۳۰ روز</option><option value="90">۹۰ روز</option></Select>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map(([I, l, v, h]) => (
          <Card key={l} className="p-4"><div className="flex items-center gap-2 text-muted text-[12px] font-semibold"><I className="size-4" />{l}</div><div className="text-[20px] font-black tnum mt-1.5">{v}</div>{h && <div className="text-[11px] text-muted mt-1">{h}</div>}</Card>
        ))}
      </div>
      <Card>
        <CardHeader title="پیام‌های روزانه" subtitle="پاسخ‌های بدون هزینه: خوشامد، سؤالات متداول، پاسخ آماده، ثبت سفارش و فیش" />
        <div className="h-64 px-2 pb-4" dir="ltr">
          <ResponsiveContainer>
            <BarChart data={chart} maxBarSize={36}>
              <CartesianGrid stroke="var(--glass-edge)" vertical={false} />
              <XAxis dataKey="day" reversed tick={{ fill: "var(--muted-fg)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis orientation="right" width={30} tick={{ fill: "var(--muted-fg)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={faNum} />
              <Tooltip {...tip} cursor={{ fill: "var(--subtle)" }} /><Legend />
              <Bar dataKey="پیام مشتری" fill="var(--neutral)" fillOpacity={0.35} radius={[4, 4, 0, 0]} />
              <Bar dataKey="بدون هزینه" stackId="a" fill="var(--success)" fillOpacity={0.55} />
              <Bar dataKey="با AI" stackId="a" fill="var(--ai)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="منبع پاسخ‌ها" />
          <div className="px-5 pb-5 space-y-2 text-[13px]">
            {Object.entries(data.by_source).sort((a: any, b: any) => b[1] - a[1]).map(([k, v]: any) => (
              <div key={k} className="flex justify-between"><span>{MSG_SOURCE[k]?.label ?? k} {MSG_SOURCE[k]?.free && <span className="text-success text-[11px]">رایگان</span>}</span><span className="tnum font-bold">{faNum(v)}</span></div>
            ))}
            {Object.keys(data.by_source).length === 0 && <p className="text-muted">هنوز پیامی نیست.</p>}
          </div>
          <CardHeader title="به تفکیک پیام‌رسان" />
          <div className="px-5 pb-5 space-y-2 text-[13px]">
            {data.by_platform.map((p: any) => (
              <div key={p.platform} className="flex items-center gap-2"><PlatformIcon platform={p.platform} size={22} /><span className="flex-1">{faNum(p.conversations)} گفتگو</span><span className="tnum text-muted">{faNum(p.tokens)} توکن</span></div>
            ))}
          </div>
        </Card>
        <Card strong className="lg:col-span-2 overflow-x-auto">
          <CardHeader title="آخرین پاسخ‌های AI" subtitle="هر ردیف یک فراخوانی مدل" />
          <table className="w-full text-[13px] min-w-[640px]">
            <thead className="text-muted text-[12px]"><tr className="border-y border-edge">{["زمان", "مشتری", "پاسخ", "ورودی / کش / خروجی", "هزینه", "زمان پاسخ"].map((h) => <th key={h} className="p-2.5 text-start font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {data.recent.map((m: any) => (
                <tr key={m.id} className="border-b border-edge last:border-0 align-top">
                  <td className="p-2.5 text-muted whitespace-nowrap">{jDateTime(m.created_at)}</td>
                  <td className="p-2.5 whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><PlatformIcon platform={m.platform} size={18} />{m.customer_name || "مشتری"}</span></td>
                  <td className="p-2.5 max-w-64"><div className="line-clamp-2">{m.text}</div><div className="text-[11px] text-muted">{MSG_SOURCE[m.source]?.label} · {m.model}</div></td>
                  <td className="p-2.5 tnum whitespace-nowrap">{faNum(m.input_tokens)} / {faNum(m.cached_tokens)} / {faNum(m.output_tokens)}</td>
                  <td className="p-2.5 tnum whitespace-nowrap">{toman(m.cost_toman)}</td>
                  <td className="p-2.5 whitespace-nowrap">{ms(m.latency_ms)}</td>
                </tr>
              ))}
              {data.recent.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">هنوز پاسخی با AI داده نشده.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
