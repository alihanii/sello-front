import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "./api";

export const BOT_STATUS: Record<string, { label: string; tone: string }> = {
  connected: { label: "وصل", tone: "success" },
  waiting_business: { label: "در انتظار اتصال پیوی", tone: "warning" },
  error: { label: "خطا", tone: "danger" },
  disconnected: { label: "قطع", tone: "neutral" },
};

export const MODE_LABEL: Record<string, string> = { bot: "بات مستقل", business: "اتصال به پیوی", test: "تست" };

export const CONV_STATUS: Record<string, { label: string; tone: string }> = {
  ai: { label: "پاسخ با AI", tone: "ai" },
  needs_human: { label: "منتظر ادمین", tone: "warning" },
  human: { label: "دست ادمین", tone: "primary" },
};

export const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  awaiting_payment: { label: "منتظر پرداخت", tone: "neutral" },
  payment_submitted: { label: "فیش رسیده؛ منتظر تأیید", tone: "warning" },
  confirmed: { label: "تأیید شده", tone: "success" },
  rejected: { label: "رد شده", tone: "danger" },
  cancelled: { label: "لغو شده", tone: "neutral" },
};

/** How an assistant reply was made. Everything except "llm" and "off_topic" cost no tokens. */
export const MSG_SOURCE: Record<string, { label: string; free: boolean }> = {
  llm: { label: "AI", free: false },
  off_topic: { label: "خارج از موضوع", free: false },
  faq: { label: "سؤال متداول", free: true },
  welcome: { label: "خوشامد", free: true },
  away: { label: "خارج از ساعت کاری", free: true },
  canned: { label: "پاسخ آماده", free: true },
  receipt: { label: "دریافت فیش", free: true },
  order: { label: "ثبت سفارش", free: true },
  handoff: { label: "ارجاع به ادمین", free: true },
  limit: { label: "سقف مصرف", free: true },
};

export const TONES = [
  { value: "formal", label: "رسمی", sample: "سلام، وقت‌تون بخیر. بفرمایید، در خدمتم." },
  { value: "friendly", label: "دوستانه", sample: "سلام 🌸 خوش اومدید! چه کمکی از دستم برمیاد؟" },
  { value: "casual", label: "خودمونی", sample: "سلااام 😍 جونم؟ هر سؤالی داری بپرس!" },
];

export const WEEK = [
  ["sat", "شنبه"], ["sun", "یکشنبه"], ["mon", "دوشنبه"], ["tue", "سه‌شنبه"], ["wed", "چهارشنبه"], ["thu", "پنجشنبه"], ["fri", "جمعه"],
] as const;

export function useAgent(sid: number) {
  return useQuery({ queryKey: ["chat-agent", sid], queryFn: () => api(`/stores/${sid}/chat/agent`), enabled: !!sid });
}

export function useSaveAgent(sid: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api(`/stores/${sid}/chat/agent`, { method: "PUT", json: body }),
    onSuccess: (data) => {
      qc.setQueryData(["chat-agent", sid], data);
      qc.invalidateQueries({ queryKey: ["chat-overview", sid] });
      toast.success("ذخیره شد");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
