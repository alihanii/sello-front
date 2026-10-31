"use client";

import { Bot, Coins, UserRound, Zap } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import { faNum, jDateTime, ms } from "@/lib/format";
import { MSG_SOURCE } from "@/lib/chat";
import { cn } from "@/components/ui/primitives";

/** One chat line. Customer on the start side; assistant and seller on the end side, like the messenger itself. */
export function Bubble({ m, showCost = true }: { m: any; showCost?: boolean }) {
  const mine = m.role !== "customer";
  const src = MSG_SOURCE[m.source];
  return (
    <div className={cn("flex flex-col max-w-[85%] sm:max-w-[75%]", mine ? "ms-auto items-end" : "items-start")}>
      <div className={cn("rounded-2xl p-3 text-[14px] leading-7 whitespace-pre-line break-words",
        m.role === "customer" && "bg-glass-strong rounded-ss-sm",
        m.role === "ai" && "bg-ai/12 rounded-se-sm",
        m.role === "seller" && "bg-primary/14 rounded-se-sm",
        m.role === "system" && "bg-subtle text-muted")}>
        {m.image_url && <a href={mediaUrl(m.image_url)} target="_blank" rel="noreferrer"><img src={mediaUrl(m.image_url)} alt="" className="rounded-xl max-h-60 mb-2" /></a>}
        {m.text}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted mt-1 px-1">
        {m.role === "ai" && <span className="inline-flex items-center gap-1"><Bot className="size-3" />{src?.label ?? "دستیار"}</span>}
        {m.role === "seller" && <span className="inline-flex items-center gap-1"><UserRound className="size-3" />ادمین</span>}
        {showCost && m.role === "ai" && (m.model ? (
          <span className="inline-flex items-center gap-1 tnum" title={`${m.model} · ورودی ${m.input_tokens} (کش ${m.cached_tokens}) · خروجی ${m.output_tokens}`}>
            <Coins className="size-3" />{faNum(m.input_tokens + m.output_tokens)} توکن{m.cached_tokens ? ` (${faNum(m.cached_tokens)} کش)` : ""} · {ms(m.latency_ms)}
          </span>
        ) : <span className="inline-flex items-center gap-1 text-success"><Zap className="size-3" />بدون هزینهٔ AI</span>)}
        <span className="tnum">{jDateTime(m.created_at)}</span>
      </div>
    </div>
  );
}
