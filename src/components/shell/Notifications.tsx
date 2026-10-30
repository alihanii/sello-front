"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, CheckCheck, PlugZap, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, mediaUrl } from "@/lib/api";
import { ago, faNum } from "@/lib/format";
import { Button, cn } from "@/components/ui/primitives";

const ICON: Record<string, any> = { approval: Sparkles, publish_failed: AlertTriangle, channel_error: PlugZap };
const TONE: Record<string, string> = { approval: "text-primary bg-primary/12", publish_failed: "text-danger bg-danger/12", channel_error: "text-warning bg-warning/14" };

export function NotificationBell({ storeId }: { storeId: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const { data } = useQuery({
    queryKey: ["notifications", storeId],
    queryFn: () => api<any>(`/notifications?store_id=${storeId}`),
    refetchInterval: 20_000,
  });
  const read = useMutation({
    mutationFn: () => api("/notifications/read", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", storeId] }),
  });
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  const unread = data?.unread ?? 0;

  return (
    <div className="relative" ref={box}>
      <Button variant="ghost" size="sm" aria-label={`اعلان‌ها${unread ? ` (${unread} خوانده‌نشده)` : ""}`} aria-expanded={open}
        onClick={() => setOpen(!open)} className="relative">
        <Bell className="size-[18px]" />
        {unread > 0 && <span className="absolute top-1 end-1 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold grid place-items-center tnum">{faNum(Math.min(unread, 99))}</span>}
      </Button>
      <div className={cn("glass-strong absolute z-40 top-12 -end-2 w-[min(380px,calc(100vw-24px))] rounded-[22px] p-2 origin-top-left transition-all duration-200",
        open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1 pointer-events-none")} role="dialog" aria-label="اعلان‌ها">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="font-bold text-[14px]">اعلان‌ها</span>
          {unread > 0 && <Button size="sm" variant="ghost" icon={<CheckCheck className="size-4" />} onClick={() => read.mutate()}>همه خوانده شد</Button>}
        </div>
        <div className="max-h-[60dvh] overflow-y-auto no-scrollbar">
          {!data?.items?.length ? <p className="text-[13px] text-muted px-3 py-8 text-center">اعلانی نداری.</p> : data.items.map((n: any) => {
            const Icon = ICON[n.kind] ?? Bell;
            return (
              <Link key={n.id} href={n.link || "#"} onClick={() => { setOpen(false); if (!n.is_read) api("/notifications/read?ids=" + n.id, { method: "POST" }).then(() => qc.invalidateQueries({ queryKey: ["notifications", storeId] })); }}
                className={cn("flex gap-3 p-2.5 rounded-2xl transition-colors hover:bg-subtle", !n.is_read && "bg-primary/6")}>
                {n.image_url ? <img src={mediaUrl(n.image_url)} alt="" className="size-11 rounded-xl object-cover shrink-0" />
                  : <span className={cn("size-11 rounded-xl grid place-items-center shrink-0", TONE[n.kind] ?? "bg-subtle text-muted")}><Icon className="size-5" /></span>}
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5 text-[13px] font-bold">{!n.is_read && <span className="size-2 rounded-full bg-primary shrink-0" />}<span className="truncate">{n.title_fa}</span></span>
                  {n.body_fa && <span className="block text-[12px] text-muted line-clamp-2 leading-5 mt-0.5">{n.body_fa}</span>}
                  <span className="block text-[11px] text-muted mt-1">{ago(n.created_at)}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
