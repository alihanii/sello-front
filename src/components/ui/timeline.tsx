"use client";

import { CheckCircle2, ChevronDown, CircleDashed, Copy, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ms } from "@/lib/format";
import { cn } from "./primitives";

function JsonViewer({ value }: { value: unknown }) {
  const text = JSON.stringify(value ?? {}, null, 2);
  const html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?/g, (m, str, colon, kw) => {
      if (str) return colon ? `<span class="text-primary">${str}</span>${colon}` : `<span class="text-success">${str}</span>`;
      if (kw) return `<span class="text-ai">${m}</span>`;
      return `<span class="text-warning">${m}</span>`;
    });
  return (
    <div className="relative group" dir="ltr">
      <button
        onClick={() => { navigator.clipboard.writeText(text); toast.success("کپی شد"); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg bg-glass-strong cursor-pointer"
        aria-label="کپی"
      >
        <Copy className="size-3.5" />
      </button>
      <pre className="text-[12px] leading-5 font-mono bg-subtle rounded-xl p-3 overflow-auto max-h-80 text-left" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

const ICON = {
  succeeded: <CheckCircle2 className="size-5 text-success" />,
  failed: <XCircle className="size-5 text-danger" />,
  running: <CircleDashed className="size-5 text-primary animate-spin" />,
  skipped: <CircleDashed className="size-5 text-muted" />,
};

export function StepTimeline({ steps }: { steps: any[] }) {
  const [open, setOpen] = useState<number | null>(steps.find((s) => s.status === "failed")?.id ?? null);
  if (!steps.length) return <p className="text-muted text-[14px]">هنوز مرحله‌ای اجرا نشده.</p>;
  return (
    <ol className="relative">
      {steps.map((s, i) => (
        <li key={s.id} className="relative ps-10 pb-4">
          {i < steps.length - 1 && (
            <span className={cn("absolute start-[9px] top-6 bottom-0 w-0.5 rounded", s.status === "succeeded" ? "bg-success/40" : "bg-subtle")} />
          )}
          <span className="absolute start-0 top-0.5">{ICON[s.status as keyof typeof ICON] ?? ICON.skipped}</span>
          <button
            className="w-full text-start flex items-center justify-between gap-3 cursor-pointer group"
            onClick={() => setOpen(open === s.id ? null : s.id)}
            aria-expanded={open === s.id}
          >
            <div>
              <div className="font-semibold text-[14px]">{s.label_fa || s.name}</div>
              {s.message_fa && <div className={cn("text-[13px]", s.status === "failed" ? "text-danger" : "text-muted")}>{s.message_fa}</div>}
            </div>
            <div className="flex items-center gap-2 text-muted text-[12px] shrink-0">
              <span className="tnum">{ms(s.duration_ms)}</span>
              <ChevronDown className={cn("size-4 transition", open === s.id && "rotate-180")} />
            </div>
          </button>
          {open === s.id && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <div className="text-[12px] font-bold text-muted mb-1">درخواست (Request)</div>
                <JsonViewer value={s.request} />
              </div>
              <div>
                <div className="text-[12px] font-bold text-muted mb-1">پاسخ (Response)</div>
                <JsonViewer value={s.response} />
              </div>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
