"use client";

import { useQuery } from "@tanstack/react-query";
import { Bot, Coins, Database, MessageCircle, ShoppingBag, Zap } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { faDigits, faNum, jDate, toman } from "@/lib/format";
import { Card, CardHeader, PageHeader, Select, Skeleton } from "@/components/ui/primitives";
import { tip } from "@/components/chat/Usage";

export default function AdminChatUsage() {
  const [days, setDays] = useState("30");
  const { data } = useQuery({ queryKey: ["admin-chat-usage", days], queryFn: () => api(`/admin/chat/usage?days=${days}`) });
  if (!data) return <Skeleton className="h-96" />;
  const t = data.totals;
  const chart = data.series.map((d: any) => ({ day: jDate(d.day, "d MMM"), توکن: d.tokens }));
  return (
    <>
      <PageHeader title="مصرف دستیار چت" subtitle="پیام، توکن و هزینهٔ چت فروشگاه‌ها (بدون تست‌ها)"
        actions={<Select className="w-auto" value={days} onChange={(e) => setDays(e.target.value)}><option value="1">امروز</option><option value="7">۷ روز</option><option value="30">۳۰ روز</option><option value="90">۹۰ روز</option></Select>} />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {([[MessageCircle, "گفتگو", faNum(t.conversations)], [Bot, "پیام", faNum(t.messages)], [Zap, "فراخوانی AI", faNum(t.llm_calls)],
          [Coins, "توکن", faNum(t.input_tokens + t.output_tokens)], [Database, "کش‌شده", faNum(t.cached_tokens)], [ShoppingBag, "سفارش", faNum(t.orders)]] as any[]).map(([I, l, v]) => (
          <Card key={l} className="p-4"><div className="flex items-center gap-2 text-muted text-[12px] font-semibold"><I className="size-4" />{l}</div><div className="text-[22px] font-black tnum mt-1">{v}</div></Card>
        ))}
      </div>
      <Card className="mt-4">
        <CardHeader title="توکن روزانه" subtitle={`هزینهٔ تقریبی: ${toman(t.cost_toman)} · ${faNum(t.active_bots)} ربات فعال`} />
        <div className="h-60 px-2 pb-4" dir="ltr">
          <ResponsiveContainer>
            <BarChart data={chart} maxBarSize={36}>
              <CartesianGrid stroke="var(--glass-edge)" vertical={false} />
              <XAxis dataKey="day" reversed tick={{ fill: "var(--muted-fg)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis orientation="right" width={44} tick={{ fill: "var(--muted-fg)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={faNum} />
              <Tooltip {...tip} cursor={{ fill: "var(--subtle)" }} />
              <Bar dataKey="توکن" fill="var(--ai)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card strong className="mt-4 overflow-x-auto">
        <CardHeader title="به تفکیک فروشگاه" />
        <table className="w-full text-[14px] min-w-[860px]">
          <thead className="text-muted text-[12px]"><tr className="border-y border-edge">{["فروشگاه", "ربات", "گفتگو", "پیام", "فراخوانی AI", "توکن (کش)", "هزینه", "سفارش"].map((h) => <th key={h} className="p-3 text-start font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {data.stores.map((s: any) => (
              <tr key={s.store_id} className="border-b border-edge last:border-0">
                <td className="p-3 font-semibold">{s.store_name}<span className="block text-[11px] text-muted tnum" dir="ltr">{faDigits(s.owner_phone)}</span></td>
                <td className="p-3 tnum">{faNum(s.bots)}</td>
                <td className="p-3 tnum">{faNum(s.conversations)}</td>
                <td className="p-3 tnum">{faNum(s.messages)}</td>
                <td className="p-3 tnum">{faNum(s.llm_calls)}</td>
                <td className="p-3 tnum text-[13px]">{faNum(s.tokens)} <span className="text-muted">({faNum(s.cached_tokens)})</span></td>
                <td className="p-3 tnum">{toman(s.cost_toman)}</td>
                <td className="p-3 tnum">{faNum(s.orders)}</td>
              </tr>
            ))}
            {data.stores.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted">هنوز چتی ثبت نشده.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
