"use client";

import { Film, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { API_URL, getToken, mediaUrl } from "@/lib/api";
import { Spinner, cn } from "@/components/ui/primitives";

export const VIDEO_HINT = "برای ریلز و استوری ویدیویی اینستاگرام. MP4 یا MOV، حداکثر ۳ دقیقه و ۵۰ مگابایت؛ عمودی (۹:۱۶) بهتر دیده می‌شود.";

/** One product video, next to the photos. Same look as ImageUploader's tiles. */
export function VideoUploader({ storeId, value, onChange }: { storeId: number; value: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const upload = async (file?: File) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("حجم ویدیو حداکثر ۵۰ مگابایت است."); return; }
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API_URL}/api/v1/stores/${storeId}/uploads/video`, { method: "POST", body: fd, headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((typeof data?.detail === "string" ? data.detail : data?.detail?.message) ?? "آپلود ویدیو ناموفق بود");
      onChange(data.url);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {value ? (
        <div className="relative aspect-square rounded-xl overflow-hidden bg-black group">
          <video src={mediaUrl(value)} className="size-full object-cover" muted playsInline preload="metadata" controls />
          <button type="button" onClick={() => onChange("")} aria-label="حذف ویدیو"
            className="absolute top-1 end-1 size-6 rounded-full bg-black/60 text-white grid place-items-center cursor-pointer">
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]); }}
          className={cn("aspect-square rounded-xl border-2 border-dashed border-edge grid place-items-center text-muted hover:text-primary hover:border-primary/50 transition cursor-pointer",
            drag && "border-primary bg-primary/8")}>
          {busy ? <Spinner className="size-5" /> : <span className="flex flex-col items-center gap-1 text-[12px]"><Film className="size-5" />افزودن ویدیو</span>}
        </button>
      )}
      <input ref={input} type="file" accept="video/mp4,video/quicktime,video/webm" hidden onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
}
