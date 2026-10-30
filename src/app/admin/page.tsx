"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, Inbox, MessageCircle, Package, Send, Store, Users } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { faNum, toman } from "@/lib/format";
import { PLATFORMS } from "@/lib/meta";
import { PlatformIcon } from "@/components/ui/status";
import { Card, CardHeader, PageHeader, Skeleton } from "@/components/ui/primitives";
import { AddAiKeyButton } from "@/components/admin/AiKeyEditor";

function Stat({ icon: I, label, value, hint, href }: any) {
  const body = (
    <Card className="p-5 h-full hover:-translate-y-0.5 transition">
      <div className="flex items-center justify-between text-muted text-[13px] font-semibold">{label}<I className="size-4" /></div>
      <div className="text-[26px] font-black tnum mt-1">{value}</div>
      {hint && <div className="text-[12px] text-muted">{hint}</div>}
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function AdminHome() {
  const { data: s } = useQuery({ queryKey: ["admin-stats"], queryFn: () => api("/admin/stats") });
  if (!s) return <Skeleton className="h-96" />;
  return (
    <>
      <PageHeader title="داشبورد ادمین" subtitle="نمای کلی کاربران، فروشگاه‌ها و درآمد" actions={<AddAiKeyButton />} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} label="کاربران" value={faNum(s.users)} hint={`${faNum(s.active_users_7d)} فعال در ۷ روز`} href="/admin/users" />
        <Stat icon={Store} label="فروشگاه‌ها" value={faNum(s.stores)} href="/admin/stores" />
        <Stat icon={Package} label="محصولات" value={faNum(s.products)} />
        <Stat icon={Send} label="انتشار موفق (۳۰ روز)" value={faNum(s.publishes_30d)} />
        <Stat icon={CreditCard} label="اشتراک فعال" value={faNum(s.active_subscriptions)} hint={`${faNum(s.expiring_7d)} تا ۷ روز دیگر تمام می‌شود`} />
        <Stat icon={CreditCard} label="فروش ۳۰ روز" value={toman(s.revenue_30d)} />
        <Stat icon={Inbox} label="درخواست خرید در انتظار" value={faNum(s.pending_requests)} href="/admin/requests" />
        <Stat icon={MessageCircle} label="منتظر قابلیت چت AI" value={faNum(s.chat_waitlist)} />
      </div>
      <Card className="mt-4">
        <CardHeader title="کانال‌های متصل به تفکیک پلتفرم" />
        <div className="px-5 pb-5 flex flex-wrap gap-4">
          {Object.keys(PLATFORMS).map((p) => (
            <Link key={p} href={`/admin/channels?platform=${p}`} className="flex items-center gap-3 glass rounded-xl p-3 pe-5">
              <PlatformIcon platform={p} size={34} />
              <div><div className="text-[13px] text-muted">{PLATFORMS[p].label}</div><div className="font-black text-[18px] tnum">{faNum(s.channels_by_platform[p] ?? 0)}</div></div>
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}
