"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartPulse, Plug, Plus, Unplug } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago } from "@/lib/format";
import { useChannels, useStoreId } from "@/lib/hooks";
import { PLATFORMS } from "@/lib/meta";
import { OperationWatcher } from "@/components/OperationWatcher";
import { PlatformIcon } from "@/components/ui/status";
import { Button, Card, Chip, Dialog, Field, Input, PageHeader } from "@/components/ui/primitives";

const HEALTH: Record<string, { label: string; tone: string }> = {
  connected: { label: "وصل", tone: "success" }, error: { label: "خطا", tone: "danger" },
  expired: { label: "منقضی", tone: "danger" }, disconnected: { label: "در انتظار اتصال", tone: "neutral" },
};

const HELP: Record<string, string[]> = {
  telegram: ["در تلگرام به ‎@BotFather پیام بده و یک ربات بساز؛ توکن را کپی کن.", "ربات را به کانالت اضافه کن و ادمین کن (با دسترسی ارسال پیام).", "توکن و آیدی کانال (مثلاً ‎@myshop) را اینجا وارد کن."],
  bale: ["در بله به ‎@botfather پیام بده و ربات بساز.", "ربات را ادمین کانالت کن.", "توکن و آیدی کانال را وارد کن."],
  digikala: ["شمارهٔ موبایل حساب فروشندگی دیجی‌کالا را وارد کن.", "کد تأییدی که دیجی‌کالا پیامک می‌کند را وارد کن.", "بعد از اتصال، محصولات با دسته، ویژگی‌ها و عکس‌ها در دیجی‌کالا ثبت و برای بررسی ارسال می‌شوند. قیمت و موجودی بعد از تأیید دیجی‌کالا در پنل خودشان ثبت می‌شود."],
  instagram: ["حساب اینستاگرام باید Business یا Creator باشد (تنظیمات اینستاگرام › نوع حساب). صفحهٔ فیسبوک لازم نیست.", "روی «ورود با اینستاگرام» بزن و دسترسی انتشار را تأیید کن.", "اینستاگرام روزانه حداکثر ۱۰۰ پست از طریق API قبول می‌کند؛ کاروسل تا ۱۰ عکس."],
};

function ConnectDialog({ platform, channelId, oauth, onClose }: { platform: string; channelId?: number; oauth?: boolean; onClose: () => void }) {
  const sid = useStoreId();
  const [manual, setManual] = useState(!oauth);
  const igLogin = useMutation({
    mutationFn: () => api(`/stores/${sid}/channels/instagram/oauth-url${channelId ? `?channel_id=${channelId}` : ""}`),
    onSuccess: (r) => { window.location.href = r.url; },
    onError: (e: any) => toast.error(e.message),
  });
  const qc = useQueryClient();
  const [data, setData] = useState<Record<string, string>>({});
  const [opId, setOpId] = useState<number | null>(null);
  const [dkChannel, setDkChannel] = useState<number | undefined>(channelId);
  const [codeSent, setCodeSent] = useState(false);
  const set = (k: string) => (e: any) => setData({ ...data, [k]: e.target.value });
  const connect = useMutation({
    mutationFn: () => api(`/stores/${sid}/channels/connect`, { method: "POST", json: { platform, channel_id: dkChannel, data } }),
    onSuccess: (op) => setOpId(op.id),
    onError: (e: any) => toast.error(e.message),
  });
  const sendCode = useMutation({
    mutationFn: () => api(`/stores/${sid}/channels/digikala/send-code`, { method: "POST", json: { platform, channel_id: dkChannel, data } }),
    onSuccess: (r) => { setDkChannel(r.channel_id); setCodeSent(true); toast.success("کد تأیید دیجی‌کالا ارسال شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open onClose={onClose} title={`اتصال ${PLATFORMS[platform].label}`}>
      <ol className="list-decimal ps-5 space-y-1 text-[13px] text-muted mb-5">{HELP[platform].map((h) => <li key={h}>{h}</li>)}</ol>
      {opId ? (
        <div className="space-y-3">
          <OperationWatcher opId={opId} storeId={sid} onDone={(o) => { qc.invalidateQueries({ queryKey: ["channels", sid] }); if (o.status === "succeeded") toast.success("کانال وصل شد"); }} />
          <Button variant="secondary" className="w-full" onClick={onClose}>بستن</Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (platform === "digikala" && !codeSent) sendCode.mutate(); else connect.mutate(); }}>
          {(platform === "telegram" || platform === "bale") && <>
            <Field label="توکن ربات"><Input dir="ltr" className="text-left font-mono text-[13px]" placeholder="123456:ABC…" onChange={set("bot_token")} required /></Field>
            <Field label="آیدی کانال" hint="مثل ‎@myshop یا شناسهٔ عددی کانال خصوصی"><Input dir="ltr" className="text-left" placeholder="@myshop" onChange={set("chat_id")} required /></Field>
          </>}
          {platform === "digikala" && <>
            <Field label="موبایل حساب فروشندگی"><Input dir="ltr" className="text-left tnum" placeholder="09…" onChange={set("phone")} required disabled={codeSent} /></Field>
            {codeSent && <Field label="کد تأیید دیجی‌کالا"><Input dir="ltr" className="text-left tnum" onChange={set("code")} required autoFocus /></Field>}
          </>}
          {platform === "instagram" && oauth && (
            <Button type="button" className="w-full" loading={igLogin.isPending} onClick={() => igLogin.mutate()}>ورود با اینستاگرام</Button>
          )}
          {platform === "instagram" && oauth && !manual && (
            <button type="button" className="block mx-auto text-[13px] text-muted hover:text-fg transition-colors" onClick={() => setManual(true)}>یا وارد کردن دستی توکن</button>
          )}
          {platform === "instagram" && manual && (
            <Field label="توکن بلندمدت اینستاگرام" hint="Instagram User Access Token با دسترسی instagram_business_content_publish">
              <Input dir="ltr" className="text-left font-mono text-[13px]" onChange={set("access_token")} required />
            </Field>
          )}
          {(platform !== "instagram" || manual) && (
            <Button type="submit" className="w-full" variant={platform === "instagram" && oauth ? "secondary" : "primary"} loading={connect.isPending || sendCode.isPending}>
              {platform === "digikala" && !codeSent ? "ارسال کد تأیید" : "اتصال"}
            </Button>
          )}
        </form>
      )}
    </Dialog>
  );
}

export default function Channels() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const { data: channels = [] } = useChannels(sid);
  const { data: platforms = [] } = useQuery({ queryKey: ["platforms"], queryFn: () => api<any[]>("/platforms") });
  const [connect, setConnect] = useState<{ platform: string; channelId?: number } | null>(null);
  const [healthOp, setHealthOp] = useState<number | null>(null);
  const health = useMutation({ mutationFn: (id: number) => api(`/channels/${id}/health`, { method: "POST" }), onSuccess: (op) => setHealthOp(op.id) });
  const disconnect = useMutation({
    mutationFn: (id: number) => api(`/channels/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["channels", sid] }); toast.success("اتصال قطع شد"); },
  });
  return (
    <>
      <PageHeader title="کانال‌ها" subtitle="کانال‌هایی که این فروشگاه در آن‌ها محصول منتشر می‌کند یا از آن‌ها کرال می‌کند." />
      {channels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {channels.map((c: any) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-center gap-3">
                <PlatformIcon platform={c.platform} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{c.display_name || PLATFORMS[c.platform].label}</div>
                  <div className="text-muted text-[12px]" dir="ltr">{c.config?.username ? `@${c.config.username}` : c.external_account_id}</div>
                </div>
                <Chip tone={HEALTH[c.status].tone}>{HEALTH[c.status].label}</Chip>
              </div>
              <div className="text-[12px] text-muted mt-3">آخرین بررسی سلامت: {ago(c.last_health_at)}</div>
              {c.last_error && <p className="text-[13px] text-danger bg-danger/8 rounded-xl p-3 mt-3">{c.last_error}</p>}
              <div className="flex flex-wrap gap-2 mt-4">
                {c.status !== "connected" && <Button size="sm" icon={<Plug className="size-4" />} onClick={() => setConnect({ platform: c.platform, channelId: c.id })}>اتصال مجدد</Button>}
                <Button size="sm" variant="secondary" icon={<HeartPulse className="size-4" />} loading={health.isPending && health.variables === c.id} onClick={() => health.mutate(c.id)}>بررسی سلامت</Button>
                <Button size="sm" variant="ghost" icon={<Unplug className="size-4" />} onClick={() => confirm("اتصال این کانال قطع شود؟") && disconnect.mutate(c.id)}>قطع اتصال</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {healthOp && <div className="mb-8"><OperationWatcher opId={healthOp} storeId={sid} onDone={() => qc.invalidateQueries({ queryKey: ["channels", sid] })} /></div>}
      <h2 className="font-bold text-[16px] mb-3">افزودن کانال</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {platforms.map((p: any) => (
          <Card key={p.platform} className="p-5 flex flex-col">
            <PlatformIcon platform={p.platform} size={44} />
            <div className="font-bold mt-3">{p.label}</div>
            <div className="text-[12px] text-muted flex flex-wrap gap-1 mt-1">
              {p.can_publish && <Chip>انتشار</Chip>}{p.can_crawl && <Chip>کرال</Chip>}
            </div>
            <Button className="mt-4" variant="secondary" size="sm" icon={<Plus className="size-4" />} disabled={!p.enabled}
              onClick={() => setConnect({ platform: p.platform })}>{p.enabled ? "اتصال" : "به‌زودی"}</Button>
          </Card>
        ))}
      </div>
      {connect && <ConnectDialog platform={connect.platform} channelId={connect.channelId} oauth={platforms.find((p: any) => p.platform === "instagram")?.oauth}
        onClose={() => setConnect(null)} />}
    </>
  );
}
