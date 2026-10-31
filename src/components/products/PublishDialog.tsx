"use client";

import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useStoreId, useStores } from "@/lib/hooks";
import { faNum } from "@/lib/format";
import { PLATFORMS } from "@/lib/meta";
import { Button, Chip, Dialog, Switch, cn } from "@/components/ui/primitives";

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
  const toggle = (v: boolean) => { setShowPrice(v); try { localStorage.setItem(`sello:show-price:${sid}`, v ? "1" : "0"); } catch {} };
  return (
    <Dialog open={open} onClose={onClose} title="انتشار در کانال‌ها">
      {channels.length === 0 ? <p className="text-muted">ابتدا یک کانال وصل کنید.</p> : (
        <div className="space-y-2">
          {channels.map((c: any) => (
            <label key={c.id} className={cn("flex items-center gap-3 p-3 rounded-xl border border-edge cursor-pointer", sel.includes(c.id) && "bg-primary/8 border-primary/40")}>
              <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={sel.includes(c.id)}
                onChange={(e) => setSel(e.target.checked ? [...sel, c.id] : sel.filter((x) => x !== c.id))} />
              <span className="font-semibold text-[14px] flex-1">{c.display_name}</span>
              <span className="text-muted text-[12px]">{PLATFORMS[c.platform]?.label}</span>
              {c.status !== "connected" && <Chip tone="danger">قطع</Chip>}
            </label>
          ))}
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-subtle text-[14px] mt-3 cursor-pointer">
            <span>قیمت در پست نوشته شود؟<span className="block text-[12px] text-muted">{showPrice ? "قیمت محصول زیر متن پست می‌آید." : "پست بدون قیمت منتشر می‌شود."}</span></span>
            <Switch checked={showPrice} onChange={toggle} label="نمایش قیمت در پست" />
          </label>
          <Button className="w-full mt-3" disabled={!sel.length} loading={loading} onClick={() => onConfirm(sel, showPrice)} icon={<Send className="size-4" />}>
            انتشار در {faNum(sel.length)} کانال
          </Button>
        </div>
      )}
    </Dialog>
  );
}
