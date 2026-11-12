"use client";

import { CalendarClock, Send } from "lucide-react";
import { format as jf } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { storeQueries, useStoreId, useStores } from "@/lib/hooks";
import { faDigits, faNum } from "@/lib/format";
import { PLATFORMS } from "@/lib/meta";
import { Button, Chip, Dialog, Input, Select, Switch, Tabs, cn } from "@/components/ui/primitives";

type Format = "post" | "story" | "reel";
const FORMAT_LABEL: Record<Format, string> = { post: "پست", story: "استوری", reel: "ریلز" };
const FORMAT_HINT: Record<Format, string> = {
  post: "عکس‌های محصول (تا ۱۰ عکس به‌صورت آلبوم) با متن و قیمت.",
  story: "ویدیوی محصول، یا اگر ویدیو ندارد عکس اول، در قاب استاندارد ۹:۱۶ (عکس با هر اندازه کامل دیده می‌شود). فقط در اینستاگرام.",
  reel: "ویدیوی محصول با متن پست؛ محصول بدون ویدیو منتشر نمی‌شود. فقط در اینستاگرام.",
};

const TEHRAN = 3.5 * 3600_000;

/** The next 30 days as Tehran calendar days: [y, m, d] (Gregorian) with a Jalali label. */
function tehranDays() {
  const now = new Date(Date.now() + TEHRAN);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i, 12));
    const label = i === 0 ? "امروز" : i === 1 ? "فردا" : jf(d, "EEEE d MMMM", { locale: faIR });
    return { key: d.toISOString().slice(0, 10), label, ymd: [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()] as const };
  });
}

/** Tehran day + "HH:MM" → ISO time in UTC. */
function tehranToIso(ymd: readonly [number, number, number], hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return new Date(Date.UTC(ymd[0], ymd[1], ymd[2], h || 0, m || 0) - TEHRAN).toISOString();
}

export function PublishDialog({ open, onClose, channels, onConfirm, loading }: any) {
  const [sel, setSel] = useState<number[]>([]);
  // Price in the post: starts from the store setting, then the seller's last choice in this store.
  const sid = useStoreId();
  const { data: stores } = useStores();
  const storeDefault = stores?.find((st: any) => st.id === sid)?.settings?.show_price_in_caption ?? true;
  const [showPrice, setShowPrice] = useState(true);
  useEffect(() => {
    if (!open) return;
    let saved: string | null = null;
    try { saved = localStorage.getItem(`sello:show-price:${sid}`); } catch {}
    setShowPrice(saved == null ? storeDefault : saved === "1");
  }, [open, sid, storeDefault]);
  // Story and reel: Instagram accounts connected with username + password.
  const { data: platforms = [] } = useQuery(storeQueries.platforms());
  const formats: Format[] = platforms.find((p: any) => p.platform === "instagram")?.formats ?? ["post"];
  const hasInstagram = channels.some((c: any) => c.platform === "instagram" && c.config?.mode === "private");
  const [format, setFormat] = useState<Format>("post");
  useEffect(() => { if (open) setFormat("post"); }, [open]);
  const allows = (c: any) => format === "post" || (c.platform === "instagram" && c.config?.mode === "private");
  const chosen = sel.filter((id) => allows(channels.find((c: any) => c.id === id)));
  const pacedInstagram = chosen.some((id) => channels.find((c: any) => c.id === id)?.config?.mode === "private");
  // When: now, or a Tehran day + time the seller picks.
  const days = tehranDays();
  const [when, setWhen] = useState<"now" | "later">("now");
  const [day, setDay] = useState(days[0].key);
  const [time, setTime] = useState("");
  useEffect(() => {
    if (!open) return;
    setWhen("now"); setDay(tehranDays()[0].key);
    const t = new Date(Date.now() + TEHRAN + 3600_000);
    setTime(`${String(t.getUTCHours()).padStart(2, "0")}:00`);
  }, [open]);
  const at = when === "later" && time ? tehranToIso(days.find((d) => d.key === day)!.ymd, time) : null;
  const atPast = !!at && new Date(at).getTime() < Date.now();
  const toggle = (v: boolean) => { setShowPrice(v); try { localStorage.setItem(`sello:show-price:${sid}`, v ? "1" : "0"); } catch {} };
  return (
    <Dialog open={open} onClose={onClose} title="انتشار در کانال‌ها">
      {channels.length === 0 ? <p className="text-muted">ابتدا یک کانال وصل کنید.</p> : (
        <div className="space-y-2">
          {hasInstagram && formats.length > 1 && (
            <div className="mb-3">
              <Tabs value={format} onChange={setFormat} items={formats.map((f) => ({ value: f, label: FORMAT_LABEL[f] }))} />
              <p className="text-[12px] text-muted mt-2">{FORMAT_HINT[format]}</p>
            </div>
          )}
          {channels.map((c: any) => (
            <label key={c.id} className={cn("flex items-center gap-3 p-3 rounded-xl border border-edge cursor-pointer", chosen.includes(c.id) && "bg-primary/8 border-primary/40",
              !allows(c) && "opacity-50 cursor-not-allowed")}>
              <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={chosen.includes(c.id)} disabled={!allows(c)}
                onChange={(e) => setSel(e.target.checked ? [...sel, c.id] : sel.filter((x) => x !== c.id))} />
              <span className="font-semibold text-[14px] flex-1">{c.display_name}</span>
              <span className="text-muted text-[12px]">{PLATFORMS[c.platform]?.label}</span>
              {c.status !== "connected" && <Chip tone="danger">قطع</Chip>}
            </label>
          ))}
          {format !== "story" && <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-subtle text-[14px] mt-3 cursor-pointer">
            <span>قیمت در پست نوشته شود؟<span className="block text-[12px] text-muted">{showPrice ? "قیمت محصول زیر متن پست می‌آید." : "پست بدون قیمت منتشر می‌شود."}</span></span>
            <Switch checked={showPrice} onChange={toggle} label="نمایش قیمت در پست" />
          </label>}
          {pacedInstagram && (
            <p className="text-[12px] text-muted leading-6 mt-2">
              برای محدود نشدن حساب، انتشارهای اینستاگرام یکی‌یکی و با فاصله انجام می‌شوند و هر روز سقف دارند؛ بقیه در صف می‌مانند و خودکار منتشر می‌شوند.
            </p>
          )}
          <div className="rounded-xl bg-subtle p-3 mt-3 space-y-3 text-[14px]">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2"><CalendarClock className="size-4 text-muted" />زمان انتشار</span>
              <Tabs value={when} onChange={setWhen} items={[{ value: "now", label: "همین حالا" }, { value: "later", label: "زمان‌بندی" }]} />
            </div>
            {when === "later" && (
              <>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Select value={day} onChange={(e: any) => setDay(e.target.value)} aria-label="روز انتشار">
                    {days.map((d) => <option key={d.key} value={d.key}>{faDigits(d.label)}</option>)}
                  </Select>
                  <Input type="time" dir="ltr" className="w-32 text-center" value={time} onChange={(e) => setTime(e.target.value)} aria-label="ساعت انتشار" required />
                </div>
                {atPast ? <p className="text-[12px] text-danger">این ساعت گذشته است؛ یک زمان در آینده انتخاب کن.</p> : (
                  <p className="text-[12px] text-muted leading-6">به وقت تهران. برای حساب‌های اینستاگرام و لینکدین اگر این ساعت به انتشار دیگری روی همان حساب خیلی نزدیک باشد یا سقف آن روز پر شده باشد، کمی جلوتر می‌رود و زمان دقیقش را در «فعالیت‌ها» می‌بینی.</p>
                )}
              </>
            )}
          </div>
          <Button className="w-full mt-3" disabled={!chosen.length || atPast || (when === "later" && !time)} loading={loading}
            onClick={() => onConfirm(chosen, showPrice, format, at)} icon={<Send className="size-4" />}>
            {at ? "زمان‌بندی " : "انتشار "}{format === "post" ? "" : FORMAT_LABEL[format] + " "}در {faNum(chosen.length)} کانال
          </Button>
        </div>
      )}
    </Dialog>
  );
}
