"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartPulse, MessageCircle, Plug, Plus, Radar, Unplug } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago } from "@/lib/format";
import { storeQueries, useChannels, useStoreId } from "@/lib/hooks";
import { PLATFORMS } from "@/lib/meta";
import { OperationWatcher } from "@/components/OperationWatcher";
import { PlatformIcon } from "@/components/ui/status";
import { Button, Card, Chip, Dialog, Field, Input, PageHeader, Switch, FormActions } from "@/components/ui/primitives";
import { ChannelsBodySkeleton } from "@/components/ui/skeletons";

const HEALTH: Record<string, { label: string; tone: string }> = {
  connected: { label: "وصل", tone: "success" }, error: { label: "خطا", tone: "danger" },
  expired: { label: "منقضی", tone: "danger" }, disconnected: { label: "در انتظار اتصال", tone: "neutral" },
};

const HELP: Record<string, string[]> = {
  telegram: ["در تلگرام به ‎@BotFather پیام بده و یک ربات بساز؛ توکن را کپی کن.", "ربات را به کانالت اضافه کن و ادمین کن (با دسترسی ارسال پیام).", "توکن و آیدی کانال (مثلاً ‎@myshop) را اینجا وارد کن."],
  bale: ["در بله به ‎@botfather پیام بده و ربات بساز.", "ربات را ادمین کانالت کن.", "توکن و آیدی کانال را وارد کن."],
  digikala: ["شمارهٔ موبایل حساب فروشندگی دیجی‌کالا را وارد کن.", "کد تأییدی که دیجی‌کالا پیامک می‌کند را وارد کن.", "بعد از اتصال، محصولات با دسته، ویژگی‌ها و عکس‌ها در دیجی‌کالا ثبت و برای بررسی ارسال می‌شوند. قیمت و موجودی بعد از تأیید دیجی‌کالا در پنل خودشان ثبت می‌شود."],
  instagram: ["حساب اینستاگرام باید Business یا Creator باشد (تنظیمات اینستاگرام › نوع حساب). صفحهٔ فیسبوک لازم نیست.", "روی «ورود با اینستاگرام» بزن و دسترسی انتشار را تأیید کن.", "اینستاگرام روزانه حداکثر ۱۰۰ پست از طریق API قبول می‌کند؛ کاروسل تا ۱۰ عکس."],
  instagram_login: ["نام کاربری و رمز اینستاگرام را وارد کن؛ هر نوع حسابی (شخصی یا حرفه‌ای) قبول است.", "اگر اینستاگرام کد تأیید خواست (پیامک، ایمیل یا اپ احراز هویت)، همین‌جا واردش کن.", "پست، آلبوم تا ۱۰ عکس، استوری و ریلز منتشر می‌شود؛ انتشارها با فاصله و سقف روزانه انجام می‌شوند تا حساب محدود نشود."],
};

/** While a username + password connect runs, Instagram may ask for a code (2FA or a login check). */
function InstagramCode({ opId, channelId }: { opId: number; channelId?: number }) {
  const { data: op } = useQuery({ queryKey: ["operation", opId], queryFn: () => api(`/operations/${opId}`), enabled: false });
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const send = useMutation({
    mutationFn: () => api(`/channels/${channelId ?? op?.channel_id}/instagram/code`, { method: "POST", json: { code } }),
    onSuccess: () => { setSent(true); toast.success("کد ارسال شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!op?.result?.needs_code || op.status !== "running" || sent) return null;
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
      <Field label={op.result.code_label || "کد تأیید اینستاگرام"} hint="تا ۵ دقیقه منتظر می‌ماند.">
        <Input dir="ltr" inputMode="numeric" autoComplete="one-time-code" className="text-left tnum" value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
      </Field>
      <Button type="submit" className="w-full" loading={send.isPending}>ارسال کد</Button>
    </form>
  );
}

function ConnectDialog({ platform, channelId, oauth, login, onClose }: { platform: string; channelId?: number; oauth?: boolean; login?: boolean; onClose: () => void }) {
  const sid = useStoreId();
  const igLoginMode = platform === "instagram" && !!login;
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
      <ol className="list-decimal ps-5 space-y-1 text-[13px] text-muted mb-5">{HELP[igLoginMode ? "instagram_login" : platform].map((h) => <li key={h}>{h}</li>)}</ol>
      {igLoginMode && !opId && (
        <div className="rounded-xl bg-subtle p-3 text-[12px] text-muted leading-6 mb-5">
          اتصال با نام کاربری از API رسمی Meta نیست. برای امنیت حساب: رمز را فقط همین‌جا وارد کن، تا چند ساعت بعد از اتصال از جای دیگری وارد نشو، و اگر اینستاگرام پرسید «این شما بودید؟» تأیید کن.
        </div>
      )}
      {opId ? (
        <div className="space-y-3">
          {igLoginMode && <InstagramCode opId={opId} channelId={channelId} />}
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
          {igLoginMode && <>
            <Field label="نام کاربری اینستاگرام"><Input dir="ltr" className="text-left" placeholder="myshop" autoComplete="username" onChange={set("username")} required /></Field>
            <Field label="رمز عبور"><Input dir="ltr" type="password" className="text-left" autoComplete="current-password" onChange={set("password")} required /></Field>
          </>}
          {platform === "instagram" && !igLoginMode && oauth && (
            <Button type="button" className="w-full" loading={igLogin.isPending} onClick={() => igLogin.mutate()}>ورود با اینستاگرام</Button>
          )}
          {platform === "instagram" && !igLoginMode && oauth && !manual && (
            <button type="button" className="block mx-auto text-[13px] text-muted hover:text-fg transition-colors" onClick={() => setManual(true)}>یا وارد کردن دستی توکن</button>
          )}
          {platform === "instagram" && !igLoginMode && manual && (
            <Field label="توکن بلندمدت اینستاگرام" hint="Instagram User Access Token با دسترسی instagram_business_content_publish">
              <Input dir="ltr" className="text-left font-mono text-[13px]" onChange={set("access_token")} required />
            </Field>
          )}
          {(platform !== "instagram" || manual || igLoginMode) && (
            <FormActions><Button type="submit" className="w-full" variant={platform === "instagram" && oauth && !igLoginMode ? "secondary" : "primary"} loading={connect.isPending || sendCode.isPending}>
              {platform === "digikala" && !codeSent ? "ارسال کد تأیید" : "اتصال"}
            </Button></FormActions>
          )}
        </form>
      )}
    </Dialog>
  );
}

function InstagramCrawlDialog({ onClose }: { onClose: () => void }) {
  const sid = useStoreId();
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [reels, setReels] = useState(false);
  const [done, setDone] = useState(false);
  const add = useMutation({
    mutationFn: () => api(`/stores/${sid}/crawl-sources`, { method: "POST", json: { type: "instagram_profile", url: username, include_reels: reels, schedule: "manual", extraction_mode: "llm" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crawl-sources", sid] }); setDone(true); toast.success("پیج اینستاگرام اضافه شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open onClose={onClose} title="افزودن پیج اینستاگرام">
      <div className="rounded-xl bg-subtle p-3 text-[13px] text-muted leading-6 mb-5">
        فعلاً اینستاگرام فقط برای <b className="text-fg">کرال</b> باز است: محصولات پیجت از پست‌ها خوانده می‌شوند. انتشار در اینستاگرام هنوز فعال نیست.
      </div>
      {done ? (
        <div className="space-y-3">
          <p className="text-[14px]">پیج ‎@{username.replace(/^@/, "")} اضافه شد. از صفحهٔ کرال می‌توانی کرال را شروع کنی.</p>
          <Link href={`/app/s/${sid}/crawl`} className="block"><Button className="w-full" icon={<Radar className="size-4" />}>رفتن به کرال</Button></Link>
          <Button variant="secondary" className="w-full" onClick={onClose}>بستن</Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <Field label="آیدی پیج اینستاگرام" hint="۲۵ پست آخر کرال می‌شود؛ پستی که قبلاً کرال شده دوباره بارگذاری نمی‌شود.">
            <Input dir="ltr" className="text-left" placeholder="@mystore" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </Field>
          <label className="flex items-center gap-3 text-[14px]">
            <Switch checked={reels} onChange={setReels} />
            <span>ریلزها هم کرال شوند؟<span className="block text-[12px] text-muted">فقط عکس کاور ریلز برداشته می‌شود. خاموش باشد، فقط پست‌های عکس‌دار کرال می‌شوند.</span></span>
          </label>
          <FormActions><Button type="submit" className="w-full" loading={add.isPending}>افزودن پیج</Button></FormActions>
        </form>
      )}
    </Dialog>
  );
}

/** Username + password Instagram accounts: the chat assistant can answer their DMs and comments. */
function InstagramInbox({ channel }: { channel: any }) {
  const sid = useStoreId();
  const qc = useQueryClient();
  const cfg = channel.config ?? {};
  const [text, setText] = useState<string>(cfg.comment_text ?? "");
  const save = useMutation({
    mutationFn: (body: { dm: boolean; comments: boolean; comment_text: string }) =>
      api(`/channels/${channel.id}/instagram/inbox`, { method: "PUT", json: body }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["channels", sid] }); toast.success("ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  const body = (o: Partial<{ dm: boolean; comments: boolean }>) => ({ dm: !!cfg.dm_reply, comments: !!cfg.comment_reply, comment_text: text, ...o });
  return (
    <div className="mt-3 rounded-xl bg-subtle p-3 space-y-3 text-[14px]">
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span>جواب خودکار دایرکت<span className="block text-[12px] text-muted">دستیار چت به پیام‌ها و درخواست‌های پیام جواب می‌دهد.</span></span>
        <Switch checked={!!cfg.dm_reply} disabled={save.isPending} onChange={(v) => save.mutate(body({ dm: v }))} label="جواب خودکار دایرکت" />
      </label>
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span>جواب خودکار کامنت<span className="block text-[12px] text-muted">زیر کامنت یک جواب کوتاه می‌نویسد و جواب کامل را دایرکت می‌دهد.</span></span>
        <Switch checked={!!cfg.comment_reply} disabled={save.isPending} onChange={(v) => save.mutate(body({ comments: v }))} label="جواب خودکار کامنت" />
      </label>
      {cfg.comment_reply && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); save.mutate(body({})); }}>
          <Input className="flex-1" maxLength={200} placeholder="جواب‌تون رو دایرکت دادیم 🌹" value={text} onChange={(e) => setText(e.target.value)} aria-label="متن جواب زیر کامنت" />
          <Button size="sm" variant="secondary" type="submit" loading={save.isPending}>ذخیره</Button>
        </form>
      )}
      {(cfg.dm_reply || cfg.comment_reply) && (
        <Link href={`/app/s/${sid}/chat?tab=conversations`} className="text-[12px] text-primary hover:underline">گفتگوها در صفحهٔ AI چت</Link>
      )}
    </div>
  );
}

export default function Channels() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const { data: channels = [], isPending: chPending } = useChannels(sid);
  const { data: platforms = [], isPending: plPending } = useQuery(storeQueries.platforms());
  const { data: sources = [], isPending: srcPending } = useQuery(storeQueries.crawlSources(sid));
  const igPages = sources.filter((s: any) => s.type === "instagram_profile");
  const [connect, setConnect] = useState<{ platform: string; channelId?: number; crawlOnly?: boolean } | null>(null);
  const [healthOp, setHealthOp] = useState<number | null>(null);
  const health = useMutation({ mutationFn: (id: number) => api(`/channels/${id}/health`, { method: "POST" }), onSuccess: (op) => setHealthOp(op.id) });
  const crawl = useMutation({
    mutationFn: (id: number) => api(`/crawl-sources/${id}/run`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crawl-sources", sid] }); qc.invalidateQueries({ queryKey: ["operations", sid] }); toast.success("کرال شروع شد؛ نتیجه را در صفحهٔ کرال می‌بینی."); },
    onError: (e: any) => toast.error(e.message),
  });
  const crawlable = (platform: string) => !!platforms.find((p: any) => p.platform === platform)?.can_crawl;
  const disconnect = useMutation({
    mutationFn: (id: number) => api(`/channels/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["channels", sid] }); toast.success("اتصال قطع شد"); },
  });
  return (
    <>
      <PageHeader title="کانال‌ها" subtitle="کانال‌هایی که این فروشگاه در آن‌ها محصول منتشر می‌کند یا از آن‌ها کرال می‌کند." />
      {chPending || plPending || srcPending ? <ChannelsBodySkeleton /> : <>
      {(channels.length > 0 || igPages.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {igPages.map((s: any) => (
            <Card key={`ig-${s.id}`} className="p-5">
              <div className="flex items-center gap-3">
                <PlatformIcon platform="instagram" size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">اینستاگرام</div>
                  <div className="text-muted text-[12px]" dir="ltr">@{s.url}</div>
                </div>
                <Chip tone="crawl">فقط کرال</Chip>
              </div>
              <div className="text-[12px] text-muted mt-3">آخرین کرال: {ago(s.last_run_at)}</div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button size="sm" icon={<Radar className="size-4" />} loading={crawl.isPending && crawl.variables === s.id} onClick={() => crawl.mutate(s.id)}>کرال</Button>
                <Link href={`/app/s/${sid}/crawl`}><Button size="sm" variant="secondary">مدیریت کرال</Button></Link>
              </div>
            </Card>
          ))}
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
              {c.config?.mode === "private" && c.config?.paused_until && new Date(c.config.paused_until) > new Date() && (
                <p className="text-[13px] text-warning bg-warning/10 rounded-xl p-3 mt-3">
                  {c.config.pause_reason || "انتشار این حساب موقتاً متوقف است."} (ادامهٔ انتشار از {new Date(c.config.paused_until).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })})
                </p>
              )}
              {c.platform === "instagram" && c.config?.mode === "private" && c.status === "connected" && <InstagramInbox channel={c} />}
              <div className="flex flex-wrap gap-2 mt-4">
                {c.status !== "connected" && <Button size="sm" icon={<Plug className="size-4" />} onClick={() => setConnect({ platform: c.platform, channelId: c.id })}>اتصال مجدد</Button>}
                {crawlable(c.platform) && (() => {
                  // A channel that is already a crawl source runs it now; otherwise the crawl page opens with it preselected.
                  const src = sources.find((s: any) => s.channel_id === c.id);
                  return src
                    ? <Button size="sm" icon={<Radar className="size-4" />} loading={crawl.isPending && crawl.variables === src.id} onClick={() => crawl.mutate(src.id)}>کرال</Button>
                    : <Link href={`/app/s/${sid}/crawl?channel=${c.id}`}><Button size="sm" icon={<Radar className="size-4" />}>کرال</Button></Link>;
                })()}
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
              {p.can_publish && (p.crawl_only ? <Chip className="line-through opacity-60">انتشار</Chip> : <Chip>انتشار</Chip>)}
              {p.can_crawl && <Chip tone={p.crawl_only ? "crawl" : "neutral"}>کرال</Chip>}
            </div>
            {p.crawl_only && <div className="text-[12px] text-muted mt-2">فعلاً فقط کرال؛ انتشار خاموش است.</div>}
            <Button className="mt-4" variant="secondary" size="sm" icon={<Plus className="size-4" />} disabled={!p.enabled}
              onClick={() => setConnect({ platform: p.platform, crawlOnly: !!p.crawl_only })}>{!p.enabled ? "به‌زودی" : p.crawl_only ? "افزودن پیج" : "اتصال"}</Button>
          </Card>
        ))}
      </div>
      <Card className="p-5 mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="size-11 rounded-2xl bg-primary-soft text-primary grid place-items-center shrink-0"><MessageCircle className="size-5" /></span>
        <div className="flex-1">
          <div className="font-bold">دستیار چت فروش</div>
          <div className="text-[13px] text-muted">ربات چت تلگرام و بله (مستقل یا متصل به پیوی) از صفحهٔ AI چت وصل می‌شود، جدا از ربات‌های انتشار کانال.</div>
        </div>
        <Link href={`/app/s/${sid}/chat?tab=connections`}><Button variant="secondary">اتصال‌های چت</Button></Link>
      </Card>
      </>}
      {connect?.crawlOnly && <InstagramCrawlDialog onClose={() => setConnect(null)} />}
      {connect && !connect.crawlOnly && <ConnectDialog platform={connect.platform} channelId={connect.channelId} oauth={platforms.find((p: any) => p.platform === "instagram")?.oauth}
        login={platforms.find((p: any) => p.platform === "instagram")?.login}
        onClose={() => setConnect(null)} />}
    </>
  );
}
