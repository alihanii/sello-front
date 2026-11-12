"use client";

import { Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { storeQueries, useStoreId, useStores } from "@/lib/hooks";
import { faNum } from "@/lib/format";
import { PLATFORMS } from "@/lib/meta";
import { Button, Chip, Dialog, Switch, Tabs, cn } from "@/components/ui/primitives";

type Format = "post" | "story" | "reel";
const FORMAT_LABEL: Record<Format, string> = { post: "پست", story: "استوری", reel: "ریلز" };
const FORMAT_HINT: Record<Format, string> = {
  post: "عکس‌های محصول (تا ۱۰ عکس به‌صورت آلبوم) با متن و قیمت.",
  story: "ویدیوی محصول، یا اگر ویدیو ندارد عکس اول. فقط در اینستاگرام.",
  reel: "ویدیوی محصول با متن پست؛ محصول بدون ویدیو منتشر نمی‌شود. فقط در اینستاگرام.",
};

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
          <Button className="w-full mt-3" disabled={!chosen.length} loading={loading} onClick={() => onConfirm(chosen, showPrice, format)} icon={<Send className="size-4" />}>
            انتشار {format === "post" ? "" : FORMAT_LABEL[format] + " "}در {faNum(chosen.length)} کانال
          </Button>
        </div>
      )}
    </Dialog>
  );
}
