"use client";

import { Bot, CheckCircle2, Circle, Coins, MessageCircle, ShoppingBag, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { ago, faNum, toman } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { BOT_STATUS, MODE_LABEL } from "@/lib/chat";
import { PlatformIcon } from "@/components/ui/status";
import { Button, Card, CardHeader, Chip, cn } from "@/components/ui/primitives";
import { ChatOverviewSkeleton } from "@/components/ui/skeletons";

function SetupRow({ s, open }: { s: any; open: (s: any) => void }) {
  return (
    <button onClick={() => open(s)} disabled={!s.tab}
      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-start text-[14px] hover:bg-subtle disabled:hover:bg-transparent cursor-pointer disabled:cursor-default">
      {s.done ? <CheckCircle2 className="size-5 text-success shrink-0" /> : <Circle className={cn("size-5 shrink-0", s.required ? "text-warning" : "text-muted")} />}
      <span className={cn("flex-1", s.done && "text-muted")}>
        {s.label}
        {!s.done && s.required && s.hint && s.hint !== s.label && <span className="block text-[12px] text-muted">مانده: {s.hint}</span>}
      </span>
      {!s.done && s.tab && <span className="text-primary text-[13px] font-bold">انجام بده</span>}
    </button>
  );
}

function Stat({ icon: Icon, label, value, hint, onClick }: any) {
  return (
    <Card className={cn("p-4 sm:p-5", onClick && "cursor-pointer hover:bg-glass-strong transition")} onClick={onClick}>
      <div className="flex items-center gap-2 text-muted text-[13px] font-semibold"><Icon className="size-4" aria-hidden />{label}</div>
      <div className="text-[24px] sm:text-[28px] font-black tnum mt-2 leading-none">{value}</div>
      {hint && <div className="text-muted text-[12px] mt-2">{hint}</div>}
    </Card>
  );
}

export function ChatOverview({ data, go }: { data: any; go: (t: any, extra?: string) => void }) {
  const router = useRouter();
  const sid = useStoreId();
  if (!data) return <ChatOverviewSkeleton />;
  const m = data.month;
  const pct = m.limit ? Math.min(100, Math.round((100 * m.ai_messages) / m.limit)) : 0;
  const required = data.setup.filter((s: any) => s.required);
  const advice = data.setup.filter((s: any) => !s.required);
  const done = data.setup.filter((s: any) => s.done).length;
  // "products" lives on the store's products page; the rest are tabs here.
  const open = (s: any) => (s.tab === "products" ? router.push(`/app/s/${sid}/products`) : s.tab && go(s.tab));
  return (
    <div className="space-y-4">
      {!data.ai_ready && (
        <Card className="p-4 border border-warning/30 text-[14px]">
          <b className="text-warning">هوش مصنوعی هنوز آماده نیست.</b> تا ادمین Sello کلید AI را تنظیم نکند، دستیار روشن نمی‌شود.
          {data.ai_problem && <span className="block text-muted text-[13px] mt-1">{data.ai_problem}</span>}
        </Card>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat icon={MessageCircle} label="پیام مشتری امروز" value={faNum(data.today.customer_messages)} hint={`${faNum(data.today.ai_replies)} پاسخ دستیار`} onClick={() => go("conversations")} />
        <Stat icon={UserRound} label="منتظر ادمین" value={faNum(data.needs_human)} hint="گفتگوهایی که دستیار به تو سپرده" onClick={() => go("conversations")} />
        <Stat icon={ShoppingBag} label="سفارش‌های AI" value={faNum(data.orders.payment_submitted)} hint={`فیش منتظر تأیید · ${faNum(data.orders.awaiting_payment)} منتظر پرداخت`} onClick={() => go("orders")} />
        <Stat icon={Coins} label="هزینهٔ این ماه" value={toman(m.cost_toman)} hint={`${faNum(m.tokens)} توکن`} onClick={() => go("usage")} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="راه‌اندازی" subtitle={`${faNum(done)} از ${faNum(data.setup.length)} مرحله`}
            action={data.ready ? <Chip tone="success">آمادهٔ روشن شدن</Chip> : <Chip tone="warning">مراحل لازم مانده</Chip>} />
          <div className="px-3 pb-3">
            <div className="px-2.5 pt-1 pb-1 text-[12px] font-bold text-muted">لازم برای روشن کردن دستیار</div>
            {required.map((s: any) => <SetupRow key={s.key} s={s} open={open} />)}
            <div className="px-2.5 pt-3 pb-1 text-[12px] font-bold text-muted">پیشنهادی: جواب‌های بهتر</div>
            {advice.map((s: any) => <SetupRow key={s.key} s={s} open={open} />)}
          </div>
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex justify-between text-[13px]"><span className="font-bold">پیام‌های AI این ماه</span><span className="text-muted tnum">{faNum(m.ai_messages)} از {faNum(m.limit)}</span></div>
            <div className="h-2 rounded-full bg-subtle mt-3 overflow-hidden"><div className={cn("h-full rounded-full", pct >= 90 ? "bg-danger" : "bg-primary")} style={{ width: `${pct}%` }} /></div>
            <p className="text-[12px] text-muted mt-2">فقط پاسخ‌هایی که مدل AI ساخته حساب می‌شوند؛ خوشامد، سؤالات متداول و ثبت فیش رایگان‌اند.</p>
          </Card>
          <Card>
            <CardHeader title="اتصال‌ها" action={<Button size="sm" variant="secondary" onClick={() => go("connections")}>مدیریت</Button>} />
            <div className="px-5 pb-5 space-y-3">
              {data.bots.length === 0 && <p className="text-[13px] text-muted">هنوز رباتی وصل نشده.</p>}
              {data.bots.map((b: any) => (
                <div key={b.id} className="flex items-center gap-3">
                  <PlatformIcon platform={b.platform} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold truncate" dir="ltr">@{b.bot_username}</div>
                    <div className="text-[12px] text-muted">{MODE_LABEL[b.mode]} · آخرین پیام {ago(b.last_update_at)}</div>
                  </div>
                  <Chip tone={BOT_STATUS[b.status]?.tone}>{BOT_STATUS[b.status]?.label}</Chip>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <Bot className="size-8 text-primary shrink-0" />
        <div className="flex-1 text-[14px]">
          <div className="font-bold">دستیار فقط دربارهٔ فروش جواب می‌دهد</div>
          <div className="text-muted text-[13px]">محصولات، سفارش، پرداخت، ارسال و سؤالات متداول. هر سؤال دیگری با پیام ثابت «خارج از موضوع» جواب داده می‌شود و هزینه‌ای جز همان یک تشخیص ندارد.</div>
        </div>
        <Button variant="secondary" onClick={() => go("test")}>تست چت</Button>
      </Card>
    </div>
  );
}
