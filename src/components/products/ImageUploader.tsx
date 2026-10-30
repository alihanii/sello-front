"use client";

import { ImagePlus, Star, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { API_URL, getToken, mediaUrl } from "@/lib/api";
import { Spinner, cn } from "@/components/ui/primitives";

export function ImageUploader({ storeId, value, onChange, max = 10 }: { storeId: number; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, max - value.length);
    if (!list.length) return;
    setBusy(true);
    const fd = new FormData();
    list.forEach((f) => fd.append("files", f));
    try {
      const res = await fetch(`${API_URL}/api/v1/stores/${storeId}/uploads`, { method: "POST", body: fd, headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail?.message ?? "آپلود ناموفق بود");
      onChange([...value, ...data.urls]);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {value.map((url, i) => (
          <div key={url} draggable onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragIdx == null || dragIdx === i) return; const n = [...value]; const [m] = n.splice(dragIdx, 1); n.splice(i, 0, m); onChange(n); setDragIdx(null); }}
            className={cn("relative aspect-square rounded-xl overflow-hidden bg-subtle group cursor-grab", i === 0 && "ring-2 ring-primary")}>
            <img src={mediaUrl(url)} alt="" className="size-full object-cover" />
            {i === 0 && <span className="absolute top-1 start-1 text-[10px] font-bold bg-primary text-primary-fg rounded-md px-1.5 py-0.5 flex items-center gap-0.5"><Star className="size-2.5" />اصلی</span>}
            <button type="button" onClick={() => onChange(value.filter((u) => u !== url))} aria-label="حذف عکس"
              className="absolute top-1 end-1 size-6 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button type="button" onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) upload(e.dataTransfer.files); }}
            className={cn("aspect-square rounded-xl border-2 border-dashed border-edge grid place-items-center text-muted hover:text-primary hover:border-primary/50 transition cursor-pointer",
              drag && "border-primary bg-primary/8")}>
            {busy ? <Spinner className="size-5" /> : <span className="flex flex-col items-center gap-1 text-[12px]"><ImagePlus className="size-5" />افزودن عکس</span>}
          </button>
        )}
      </div>
      <p className="text-[12px] text-muted mt-2">عکس اول، عکس اصلی است. برای تغییر ترتیب بکشید و رها کنید.</p>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
    </div>
  );
}
