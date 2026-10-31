"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Bot, Hand, MessagesSquare, Search, Send, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago, faNum, toman } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { CONV_STATUS, MODE_LABEL, ORDER_STATUS } from "@/lib/chat";
import { PlatformIcon } from "@/components/ui/status";
import { Button, Card, Chip, EmptyState, Input, Select, Skeleton, Textarea, cn } from "@/components/ui/primitives";
import { Bubble } from "./Bubbles";

function Thread({ id, onBack, go }: { id: number; onBack: () => void; go: (t: any, extra?: string) => void }) {
  const qc = useQueryClient();
  const sid = useStoreId();
  const { data } = useQuery({ queryKey: ["chat-conv", id], queryFn: () => api(`/chat/conversations/${id}`), refetchInterval: 8_000 });
  const [text, setText] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["chat-conv", id] }); qc.invalidateQueries({ queryKey: ["chat-convs", sid] }); qc.invalidateQueries({ queryKey: ["chat-overview", sid] }); };
  const send = useMutation({ mutationFn: () => api(`/chat/conversations/${id}/messages`, { method: "POST", json: { text } }), onSuccess: () => { setText(""); refresh(); }, onError: (e: any) => toast.error(e.message) });
  const resume = useMutation({ mutationFn: () => api(`/chat/conversations/${id}/resume`, { method: "POST" }), onSuccess: () => { refresh(); toast.success("گفتگو به دستیار برگشت"); } });
  const pause = useMutation({ mutationFn: () => api(`/chat/conversations/${id}/pause`, { method: "POST" }), onSuccess: refresh });
  // Scroll the message list itself, not the page, so the header stays in view on phones.
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [data?.messages?.length]);
  if (!data) return <Skeleton className="h-full min-h-96" />;
  const c = data.conversation;
  const st = CONV_STATUS[c.status];
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-3 h-full">
      <Card strong className="flex flex-col h-[calc(100dvh-15rem)] min-h-[420px] lg:h-[72dvh]">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-edge">
          <Button size="sm" variant="ghost" className="lg:hidden" aria-label="بازگشت" onClick={onBack}><ArrowRight className="size-4" /></Button>
          <PlatformIcon platform={c.platform} size={34} />
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">{c.customer_name || "مشتری"} {c.customer_username && <span className="text-muted font-normal text-[12px]" dir="ltr">@{c.customer_username}</span>}</div>
            <div className="text-[12px] text-muted">{MODE_LABEL[c.mode]}{c.bot_username ? <> · <span dir="ltr">@{c.bot_username}</span></> : null}</div>
          </div>
          <Chip tone={st?.tone}>{st?.label}</Chip>
        </div>
        <div ref={box} className="flex-1 overflow-y-auto p-4 space-y-3">
          {data.messages.map((m: any) => <Bubble key={m.id} m={m} />)}
        </div>
        <div className="p-3 border-t border-edge space-y-2">
          {c.status !== "ai" ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] rounded-xl bg-subtle px-3 py-2">
              <span className="flex items-center gap-1.5"><Hand className="size-4 text-primary" />{c.status === "needs_human" ? "دستیار این گفتگو را به تو سپرده." : "دستیار در این گفتگو ساکت است."} {c.ai_paused_until && <span className="text-muted">تا {ago(c.ai_paused_until)}</span>}</span>
              <Button size="sm" variant="secondary" icon={<Bot className="size-4" />} loading={resume.isPending} onClick={() => resume.mutate()}>برگرداندن به دستیار</Button>
            </div>
          ) : (
            <div className="flex justify-end"><Button size="sm" variant="ghost" icon={<Hand className="size-4" />} loading={pause.isPending} onClick={() => pause.mutate()}>تحویل گرفتن گفتگو</Button></div>
          )}
          <form className="flex gap-2 items-end" onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate(); }}>
            <Textarea className="!min-h-11 max-h-40" rows={1} placeholder="پیام تو به مشتری (دستیار برای مدتی ساکت می‌شود)…" value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (text.trim()) send.mutate(); } }} />
            <Button type="submit" aria-label="ارسال" loading={send.isPending} disabled={!text.trim()}><Send className="size-4" /></Button>
          </form>
        </div>
      </Card>
      <div className="space-y-3">
        <Card className="p-4">
          <div className="font-bold text-[14px] mb-2 flex items-center gap-2"><ShoppingBag className="size-4" />سفارش‌های این گفتگو</div>
          {data.orders.length === 0 ? <p className="text-[13px] text-muted">سفارشی از این گفتگو ثبت نشده.</p> : data.orders.map((o: any) => (
            <button key={o.id} onClick={() => go("orders", `&o=${o.id}`)} className="w-full text-start rounded-xl bg-subtle hover:bg-glass-strong p-3 mb-2 cursor-pointer">
              <div className="flex justify-between text-[13px] font-bold"><span className="tnum">#{faNum(o.id)}</span><Chip tone={ORDER_STATUS[o.status]?.tone}>{ORDER_STATUS[o.status]?.label}</Chip></div>
              <div className="text-[12px] text-muted mt-1 truncate">{o.items.map((i: any) => i.title).join("، ")}</div>
              <div className="text-[13px] font-bold tnum mt-1">{toman(o.total_toman)}</div>
            </button>
          ))}
        </Card>
        {data.state?.order && (
          <Card className="p-4 text-[13px]">
            <div className="font-bold mb-1">سفارش در حال تکمیل</div>
            <div className="text-muted">{(data.state.order.items ?? []).length} قلم · {data.state.order.name || "بدون نام"}</div>
          </Card>
        )}
        <Card className="p-4 text-[12px] text-muted space-y-1 tnum">
          <div>پیام‌ها: {faNum(c.message_count)} · پاسخ دستیار: {faNum(c.ai_message_count)}</div>
          <div>فراخوانی AI: {faNum(c.llm_calls)} · توکن: {faNum(c.tokens_in + c.tokens_out)}</div>
          <div>هزینه: {toman(c.cost_toman)}</div>
          <div>شروع: {ago(c.created_at)}</div>
        </Card>
      </div>
    </div>
  );
}

export function Conversations({ initial, go }: { initial?: number; go: (t: any, extra?: string) => void }) {
  const sid = useStoreId();
  const [sel, setSel] = useState<number | undefined>(initial);
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");
  const [hasOrder, setHasOrder] = useState(false);
  const [q, setQ] = useState("");
  const params = new URLSearchParams({ platform, status, q, ...(hasOrder ? { has_order: "true" } : {}) });
  const { data } = useQuery({ queryKey: ["chat-convs", sid, params.toString()], queryFn: () => api(`/stores/${sid}/chat/conversations?${params}`), refetchInterval: 10_000, placeholderData: keepPreviousData });
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-3">
      <Card className={cn("flex flex-col lg:h-[72dvh]", sel && "hidden lg:flex")}>
        <div className="p-3 space-y-2 border-b border-edge">
          <div className="relative"><Search className="size-4 absolute top-3.5 start-3 text-muted" /><Input className="ps-9" placeholder="جستجوی نام یا پیام" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={platform} onChange={(e) => setPlatform(e.target.value)}><option value="">همهٔ پیام‌رسان‌ها</option><option value="telegram">تلگرام</option><option value="bale">بله</option></Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">همهٔ وضعیت‌ها</option>{Object.entries(CONV_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select>
          </div>
          <label className="flex items-center gap-2 text-[13px] cursor-pointer"><input type="checkbox" checked={hasOrder} onChange={(e) => setHasOrder(e.target.checked)} className="accent-[var(--primary)]" />فقط گفتگوهای دارای سفارش</label>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5">
          {!data ? <Skeleton className="h-40 m-2" /> : data.items.length === 0 ? (
            <EmptyState icon={<MessagesSquare className="size-7" />} title="گفتگویی نیست" text="وقتی مشتری‌ها به ربات پیام بدهند اینجا می‌آیند." />
          ) : data.items.map((c: any) => (
            <button key={c.id} onClick={() => setSel(c.id)} className={cn("w-full text-start flex gap-3 p-2.5 rounded-2xl cursor-pointer transition", sel === c.id ? "bg-primary-soft" : "hover:bg-subtle")}>
              <PlatformIcon platform={c.platform} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-[14px]", c.seller_unread ? "font-black" : "font-bold")}>{c.customer_name || "مشتری"}</span>
                  <span className="text-[11px] text-muted shrink-0">{ago(c.last_message_at)}</span>
                </div>
                <div className="text-[12px] text-muted truncate">{c.last_message_text}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {c.status !== "ai" && <Chip tone={CONV_STATUS[c.status]?.tone} className="!text-[10px]">{CONV_STATUS[c.status]?.label}</Chip>}
                  {c.orders > 0 && <Chip tone="success" className="!text-[10px]" icon={<ShoppingBag className="size-3" />}>{faNum(c.orders)} سفارش</Chip>}
                  {c.mode === "business" && <Chip className="!text-[10px]">پیوی</Chip>}
                </div>
              </div>
            </button>
          ))}
        </div>
        {data && <div className="px-4 py-2 text-[12px] text-muted border-t border-edge tnum">{faNum(data.total)} گفتگو</div>}
      </Card>
      <div className={cn(!sel && "hidden lg:block")}>
        {sel ? <Thread key={sel} id={sel} onBack={() => setSel(undefined)} go={go} /> : (
          <Card className="h-full min-h-96 grid place-items-center"><EmptyState icon={<MessagesSquare className="size-7" />} title="یک گفتگو را انتخاب کن" text="پیام‌ها، منبع هر پاسخ (AI یا بدون هزینه)، توکن مصرفی و سفارش‌های همان گفتگو را می‌بینی." /></Card>
        )}
      </div>
    </div>
  );
}
