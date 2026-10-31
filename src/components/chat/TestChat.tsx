"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, RotateCcw, Send, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { faNum, toman } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { Button, Card, CardHeader, Input, Skeleton } from "@/components/ui/primitives";
import { Bubble } from "./Bubbles";

const SAMPLES = ["سلام", "چه محصولاتی دارید؟", "هزینه ارسال چقدره؟", "یکی می‌خوام، سفارش ثبت کن", "یه شعر برام بگو", "می‌خوام با ادمین صحبت کنم"];

export function TestChat() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const key = ["chat-test", sid];
  const { data } = useQuery({ queryKey: key, queryFn: () => api(`/stores/${sid}/chat/test`) });
  const [text, setText] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const send = useMutation({
    mutationFn: (body: any) => api(`/stores/${sid}/chat/test`, { method: "POST", json: body }),
    onMutate: (body) => {
      if (body.reset) return;
      qc.setQueryData(key, (old: any) => ({ ...old, messages: [...(old?.messages ?? []), { id: `tmp`, role: "customer", text: body.text, created_at: new Date().toISOString() }] }));
    },
    onSuccess: (res, body) => {
      qc.setQueryData(key, (old: any) => body.reset ? res : { ...res, messages: [...(old?.messages ?? []).filter((m: any) => m.id !== "tmp"), ...res.messages] });
      qc.invalidateQueries({ queryKey: ["chat-overview", sid] });
    },
    onError: (e: any) => { toast.error(e.message); qc.invalidateQueries({ queryKey: key }); },
  });
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [data?.messages?.length, send.isPending]);
  const submit = (t: string) => { if (!t.trim() || send.isPending) return; send.mutate({ text: t.trim() }); setText(""); };
  const msgs: any[] = data?.messages ?? [];
  const ai = msgs.filter((m) => m.role === "ai");
  const paid = ai.filter((m) => m.model);
  const tokens = paid.reduce((s, m) => s + m.input_tokens + m.output_tokens, 0);
  const cost = paid.reduce((s, m) => s + m.cost_toman, 0);
  const order = data?.state?.order;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <Card strong className="flex flex-col h-[70dvh] min-h-[480px]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-edge">
          <div><div className="font-bold">شبیه‌ساز مشتری</div><div className="text-[12px] text-muted">همان دستیار و تنظیمات واقعی؛ حتی وقتی دستیار خاموش است. در آمار فروشگاه حساب نمی‌شود.</div></div>
          <Button size="sm" variant="ghost" icon={<RotateCcw className="size-4" />} loading={send.isPending && send.variables?.reset} onClick={() => send.mutate({ reset: true })}>شروع دوباره</Button>
        </div>
        <div ref={box} className="flex-1 overflow-y-auto p-4 space-y-3">
          {!data ? <Skeleton className="h-20" /> : msgs.length === 0 && (
            <div className="text-center text-muted text-[14px] py-10">مثل یک مشتری پیام بده و ببین دستیار چه جوابی می‌دهد و چقدر هزینه دارد.</div>
          )}
          {msgs.map((m, i) => <Bubble key={m.id ?? i} m={m} />)}
          {send.isPending && !send.variables?.reset && <div className="ms-auto w-16 h-9 rounded-2xl bg-ai/12 grid place-items-center"><span className="flex gap-1">{[0, 1, 2].map((i) => <i key={i} className="size-1.5 rounded-full bg-ai animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />)}</span></div>}
        </div>
        <div className="p-3 border-t border-edge">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2">
            {SAMPLES.map((s) => <button key={s} onClick={() => submit(s)} className="shrink-0 text-[12px] rounded-full bg-subtle hover:bg-glass-strong px-3 py-1.5 cursor-pointer">{s}</button>)}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); submit(text); }}>
            <Input placeholder="پیام مشتری…" value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} autoFocus />
            <Button type="submit" aria-label="ارسال" disabled={!text.trim()} loading={send.isPending && !send.variables?.reset}><Send className="size-4" /></Button>
          </form>
        </div>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader title="هزینهٔ این گفتگو" />
          <div className="px-5 pb-5 grid grid-cols-2 gap-2 text-[13px]">
            <div className="rounded-xl bg-subtle p-3"><div className="text-muted">پاسخ‌ها</div><div className="font-black text-[18px] tnum">{faNum(ai.length)}</div></div>
            <div className="rounded-xl bg-subtle p-3"><div className="text-muted flex items-center gap-1"><Zap className="size-3" />بدون AI</div><div className="font-black text-[18px] tnum text-success">{faNum(ai.length - paid.length)}</div></div>
            <div className="rounded-xl bg-subtle p-3"><div className="text-muted flex items-center gap-1"><Coins className="size-3" />توکن</div><div className="font-black text-[18px] tnum">{faNum(tokens)}</div></div>
            <div className="rounded-xl bg-subtle p-3"><div className="text-muted">هزینه</div><div className="font-black text-[15px] tnum">{toman(cost)}</div></div>
          </div>
        </Card>
        {order && (
          <Card>
            <CardHeader title="سبد سفارش در حال تکمیل" />
            <pre dir="ltr" className="px-5 pb-5 text-[12px] whitespace-pre-wrap text-muted">{JSON.stringify(order, null, 2)}</pre>
          </Card>
        )}
        <Card className="p-5 text-[13px] text-muted leading-7">
          سفارش‌هایی که در تست ثبت شوند در «سفارش‌های AI» با برچسب «تست» دیده می‌شوند (گزینهٔ «نمایش تست‌ها»).
        </Card>
      </div>
    </div>
  );
}
