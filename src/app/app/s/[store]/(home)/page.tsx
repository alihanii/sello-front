"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, MessageCircle, Package, Plug, Send, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { faDigits, faNum, jDate, toman } from "@/lib/format";
import { storeQueries, useChannels, useStoreId } from "@/lib/hooks";
import { Button, Card, CardHeader, PageHeader, Skeleton, Tabs } from "@/components/ui/primitives";
import { DashboardSkeleton, SkLine } from "@/components/ui/skeletons";
import { AiSetupBanner } from "@/components/admin/AiKeyEditor";
import { Banner } from "@/components/ui/Banner";

function Stat({ icon: Icon, label, value, unit, hint }: any) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2 text-muted text-[12px] sm:text-[13px] font-semibold">
        <Icon className="size-4 shrink-0" aria-hidden /><span className="truncate">{label}</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 mt-2 leading-none">
        <span className={`${String(value).length > 7 ? "text-[20px] sm:text-[26px]" : "text-[24px] sm:text-[30px]"} font-black tnum`}>{value}</span>
        {unit && <span className="text-[12px] sm:text-[13px] font-semibold text-muted">{unit}</span>}
      </div>
      {hint && <div className="text-muted text-[12px] mt-2">{hint}</div>}
    </Card>
  );
}

const ATTENTION_LINK: Record<string, string> = {
  channel: "channels", operations: "activity?status=failed", stock: "products?stock=out", inbox: "crawl",
  ai_orders: "chat?tab=orders", chat: "chat?tab=conversations",
};

function SetupAlert({ href, icon, title, text }: { href: string; icon: any; title: string; text: string }) {
  return <Banner href={href} icon={icon}><b>{title}</b> <span className="text-muted">{text}</span></Banner>;
}

// Shown at the top of the dashboard until the store has a connected channel and a running AI chat.
function SetupAlerts({ sid }: { sid: number }) {
  const { data: channels } = useChannels(sid);
  const { data: chat } = useQuery(storeQueries.chatOverview(sid));
  const noChannel = !!channels && !channels.some((c: any) => c.status === "connected");
  const noBot = !!chat && (chat as any).bots?.length === 0;
  const chatOff = !!chat && !noBot && !(chat as any).enabled;
  if (!noChannel && !noBot && !chatOff) return null;
  return (
    <div className="mb-5 space-y-2">
      {noChannel && <SetupAlert href={`/app/s/${sid}/channels`} icon={Plug} title="اولین فروشگاهت رو وصل کن."
        text="کانال یا پیجت رو وصل کن تا محصول‌ها خودکار اونجا منتشر بشن." />}
      {(noBot || chatOff) && <SetupAlert href={`/app/s/${sid}/chat${noBot ? "?tab=connections" : ""}`} icon={MessageCircle}
        title={noBot ? "چت هوشمند و سفارش‌گیر رو وصل کن." : "چت هوشمند و سفارش‌گیر رو راه بنداز."}
        text={noBot ? "رباتش رو وصل کن تا به‌جای ادمین جواب مشتری رو بده و سفارش بگیره." : "رباتت وصله ولی دستیار خاموشه؛ روشنش کن تا جواب مشتری رو بده و سفارش بگیره."} />}
    </div>
  );
}

function ChatCard({ sid, today }: { sid: number; today: { chats: number; replies: number; orders: number } }) {
  const { data, isPending } = useQuery(storeQueries.chatOverview(sid));
  if (isPending) {
    return (
      <Card className="p-5 space-y-3" aria-hidden>
        <div className="flex justify-between"><SkLine className="w-24" /><SkLine className="w-10" /></div>
        <div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
      </Card>
    );
  }
  if (!data) return null;
  return (
    <Link href={`/app/s/${sid}/chat`}>
      <Card className="p-5 hover:bg-glass-strong transition">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-bold flex items-center gap-2"><MessageCircle className="size-4 text-primary" />AI چت</span>
          <span className={data.enabled ? "text-success font-bold" : "text-muted"}>{data.enabled ? "روشن" : "خاموش"}</span>
        </div>
        <div className="text-[11px] text-muted mt-3">امروز</div>
        <div className="grid grid-cols-3 gap-2 mt-1.5 text-center">
          <div className="rounded-xl bg-subtle py-2">
            <div className="text-[18px] font-black tnum flex items-center justify-center gap-1.5"><i className="inline-block size-2 rounded-full bg-primary" aria-hidden />{faNum(today.chats)}</div>
            <div className="text-[11px] text-muted">گفتگوی پاسخ‌داده</div>
          </div>
          <div className="rounded-xl bg-subtle py-2">
            <div className="text-[18px] font-black tnum flex items-center justify-center gap-1.5"><i className="inline-block size-2 rounded-full bg-ai" aria-hidden />{faNum(today.orders)}</div>
            <div className="text-[11px] text-muted">سفارش</div>
          </div>
          <div className="rounded-xl bg-subtle py-2">
            <div className="text-[18px] font-black tnum">{faNum(data.orders.payment_submitted)}</div>
            <div className="text-[11px] text-muted">فیش منتظر تأیید</div>
          </div>
        </div>
        <div className="text-[12px] text-muted mt-2.5 tnum">{faNum(today.replies)} پاسخ دستیار امروز · {faNum(data.month.tokens)} توکن این ماه</div>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const sid = useStoreId();
  const { data } = useQuery(storeQueries.dashboard(sid));
  const [view, setView] = useState<"sales" | "publish">("sales");
  if (!data) return <DashboardSkeleton />;
  const k = data.kpis;
  const series = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10);
    const v = data.series[d] ?? {};
    return {
      day: jDate(d, "d MMM"), انتشار: v.publish_ok ?? 0, کرال: v.crawl_item ?? 0, خطا: (v.publish_failed ?? 0) + (v.crawl_failed ?? 0),
      "گفتگوی پاسخ‌داده": v.chats_answered ?? 0, سفارش: v.orders ?? 0, درآمد: v.sale_toman ?? 0,
    };
  });
  const lim = data.usage.limits;
  const pct = Math.min(100, Math.round((100 * data.usage.publishes_month) / (lim.monthly_publishes || 1)));
  return (
    <>
      <PageHeader title="داشبورد" subtitle="خلاصهٔ کار Sello برای این فروشگاه"
        actions={<>
          <Link href={`/app/s/${sid}/products/new?mode=ai`}><Button variant="ai" icon={<Sparkles className="size-4" />}>ساخت محصول با AI</Button></Link>
          <Link href={`/app/s/${sid}/products/new?mode=manual`}><Button variant="secondary">افزودن دستی</Button></Link>
        </>} />
      <AiSetupBanner />
      <SetupAlerts sid={sid} />
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat icon={Package} label="کل محصولات" value={faNum(k.products)} hint={`${faNum(k.unpublished)} منتشرنشده`} />
        <Stat icon={Send} label="منتشرشده" value={faNum(k.published_any)} hint={`امروز ${faNum(k.published_today)} انتشار`} />
        <Stat icon={Wallet} label="درآمد امروز" value={faNum(k.income_today ?? 0)} unit="تومان"
          hint={`کل فروش: ${toman(k.sales_total)}`} />
        <Stat icon={TrendingUp} label="موفقیت انتشار" value={k.success_rate == null ? "—" : `${faDigits(k.success_rate)}٪`} hint="۳۰ روز اخیر" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mt-4">
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader title="۳۰ روز اخیر"
            subtitle={<span className="flex flex-wrap gap-x-3">{view === "sales" ? <>
              <span><i className="inline-block size-2 rounded-full bg-primary me-1" />گفتگوی پاسخ‌داده</span>
              <span><i className="inline-block size-2 rounded-full bg-ai me-1" />سفارش</span>
            </> : <>
              <span><i className="inline-block size-2 rounded-full bg-primary me-1" />انتشار</span>
              <span><i className="inline-block size-2 rounded-full bg-neutral/40 me-1" />کرال</span>
              <span><i className="inline-block size-2 rounded-full bg-danger me-1" />خطا</span>
            </>}</span>}
            action={<Tabs value={view} onChange={setView} items={[{ value: "sales", label: "چت و سفارش" }, { value: "publish", label: "انتشار و کرال" }]} />} />
          <div className="h-56 sm:h-72 lg:h-auto lg:flex-1 lg:min-h-72 px-2 pb-4" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={series} margin={{ left: 0, right: 8, top: 8 }} barGap={2}>
                <CartesianGrid stroke="var(--glass-edge)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--muted-fg)", fontSize: 11 }} tickLine={false} axisLine={false} interval={6} reversed />
                <YAxis orientation="right" width={28} tick={{ fill: "var(--muted-fg)", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={faNum} />
                <Tooltip cursor={{ fill: "var(--subtle)" }} contentStyle={{ background: "var(--glass-strong)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-card)", direction: "rtl", fontFamily: "inherit" }}
                  formatter={(v: any) => faNum(v)}
                  labelFormatter={(label: any, p: any) => {
                    const income = p?.[0]?.payload?.درآمد;
                    return view === "sales" && income ? `${label} · درآمد ${toman(income)}` : label;
                  }} />
                {view === "sales" ? <>
                  <Bar dataKey="گفتگوی پاسخ‌داده" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="سفارش" fill="var(--ai)" radius={[4, 4, 0, 0]} />
                </> : <>
                  <Bar dataKey="کرال" fill="var(--neutral)" fillOpacity={0.35} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="انتشار" stackId="p" fill="var(--primary)" />
                  <Bar dataKey="خطا" stackId="p" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                </>}
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
          <ChatCard sid={sid} today={{ chats: k.chats_answered_today ?? 0, replies: k.ai_replies_today ?? 0, orders: k.orders_today ?? 0 }} />
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
