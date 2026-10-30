"use client";

import { Bot, Hand, Sparkles, UserRound, Globe } from "lucide-react";
import { LISTING_STATUS, OP_STATUS, PLATFORMS, SOURCES } from "@/lib/meta";
import { ago } from "@/lib/format";
import { Chip, cn } from "./primitives";

export function PlatformIcon({ platform, size = 28, className }: { platform: string; size?: number; className?: string }) {
  const p = PLATFORMS[platform];
  const letter = { telegram: "T", bale: "ب", digikala: "د", instagram: "IG" }[platform] ?? "?";
  return (
    <span
      className={cn("inline-grid place-items-center rounded-lg font-black text-white shrink-0", className)}
      style={{
        width: size, height: size, fontSize: size * 0.4,
        background: platform === "instagram" ? "linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)" : p?.color ?? "var(--neutral)",
      }}
      aria-label={p?.label}
      title={p?.label}
    >
      {letter}
    </span>
  );
}

export function SourceBadge({ source }: { source: string }) {
  const s = SOURCES[source] ?? SOURCES.manual;
  const icon = source === "ai" ? <Sparkles className="size-3" /> : source === "crawl" ? <Globe className="size-3" /> : <Hand className="size-3" />;
  return <Chip tone={s.tone} icon={icon}>{s.label}</Chip>;
}

export function StatusChip({ status, kind = "listing" }: { status: string; kind?: "listing" | "op" }) {
  const s = (kind === "op" ? OP_STATUS : LISTING_STATUS)[status] ?? { label: status, tone: "neutral" };
  return (
    <Chip tone={s.tone}>
      {(status === "running" || status === "publishing") && <span className="size-1.5 rounded-full bg-current animate-pulse" />}
      {s.label}
    </Chip>
  );
}

export function PublisherIcon({ by }: { by: string }) {
  if (!by) return null;
  return by === "user" ? (
    <span title="منتشرشده توسط کاربر" className="inline-flex text-muted"><UserRound className="size-3.5" aria-label="کاربر" /></span>
  ) : (
    <span title="منتشرشده توسط AI" className="inline-flex text-ai"><Sparkles className="size-3.5" aria-label="AI" /></span>
  );
}

const DOT: Record<string, string> = {
  published: "bg-success", queued: "bg-warning", publishing: "bg-primary animate-pulse",
  failed: "bg-danger", out_of_sync: "bg-warning", not_published: "bg-neutral/40", removed: "bg-neutral/40",
};

export function ChannelStatusStrip({ channels, listings }: { channels: any[]; listings: any[] }) {
  if (!channels.length) return <span className="text-muted text-[12px]">بدون کانال</span>;
  return (
    <div className="flex items-center gap-1.5">
      {channels.map((ch) => {
        const l = listings.find((x) => x.channel_id === ch.id);
        const status = l?.status ?? "not_published";
        const label = `${ch.display_name || PLATFORMS[ch.platform]?.label}: ${LISTING_STATUS[status]?.label}${
          l?.published_by ? ` توسط ${l.published_by === "user" ? "کاربر" : "AI"}` : ""}${l?.published_at ? `، ${ago(l.published_at)}` : ""}${
          l?.last_error_fa ? ` | ${l.last_error_fa}` : ""}`;
        return (
          <span key={ch.id} className="relative" title={label} aria-label={label}>
            <PlatformIcon platform={ch.platform} size={22} className={cn(status === "not_published" && "opacity-35 grayscale")} />
            <span className={cn("absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full ring-2 ring-[var(--glass-strong)]", DOT[status])} />
            {l?.published_by && l.published_by !== "user" && (
              <Bot className="absolute -top-1.5 -end-1.5 size-3 text-ai" aria-hidden />
            )}
          </span>
        );
      })}
    </div>
  );
}
