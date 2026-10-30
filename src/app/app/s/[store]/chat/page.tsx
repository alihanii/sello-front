"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, Bot, Clock, Hand, MessageCircle, Send, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";
import { Button, Card, Chip, Input, PageHeader } from "@/components/ui/primitives";

const SAMPLE = [
  { name: "مریم", last: "سلام، سایز ۴۰ این مانتو موجوده؟", time: "۱۰:۴۲" },
  { name: "علی", last: "هزینهٔ ارسال به شیراز چقدره؟", time: "۰۹:۱۵" },
  { name: "سارا", last: "سفارش ثبت شد، ممنون 🙏", time: "دیروز" },
];

export default function Chat() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["interest", "ai_chat"], queryFn: () => api("/feature-interest/ai_chat") });
  const notify = useMutation({ mutationFn: () => api("/feature-interest", { method: "POST", json: { feature: "ai_chat" } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["interest"] }) });
  return (
    <>
      <PageHeader title="چت" subtitle="دستیار AI که جای ادمین با مشتری‌ها چت می‌کند" />
      <Card strong className="p-6 md:p-8 mb-5 text-center">
        <Chip tone="ai" className="mb-3">به‌زودی</Chip>
        <h2 className="text-[22px] font-black">کانال‌هایت را وصل کن؛ AI جواب مشتری‌ها را می‌دهد و سفارش می‌گیرد</h2>
        <p className="text-muted mt-2 max-w-2xl mx-auto">دستیار Sello بر اساس محصولات، قیمت و موجودی همین فروشگاه به پیام‌های دایرکت و کانال‌ها جواب می‌دهد، محصول پیشنهاد می‌کند و سفارش ثبت می‌کند. هر وقت بخواهی گفتگو را تحویل می‌گیری.</p>
        <Button className="mt-5" variant={data?.registered ? "secondary" : "ai"} icon={data?.registered ? <BellRing className="size-4" /> : <Bell className="size-4" />}
          disabled={data?.registered} loading={notify.isPending} onClick={() => notify.mutate()}>
          {data?.registered ? "ثبت شد؛ وقتی آماده شد خبرت می‌کنیم" : "خبرم کن"}
        </Button>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {[[Clock, "پاسخ ۲۴ ساعته", "حتی ساعت ۳ صبح هم مشتری بی‌جواب نمی‌ماند."], [ShoppingBag, "ثبت سفارش در چت", "اطلاعات، آدرس و تعداد را می‌گیرد و سفارش ثبت می‌کند."], [Hand, "تحویل به فروشنده", "هر لحظه گفتگو را از AI تحویل بگیر."]].map(([I, t, d]: any) => (
          <Card key={t} className="p-5"><I className="size-5 text-ai mb-3" /><div className="font-bold">{t}</div><div className="text-muted text-[14px]">{d}</div></Card>
        ))}
      </div>
      <Card className="p-3 opacity-60 pointer-events-none select-none" aria-hidden>
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr_220px] gap-3 min-h-[380px]">
          <div className="space-y-1">{SAMPLE.map((s) => (
            <div key={s.name} className="p-3 rounded-xl bg-subtle"><div className="flex justify-between text-[13px] font-bold">{s.name}<span className="text-muted font-normal">{s.time}</span></div><div className="text-[12px] text-muted truncate">{s.last}</div></div>
          ))}</div>
          <div className="rounded-xl bg-subtle p-4 flex flex-col">
            <div className="space-y-3 flex-1">
              <div className="max-w-[75%] rounded-2xl rounded-ss-sm bg-glass-strong p-3 text-[14px]">سلام، سایز ۴۰ این مانتو موجوده؟</div>
              <div className="max-w-[75%] ms-auto rounded-2xl rounded-se-sm bg-ai/15 p-3 text-[14px] flex gap-2"><Bot className="size-4 text-ai shrink-0 mt-1" />سلام مریم جان! بله، سایز ۴۰ در رنگ کرم و مشکی موجوده. قیمت ۱٬۲۵۰٬۰۰۰ تومانه. ثبت سفارش کنم؟</div>
            </div>
            <div className="flex gap-2 mt-3"><Input placeholder="پیام…" /><Button aria-label="ارسال"><Send className="size-4" /></Button></div>
          </div>
          <div className="rounded-xl bg-subtle p-4 text-[13px] space-y-2"><MessageCircle className="size-5 text-muted" /><div className="font-bold">سفارش مشتری</div><div className="text-muted">مانتو لینن · سایز ۴۰ · کرم</div></div>
        </div>
      </Card>
    </>
  );
}
