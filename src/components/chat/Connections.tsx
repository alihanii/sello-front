"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Copy, ExternalLink, HeartPulse, Plus, ShieldCheck, Unplug, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { BOT_STATUS, MODE_LABEL } from "@/lib/chat";
import { PlatformIcon } from "@/components/ui/status";
import { Button, Card, Chip, Dialog, EmptyState, Field, Input, cn } from "@/components/ui/primitives";

const botLink = (platform: string, username: string) => `https://${platform === "bale" ? "ble.ir" : "t.me"}/${username}`;

const HELP: Record<string, string[]> = {
  "telegram-bot": ["در تلگرام به ‎@BotFather پیام بده و با ‎/newbot یک ربات جدید بساز (جدا از ربات کانال).", "توکنی که می‌دهد را کپی کن و اینجا بگذار.", "لینک ربات را در بیو کانال یا پیجت بگذار تا مشتری‌ها به آن پیام بدهند."],
  "bale-bot": ["در بله به ‎@botfather پیام بده و یک ربات جدید بساز (جدا از ربات کانال).", "توکن را کپی کن و اینجا بگذار.", "لینک ربات را در کانال و پیجت بگذار."],
  "telegram-business": ["حساب تلگرامت باید Telegram Premium داشته باشد.", "در ‎@BotFather یک ربات بساز و در Bot Settings › Business Mode آن را روشن کن.", "توکن را اینجا بگذار و «اتصال» را بزن.", "در تلگرام: Settings › Telegram Business › Chatbots، نام ربات را وارد کن و اجازهٔ «پاسخ به پیام‌ها» را بده."],
};

function ConnectDialog({ onClose }: { onClose: () => void }) {
  const sid = useStoreId();
  const qc = useQueryClient();
  const { data: platforms = [] } = useQuery({ queryKey: ["chat-platforms", sid], queryFn: () => api<any[]>(`/stores/${sid}/chat/platforms`) });
  const [platform, setPlatform] = useState("telegram");
  const [mode, setMode] = useState("bot");
  const [token, setToken] = useState("");
  const [done, setDone] = useState<any>(null);
  const info = platforms.find((p) => p.platform === platform);
  const connect = useMutation({
    mutationFn: () => api(`/stores/${sid}/chat/bots`, { method: "POST", json: { platform, mode, bot_token: token } }),
    onSuccess: (b) => { setDone(b); qc.invalidateQueries({ queryKey: ["chat-bots", sid] }); qc.invalidateQueries({ queryKey: ["chat-overview", sid] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open onClose={onClose} title="اتصال دستیار چت">
      {done ? (
        <div className="space-y-4">
          {done.mode === "business" ? (
            <div className="rounded-xl bg-warning/10 p-4 text-[14px] leading-7">
              ربات <b dir="ltr">@{done.bot_username}</b> ثبت شد. حالا در تلگرام: <b>Settings › Telegram Business › Chatbots</b>، نام ربات را وارد کن و «پاسخ به پیام‌ها» را روشن کن. وقتی وصل شد، وضعیت اینجا «وصل» می‌شود.
            </div>
          ) : (
            <div className="rounded-xl bg-success/10 p-4 text-[14px] leading-7">
              ربات <b dir="ltr">@{done.bot_username}</b> وصل شد. از کارت اتصال، «اتصال ادمین» را بزن تا سفارش‌ها و پیام‌های مهم برایت فرستاده شود.
            </div>
          )}
          <Button className="w-full" onClick={onClose}>تمام</Button>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); connect.mutate(); }}>
          <div>
            <div className="text-[13px] font-semibold mb-2">پیام‌رسان</div>
            <div className="grid grid-cols-2 gap-2">
              {["telegram", "bale"].map((p) => (
                <button type="button" key={p} onClick={() => { setPlatform(p); if (p === "bale") setMode("bot"); }}
                  className={cn("flex items-center gap-3 p-3 rounded-2xl border transition cursor-pointer", platform === p ? "border-primary bg-primary-soft" : "border-edge hover:bg-subtle")}>
                  <PlatformIcon platform={p} size={32} /><span className="font-bold">{p === "bale" ? "بله" : "تلگرام"}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[13px] font-semibold mb-2">نوع اتصال</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[["bot", Bot, "بات مستقل", "مشتری به ربات فروشگاه پیام می‌دهد."], ["business", UserRound, "اتصال به پیوی", "ربات در پیوی حساب خودت به اسم خودت جواب می‌دهد."]].map(([v, I, l, d]: any) => {
                const disabled = info && !info.modes?.[v];
                return (
                  <button type="button" key={v} disabled={disabled} onClick={() => setMode(v)}
                    className={cn("text-start p-3 rounded-2xl border transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed", mode === v ? "border-primary bg-primary-soft" : "border-edge hover:bg-subtle")}>
                    <div className="flex items-center gap-2 font-bold text-[14px]"><I className="size-4" />{l}</div>
                    <div className="text-[12px] text-muted mt-1">{disabled ? info.business_note : d}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <ol className="list-decimal ps-5 space-y-1 text-[13px] text-muted">{HELP[`${platform}-${mode}`]?.map((h) => <li key={h}>{h}</li>)}</ol>
          <Field label="توکن ربات" hint="توکن رمزگذاری‌شده ذخیره می‌شود و در هیچ لاگی نمایش داده نمی‌شود.">
            <Input dir="ltr" className="text-left font-mono text-[13px]" placeholder="123456:ABC…" value={token} onChange={(e) => setToken(e.target.value)} required autoFocus />
          </Field>
          <Button type="submit" className="w-full" loading={connect.isPending}>اتصال</Button>
        </form>
      )}
    </Dialog>
  );
}

function AdminLinkDialog({ bot, onClose }: { bot: any; onClose: () => void }) {
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-code", bot.id], queryFn: () => api(`/chat/bots/${bot.id}/admin-code`, { method: "POST" }), staleTime: Infinity, gcTime: 0 });
  const copy = () => { navigator.clipboard?.writeText(data.command); toast.success("کپی شد"); };
  return (
    <Dialog open onClose={onClose} title="اتصال ادمین به ربات">
      <p className="text-[14px] text-muted leading-7 mb-4">این دستور را از حساب تلگرام/بلهٔ خودت (یا همکارت) به ربات بفرست. از آن به بعد سفارش‌های جدید، فیش‌ها و درخواست‌های «با ادمین صحبت کنم» در همان چت به تو خبر داده می‌شود. کد تا ۱۵ دقیقه معتبر است.</p>
      {isLoading ? <div className="h-14 rounded-2xl bg-subtle shimmer" /> : error ? <p className="text-danger text-[14px]">{(error as any).message}</p> : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl bg-subtle p-3">
            <code dir="ltr" className="flex-1 text-left font-mono text-[18px] font-bold tnum">{data.command}</code>
            <Button size="sm" variant="secondary" icon={<Copy className="size-4" />} onClick={copy}>کپی</Button>
          </div>
          <a href={botLink(bot.platform, bot.bot_username)} target="_blank" rel="noreferrer" className="block">
            <Button variant="secondary" className="w-full" icon={<ExternalLink className="size-4" />}>باز کردن ربات</Button>
          </a>
        </div>
      )}
    </Dialog>
  );
}

export function ChatConnections() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const { data: bots, isLoading } = useQuery({ queryKey: ["chat-bots", sid], queryFn: () => api<any[]>(`/stores/${sid}/chat/bots`), refetchInterval: 15_000 });
  const [adding, setAdding] = useState(false);
  const [adminFor, setAdminFor] = useState<any>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["chat-bots", sid] }); qc.invalidateQueries({ queryKey: ["chat-overview", sid] }); };
  const check = useMutation({ mutationFn: (id: number) => api(`/chat/bots/${id}/check`, { method: "POST" }), onSuccess: (b) => {
    refresh();
    if (b.status === "connected") toast.success("اتصال سالم است");
    else toast.error(b.last_error || BOT_STATUS[b.status]?.label);
  }, onError: (e: any) => toast.error(e.message) });
  const remove = useMutation({ mutationFn: (id: number) => api(`/chat/bots/${id}`, { method: "DELETE" }), onSuccess: () => { refresh(); toast.success("اتصال قطع شد"); } });
  const unlink = useMutation({ mutationFn: (id: number) => api(`/chat/bots/${id}/admin`, { method: "DELETE" }), onSuccess: refresh });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[14px] text-muted">هر چند ربات که بخواهی وصل کن؛ همه از یک دستیار و یک تنظیمات استفاده می‌کنند.</p>
        <Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>اتصال جدید</Button>
      </div>
      {isLoading ? <div className="h-40 rounded-3xl bg-subtle shimmer" /> : !bots?.length ? (
        <Card><EmptyState icon={<Bot className="size-7" />} title="هنوز رباتی وصل نشده" text="یک ربات مستقل بساز یا ربات را به پیوی حساب تلگرامت وصل کن." action={<Button onClick={() => setAdding(true)}>اتصال اولین ربات</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bots.map((b) => (
            <Card key={b.id} className="p-5 flex flex-col">
              <div className="flex items-center gap-3">
                <PlatformIcon platform={b.platform} size={40} />
                <div className="flex-1 min-w-0">
                  <a href={botLink(b.platform, b.bot_username)} target="_blank" rel="noreferrer" className="font-bold truncate block hover:text-primary" dir="ltr">@{b.bot_username}</a>
                  <div className="text-[12px] text-muted">{MODE_LABEL[b.mode]}{b.mode === "business" && b.business_user_name ? ` · ${b.business_user_name}` : ""}</div>
                </div>
                <Chip tone={BOT_STATUS[b.status]?.tone}>{BOT_STATUS[b.status]?.label}</Chip>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-[12px] mt-4">
                <div className="rounded-xl bg-subtle p-2.5"><dt className="text-muted">آخرین پیام</dt><dd className="font-bold mt-0.5">{ago(b.last_update_at)}</dd></div>
                <div className="rounded-xl bg-subtle p-2.5"><dt className="text-muted">ادمین</dt><dd className="font-bold mt-0.5 truncate">{b.admin_connected ? (b.admin_name || "وصل") : "وصل نیست"}</dd></div>
              </dl>
              {b.mode === "business" && b.status === "waiting_business" && !b.last_error && (
                <p className="text-[13px] bg-warning/10 rounded-xl p-3 mt-3">در تلگرام: Settings › Telegram Business › Chatbots، ربات <b dir="ltr">@{b.bot_username}</b> را اضافه کن.</p>
              )}
              {b.last_error && <p className="text-[13px] text-danger bg-danger/8 rounded-xl p-3 mt-3">{b.last_error}</p>}
              <div className="flex flex-wrap gap-2 mt-auto pt-4">
                <Button size="sm" variant="secondary" icon={<HeartPulse className="size-4" />} loading={check.isPending && check.variables === b.id} onClick={() => check.mutate(b.id)}>بررسی اتصال</Button>
                {b.mode === "bot" && (b.admin_connected
                  ? <Button size="sm" variant="ghost" icon={<ShieldCheck className="size-4" />} onClick={() => confirm("ادمین از این ربات جدا شود؟") && unlink.mutate(b.id)}>جدا کردن ادمین</Button>
                  : <Button size="sm" icon={<ShieldCheck className="size-4" />} onClick={() => setAdminFor(b)}>اتصال ادمین</Button>)}
                <Button size="sm" variant="ghost" icon={<Unplug className="size-4" />} onClick={() => confirm("اتصال این ربات قطع شود؟ دستیار دیگر در آن جواب نمی‌دهد.") && remove.mutate(b.id)}>قطع</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Card className="p-5 mt-6 text-[13px] text-muted leading-7">
        <b className="text-fg">چرا ربات جدا؟</b> رباتی که برای انتشار در کانال وصل کرده‌ای و ربات چت هر دو پیام‌هایشان را از یک صف می‌خوانند؛ اگر یکی باشند پیام‌های همدیگر را می‌گیرند. برای چت یک ربات جدید بساز.
        <br /><b className="text-fg">بله و پیوی:</b> API رسمی ربات‌های بله هنوز امکان وصل شدن به پیوی حساب شخصی را ندارد؛ برای بله از «بات مستقل» استفاده کن.
      </Card>
      {adding && <ConnectDialog onClose={() => setAdding(false)} />}
      {adminFor && <AdminLinkDialog bot={adminFor} onClose={() => { setAdminFor(null); refresh(); }} />}
    </>
  );
}
