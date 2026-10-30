"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { faNum } from "@/lib/format";
import { PLATFORMS } from "@/lib/meta";
import { Button, Chip, Dialog, cn } from "@/components/ui/primitives";

export function PublishDialog({ open, onClose, channels, onConfirm, loading }: any) {
  const [sel, setSel] = useState<number[]>([]);
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
          <Button className="w-full mt-3" disabled={!sel.length} loading={loading} onClick={() => onConfirm(sel)} icon={<Send className="size-4" />}>
            انتشار در {faNum(sel.length)} کانال
          </Button>
        </div>
      )}
    </Dialog>
  );
}
