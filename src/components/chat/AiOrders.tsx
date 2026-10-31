"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MapPin, MessagesSquare, Phone, Receipt, ShoppingBag, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, mediaUrl } from "@/lib/api";
import { faDigits, faNum, jDateTime, toman } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { ORDER_STATUS } from "@/lib/chat";
import { PlatformIcon } from "@/components/ui/status";
import { Button, Card, Chip, Dialog, EmptyState, Skeleton, Switch, Tabs, Textarea, cn } from "@/components/ui/primitives";

function OrderCard({ o, highlight, go }: { o: any; highlight: boolean; go: (t: any, extra?: string) => void }) {
  const sid = useStoreId();
  const qc = useQueryClient();
  const [note, setNote] = useState(o.seller_note);
  const [zoom, setZoom] = useState(false);
  const patch = useMutation({
    mutationFn: (body: any) => api(`/ai-orders/${o.id}`, { method: "PATCH", json: body }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ai-orders", sid] }); qc.invalidateQueries({ queryKey: ["chat-overview", sid] }); toast.success("سفارش به‌روز شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  const st = ORDER_STATUS[o.status];
  return (
    <Card id={`order-${o.id}`} className={cn("p-5 flex flex-col", highlight && "ring-2 ring-primary")}>
      <div className="flex items-center gap-3">
        <PlatformIcon platform={o.platform === "test" ? "telegram" : o.platform} size={34} />
        <div className="flex-1 min-w-0">
          <div className="font-bold flex items-center gap-2"><span className="tnum">سفارش #{faNum(o.id)}</span>{o.is_test && <Chip>تست</Chip>}</div>
          <div className="text-[12px] text-muted">{jDateTime(o.created_at)}</div>
        </div>
        <Chip tone={st?.tone}>{st?.label}</Chip>
      </div>
      <ul className="mt-4 space-y-1.5 text-[14px]">
        {o.items.map((it: any, i: number) => (
          <li key={i} className="flex justify-between gap-3">
            <span className="min-w-0">{it.title}{it.variant && <span className="text-muted"> ({it.variant})</span>} <span className="text-muted tnum">× {faNum(it.qty)}</span></span>
            <span className="tnum shrink-0">{it.unit_price ? toman(it.unit_price * it.qty) : "قیمت با فروشنده"}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between font-black text-[15px] border-t border-edge mt-3 pt-3"><span>جمع</span><span className="tnum">{toman(o.total_toman)}</span></div>
      <div className="mt-3 space-y-1 text-[13px]">
        <div className="font-bold">{o.customer_name || "مشتری"} {o.customer_username && <span className="text-muted font-normal" dir="ltr">@{o.customer_username}</span>}</div>
        {o.customer_phone && <div className="flex items-center gap-1.5 text-muted tnum"><Phone className="size-3.5" /><a href={`tel:${o.customer_phone}`} dir="ltr">{faDigits(o.customer_phone)}</a></div>}
        {o.customer_address && <div className="flex items-start gap-1.5 text-muted"><MapPin className="size-3.5 mt-1 shrink-0" />{o.customer_address}</div>}
        {o.note && <div className="text-muted">یادداشت مشتری: {o.note}</div>}
        {Object.entries(o.extras || {}).map(([k, v]: [string, any]) => (
          String(v).startsWith("/media/") || String(v).startsWith("http")
            ? <div key={k} className="flex items-center gap-2"><span className="text-muted">{k}:</span>
                <a href={mediaUrl(String(v))} target="_blank" rel="noreferrer"><img src={mediaUrl(String(v))} alt={k} className="size-16 rounded-xl object-cover" /></a></div>
            : <div key={k}><span className="text-muted">{k}:</span> {String(v)}</div>
        ))}
      </div>
      {(o.receipt_url || o.payment_ref || o.receipt_text) && (
        <div className="mt-3 rounded-2xl bg-subtle p-3 flex gap-3">
          {o.receipt_url ? <button onClick={() => setZoom(true)} className="cursor-zoom-in shrink-0"><img src={mediaUrl(o.receipt_url)} alt="فیش پرداخت" className="size-20 rounded-xl object-cover" /></button>
            : <Receipt className="size-6 text-muted shrink-0" />}
          <div className="text-[13px] min-w-0">
            <div className="font-bold">اطلاعات پرداخت مشتری</div>
            {o.payment_ref && <div className="tnum">کد پیگیری: <b dir="ltr">{faDigits(o.payment_ref)}</b></div>}
            {o.receipt_text && <div className="text-muted break-words">{o.receipt_text}</div>}
          </div>
        </div>
      )}
      <Textarea className="mt-3 !min-h-11" rows={1} placeholder="یادداشت تو (فقط برای خودت)" value={note} onChange={(e) => setNote(e.target.value)}
        onBlur={() => note !== o.seller_note && patch.mutate({ seller_note: note })} />
      <div className="flex flex-wrap gap-2 mt-auto pt-4">
        {o.status !== "confirmed" && <Button size="sm" icon={<Check className="size-4" />} loading={patch.isPending && patch.variables?.status === "confirmed"}
          onClick={() => confirm("پرداخت تأیید شود؟ موجودی محصولات کم می‌شود و به مشتری خبر داده می‌شود.") && patch.mutate({ status: "confirmed" })}>تأیید پرداخت</Button>}
        {["awaiting_payment", "payment_submitted"].includes(o.status) && <Button size="sm" variant="danger" icon={<X className="size-4" />}
          onClick={() => confirm("سفارش رد شود؟ به مشتری خبر داده می‌شود.") && patch.mutate({ status: "rejected" })}>رد</Button>}
        {!o.is_test && <Button size="sm" variant="ghost" icon={<MessagesSquare className="size-4" />} onClick={() => go("conversations", `&c=${o.conversation_id}`)}>گفتگو</Button>}
      </div>
      {zoom && <Dialog open wide onClose={() => setZoom(false)} title={`فیش سفارش #${faNum(o.id)}`}><img src={mediaUrl(o.receipt_url)} alt="فیش پرداخت" className="w-full rounded-2xl" /></Dialog>}
    </Card>
  );
}

export function AiOrders({ go }: { go: (t: any, extra?: string) => void }) {
  const sid = useStoreId();
  const sp = useSearchParams();
  const focus = Number(sp.get("o")) || 0;
  const [status, setStatus] = useState("");
  const [tests, setTests] = useState(false);
  const { data } = useQuery({
    queryKey: ["ai-orders", sid, status, tests],
    queryFn: () => api(`/stores/${sid}/ai-orders?status=${status}&include_test=${tests}`),
    refetchInterval: 15_000, placeholderData: keepPreviousData,
  });
  useEffect(() => { if (focus && data) document.getElementById(`order-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [focus, data]);
  const n = (k: string) => (data?.counts?.[k] ? ` (${faNum(data.counts[k])})` : "");
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <Tabs value={status} onChange={setStatus} items={[
          { value: "", label: "همه" },
          { value: "payment_submitted", label: `منتظر تأیید${n("payment_submitted")}` },
          { value: "awaiting_payment", label: `منتظر پرداخت${n("awaiting_payment")}` },
          { value: "confirmed", label: "تأییدشده" },
          { value: "rejected", label: "ردشده" },
        ]} />
        <label className="flex items-center gap-2 text-[13px]"><Switch checked={tests} onChange={setTests} label="نمایش تست‌ها" />نمایش سفارش‌های تست</label>
      </div>
      {!data ? <Skeleton className="h-60" /> : data.items.length === 0 ? (
        <Card><EmptyState icon={<ShoppingBag className="size-7" />} title="سفارشی نیست" text="سفارش‌هایی که دستیار در چت می‌گیرد با فیش یا کد پیگیری اینجا ذخیره می‌شود." /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{data.items.map((o: any) => <OrderCard key={o.id} o={o} highlight={o.id === focus} go={go} />)}</div>
      )}
    </>
  );
}
