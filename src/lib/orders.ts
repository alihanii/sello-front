import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "./api";

/** Where an order came from: the AI assistant, a chat the seller handled, an invoice link, the store's website, or Digikala. */
export const ORDER_SOURCE: Record<string, { label: string; short: string; color: string; tone: string }> = {
  ai: { label: "دستیار AI", short: "AI", color: "var(--ai)", tone: "ai" },
  chat: { label: "سفارش چت", short: "چت", color: "var(--primary)", tone: "primary" },
  invoice: { label: "فاکتورساز", short: "فاکتور", color: "var(--accent)", tone: "warning" },
  site: { label: "وبسایت", short: "سایت", color: "var(--crawl)", tone: "crawl" },
  digikala: { label: "دیجی‌کالا", short: "دیجی‌کالا", color: "#EF394E", tone: "danger" },
};
export const SOURCES = ["ai", "chat", "invoice", "site", "digikala"] as const;

export const ORDER_PLATFORMS: { value: string; label: string }[] = [
  { value: "instagram", label: "دایرکت اینستاگرام" },
  { value: "telegram", label: "تلگرام" },
  { value: "whatsapp", label: "واتساپ" },
  { value: "bale", label: "بله" },
  { value: "rubika", label: "روبیکا" },
  { value: "eitaa", label: "ایتا" },
  { value: "divar", label: "دیوار" },
  { value: "phone", label: "تلفنی" },
  { value: "in_person", label: "حضوری" },
  { value: "site", label: "سایت" },
  { value: "link", label: "لینک چت" },
  { value: "other", label: "سایر" },
];
export const platformLabel = (v?: string) => ORDER_PLATFORMS.find((p) => p.value === v)?.label ?? "";

export const INVOICE_STATUS: Record<string, { label: string; tone: string }> = {
  awaiting_payment: { label: "منتظر پرداخت", tone: "neutral" },
  payment_submitted: { label: "فیش رسیده", tone: "warning" },
  confirmed: { label: "پرداخت‌شده", tone: "success" },
  rejected: { label: "فیش رد شد", tone: "danger" },
  cancelled: { label: "لغو شده", tone: "neutral" },
};

export const orderQueries = {
  settings: (sid: number) => queryOptions({ queryKey: ["invoice-settings", sid], queryFn: () => api(`/stores/${sid}/invoice-settings`) }),
  list: (sid: number, p: URLSearchParams) => queryOptions({ queryKey: ["orders", sid, p.toString()], queryFn: () => api(`/stores/${sid}/orders?${p}`) }),
  invoices: (sid: number, p: URLSearchParams) => queryOptions({ queryKey: ["invoices", sid, p.toString()], queryFn: () => api(`/stores/${sid}/invoices?${p}`) }),
  finance: (sid: number, start?: string, end?: string) => queryOptions({
    queryKey: ["finance", sid, start ?? "", end ?? ""],
    queryFn: () => api(`/stores/${sid}/finance${start ? `?start=${start}&end=${end}` : ""}`),
  }),
};

/** Everything an order change can move: the lists, the dashboard numbers and the calendar. */
export function useInvalidateOrders(sid: number) {
  const qc = useQueryClient();
  return () => {
    for (const k of ["orders", "invoices", "finance", "dashboard", "calendar", "ai-orders", "chat-overview"]) qc.invalidateQueries({ queryKey: [k, sid] });
  };
}

export function usePatchInvoice(sid: number) {
  const refresh = useInvalidateOrders(sid);
  return useMutation({
    mutationFn: ({ id, ...body }: any) => api(`/invoices/${id}`, { method: "PATCH", json: body }),
    onSuccess: () => { refresh(); toast.success("به‌روز شد"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export async function copyText(text: string, done = "کپی شد") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error("کپی نشد؛ دستی انتخاب و کپی کن.");
  }
}

export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
