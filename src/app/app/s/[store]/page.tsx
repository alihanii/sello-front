"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Package, Radar, Send, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { faDigits, faNum, jDate } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { Button, Card, CardHeader, PageHeader, Skeleton } from "@/components/ui/primitives";
import { AiSetupBanner } from "@/components/admin/AiKeyEditor";

function Stat({ icon: Icon, label, value, hint }: any) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2 text-muted text-[12px] sm:text-[13px] font-semibold">
        <Icon className="size-4 shrink-0" aria-hidden /><span className="truncate">{label}</span>
      </div>
      <div className="text-[24px] sm:text-[30px] font-black tnum mt-2 leading-none">{value}</div>
      {hint && <div className="text-muted text-[12px] mt-2">{hint}</div>}
    </Card>
  );
}

const ATTENTION_LINK: Record<string, string> = {
  channel: "channels", operations: "activity?status=failed", approvals: "automations", stock: "products?stock=out", inbox: "crawl",
};

export default function Dashboard() {
  const sid = useStoreId();
  const { data } = useQuery({ queryKey: ["dashboard", sid], queryFn: () => api(`/stores/${sid}/dashboard`) });
  if (!data) return <div className="grid grid-cols-1 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>;
  const k = data.kpis;
  const series = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10);
    const v = data.series[d] ?? {};
    return { day: jDate(d, "d MMM"), انتشار: v.publish_ok ?? 0, کرال: v.crawl_item ?? 0, خطا: (v.publish_failed ?? 0) + (v.crawl_failed ?? 0) };
  });
  const lim = data.usage.limits;
  const pct = Math.min(100, Math.round((100 * data.usage.publishes_month) / (lim.monthly_publishes || 1)));
  return (
    <>
      <PageHeader title="داشبورد" subtitle="خلاصهٔ کار Sello برای این فروشگاه"
        actions={<>
          <Link href={`/app/s/${sid}/products/ai`}><Button variant="ai" icon={<Sparkles className="size-4" />}>ساخت محصول با AI</Button></Link>
          <Link href={`/app/s/${sid}/products/new`}><Button variant="secondary">افزودن دستی</Button></Link>
        </>} />
      <AiSetupBanner />
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat icon={Package} label="کل محصولات" value={faNum(k.products)} hint={`${faNum(k.unpublished)} منتشرنشده`} />
        <Stat icon={Send} label="منتشرشده" value={faNum(k.published_any)} hint={`امروز ${faNum(k.published_today)} انتشار`} />
        <Stat icon={Radar} label="کرال امروز" value={faNum(k.crawled_today)} />
        <Stat icon={TrendingUp} label="موفقیت انتشار" value={k.success_rate == null ? "—" : `${faDigits(k.success_rate)}٪`} hint="۳۰ روز اخیر" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mt-4">
        <Card className="lg:col-span-2">
          <CardHeader title="۳۰ روز اخیر" subtitle={<span className="flex flex-wrap gap-x-3"><span><i className="inline-block size-2 rounded-full bg-primary me-1" />انتشار</span><span><i className="inline-block size-2 rounded-full bg-neutral/40 me-1" />کرال</span><span><i className="inline-block size-2 rounded-full bg-danger me-1" />خطا</span></span>} />
          <div className="h-56 sm:h-72 px-2 pb-4" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={series} margin={{ left: 0, right: 8, top: 8 }} barGap={2}>
                <CartesianGrid stroke="var(--glass-edge)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--muted-fg)", fontSize: 11 }} tickLine={false} axisLine={false} interval={6} reversed />
                <YAxis orientation="right" width={28} tick={{ fill: "var(--muted-fg)", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={faNum} />
                <Tooltip cursor={{ fill: "var(--subtle)" }} contentStyle={{ background: "var(--glass-strong)", border: "1px solid var(--glass-border)", borderRadius: 14, direction: "rtl", fontFamily: "inherit" }} formatter={(v: any) => faNum(v)} />
                <Bar dataKey="کرال" fill="var(--neutral)" fillOpacity={0.35} radius={[4, 4, 0, 0]} />
                <Bar dataKey="انتشار" stackId="p" fill="var(--primary)" />
                <Bar dataKey="خطا" stackId="p" fill="var(--danger)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="نیازمند توجه" />
            <div className="px-5 pb-5 space-y-2">
              {data.attention.length === 0 ? (
                <div className="flex items-center gap-2 text-success text-[14px]"><CheckCircle2 className="size-4" /> همه‌چیز مرتب است.</div>
              ) : data.attention.map((a: any, i: number) => (
                <Link key={i} href={`/app/s/${sid}/${ATTENTION_LINK[a.type] ?? ""}`} className="flex items-start gap-2 text-[14px] p-2.5 rounded-xl hover:bg-subtle">
                  <AlertTriangle className="size-4 text-warning mt-1 shrink-0" /> <span>{faDigits(a.text)}</span>
                </Link>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex justify-between text-[13px]"><span className="font-bold">مصرف پلن</span><span className="text-muted">{data.usage.plan ?? "رایگان"}</span></div>
            <div className="mt-3 text-[13px] text-muted tnum">{faNum(data.usage.publishes_month)} از {faNum(lim.monthly_publishes)} انتشار این ماه</div>
            <div className="h-2 rounded-full bg-subtle mt-2 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
            <Link href="/app/billing" className="text-primary text-[13px] font-semibold mt-3 inline-block">ارتقای پلن</Link>
          </Card>
        </div>
      </div>
    </>
  );
}
