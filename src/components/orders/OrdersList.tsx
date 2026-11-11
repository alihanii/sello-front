"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { Bot, Check, FileText, Globe, MapPin, MessagesSquare, Phone, Plus, Receipt, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, mediaUrl } from "@/lib/api";
import { faDigits, faNum, jDate, jDateTime, toman } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { ORDER_STATUS } from "@/lib/chat";
import { ORDER_SOURCE, SOURCES, orderQueries, platformLabel, useInvalidateOrders } from "@/lib/orders";
import { PlatformIcon } from "@/components/ui/status";
import { Button, Card, Chip, Dialog, EmptyState, Input, Textarea, Tabs, cn } from "@/components/ui/primitives";
import { ListRowsSkeleton } from "@/components/ui/skeletons";

function SourceChip({ kind }: { kind: string }) {
  const s = ORDER_SOURCE[kind];
  const Icon = kind === "ai" ? Bot : kind === "chat" ? MessagesSquare : kind === "site" ? Globe : FileText;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap bg-subtle">
      <i className="inline-block size-2 rounded-full" style={{ background: s?.color }} aria-hidden />
      <Icon className="size-3 text-muted" aria-hidden />{s?.label}
    </span>
  );
}

function OrderCard({ o, highlight }: { o: any; highlight: boolean }) {
  const sid = useStoreId();
  const refresh = useInvalidateOrders(sid);
  const [note, setNote] = useState(o.seller_note);
  const [zoom, setZoom] = useState(false);
  const isAi = o.kind === "ai";
  const patch = useMutation({
    mutationFn: (body: any) => api(isAi ? `/ai-orders/${o.id}` : `/invoices/${o.id}`, { method: "PATCH", json: body }),
    onSuccess: () => { refresh(); toast.success("سفارش به‌روز شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  const st = ORDER_STATUS[o.status];
  const title = isAi ? `سفارش #${faNum(o.id)}` : o.kind === "invoice" ? `فاکتور ${faDigits(o.number)}` : o.kind === "site" ? `سفارش سایت ${faDigits(o.number)}` : `سفارش چت ${faDigits(o.number)}`;
  return (
    <Card id={`order-${o.key}`} className={cn("p-5 flex flex-col", highlight && "ring-2 ring-primary")}>
      <div className="flex items-center gap-3">
        {o.platform && ["telegram", "bale", "instagram"].includes(o.platform)
          ? <PlatformIcon platform={o.platform} size={34} />
          : <span className="size-[34px] rounded-xl bg-subtle grid place-items-center shrink-0">{o.kind === "invoice" ? <FileText className="size-4 text-muted" /> : o.kind === "site" ? <Globe className="size-4 text-muted" /> : <ShoppingBag className="size-4 text-muted" />}</span>}
        <div className="flex-1 min-w-0">
          <div className="font-bold flex items-center gap-2 flex-wrap"><span className="tnum">{title}</span>
            {o.tracking_code && <span className="text-muted text-[12px] font-normal" dir="ltr">{o.tracking_code}</span>}</div>
          <div className="text-[12px] text-muted">{jDateTime(o.submitted_at || o.created_at)}{o.platform && !isAi && platformLabel(o.platform) ? ` · ${platformLabel(o.platform)}` : ""}</div>
        </div>
        <Chip tone={st?.tone}>{st?.label}</Chip>
      </div>
      <div className="mt-3"><SourceChip kind={o.kind} /></div>
      <ul className="mt-3 space-y-1.5 text-[14px]">
        {o.items.map((it: any, i: number) => (
          <li key={i} className="flex justify-between gap-3">
            <span className="min-w-0">{it.title}{it.variant && <span className="text-muted"> ({it.variant})</span>} <span className="text-muted tnum">× {faNum(it.qty)}</span></span>
            <span className="tnum shrink-0">{it.unit_price ? toman(it.unit_price * it.qty) : "قیمت با فروشنده"}</span>
          </li>
        ))}
      </ul>
      {(o.discount_toman > 0 || o.shipping_toman > 0) && (
        <div className="text-[13px] text-muted mt-2 space-y-0.5">
          {o.discount_toman > 0 && <div className="flex justify-between"><span>تخفیف</span><span className="tnum">− {toman(o.discount_toman)}</span></div>}
          {o.shipping_toman > 0 && <div className="flex justify-between"><span>هزینهٔ ارسال</span><span className="tnum">{toman(o.shipping_toman)}</span></div>}
        </div>
      )}
      <div className="flex justify-between font-black text-[15px] border-t border-edge mt-3 pt-3"><span>جمع</span><span className="tnum">{toman(o.total_toman)}</span></div>
      <div className="mt-3 space-y-1 text-[13px]">
        <div className="font-bold">{o.customer_name || "مشتری"} {o.customer_username && <span className="text-muted font-normal" dir="ltr">@{o.customer_username}</span>}</div>
        {o.customer_phone && <div className="flex items-center gap-1.5 text-muted tnum"><Phone className="size-3.5" /><a href={`tel:${o.customer_phone}`} dir="ltr">{faDigits(o.customer_phone)}</a></div>}
        {o.customer_address && <div className="flex items-start gap-1.5 text-muted"><MapPin className="size-3.5 mt-1 shrink-0" />{o.customer_address}</div>}
        {o.note && <div className="text-muted">یادداشت: {o.note}</div>}
      </div>
      {(o.receipt_url || o.payment_ref || o.receipt_text) && (
        <div className="mt-3 rounded-2xl bg-subtle p-3 flex gap-3">
          {o.receipt_url ? <button onClick={() => setZoom(true)} className="cursor-zoom-in shrink-0"><img src={mediaUrl(o.receipt_url, 80)} alt="فیش پرداخت" className="size-20 rounded-xl object-cover" /></button>
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
        {!["confirmed", "cancelled"].includes(o.status) && <Button size="sm" icon={<Check className="size-4" />} loading={patch.isPending && patch.variables?.status === "confirmed"}
          onClick={() => confirm("پرداخت تأیید شود؟ موجودی محصولات کم می‌شود.") && patch.mutate({ status: "confirmed" })}>تأیید پرداخت</Button>}
        {["awaiting_payment", "payment_submitted"].includes(o.status) && <Button size="sm" variant="danger" icon={<X className="size-4" />}
          onClick={() => confirm(o.kind === "invoice" ? "فیش رد شود؟ مشتری می‌تواند با همان لینک دوباره فیش بفرستد." : "سفارش رد شود؟") && patch.mutate({ status: "rejected" })}>رد</Button>}
        {isAi && <Link href={`/app/s/${sid}/chat?tab=conversations&c=${o.conversation_id}`}><Button size="sm" variant="ghost" icon={<MessagesSquare className="size-4" />}>گفتگو</Button></Link>}
      </div>
      {zoom && <Dialog open wide onClose={() => setZoom(false)} title={`فیش ${title}`}><img src={mediaUrl(o.receipt_url)} alt="فیش پرداخت" className="w-full rounded-2xl" /></Dialog>}
    </Card>
  );
}

export function OrdersList({ onNewChatOrder }: { onNewChatOrder: () => void }) {
  const sid = useStoreId();
  const sp = useSearchParams();
  const focus = sp.get("o") ?? "";
  const [day, setDay] = useState(sp.get("day") ?? "");
  const [source, setSource] = useState(sp.get("source") ?? "");
  const [status, setStatus] = useState(sp.get("status") ?? "");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [source, status, q, day]);
  const params = new URLSearchParams({ source, status, q, limit: "30", offset: String(page * 30) });
  if (day) params.set("day", day);
  const { data } = useQuery({ ...orderQueries.list(sid, params), refetchInterval: 20_000, placeholderData: keepPreviousData });
  useEffect(() => { if (focus && data) document.getElementById(`order-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [focus, data]);
  const n = (k: string) => (data?.counts?.[k] ? ` (${faNum(data.counts[k])})` : "");
  const allSources = data ? Object.values<number>(data.sources ?? {}).reduce((a, b) => a + b, 0) : 0;
  return (
    <>
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <Tabs value={source} onChange={setSource} items={[
            { value: "", label: `همه${allSources ? ` (${faNum(allSources)})` : ""}` },
            ...SOURCES.map((s) => ({ value: s, label: <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full" style={{ background: ORDER_SOURCE[s].color }} />{ORDER_SOURCE[s].label}{data?.sources?.[s] ? ` (${faNum(data.sources[s])})` : ""}</span> })),
          ]} />
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="size-4 text-muted absolute top-3.5 start-3.5" aria-hidden />
            <Input className="ps-10" placeholder="نام، موبایل یا شمارهٔ سفارش" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جستجوی سفارش" />
          </div>
          <div className="flex-1 hidden lg:block" />
          <Button variant="secondary" icon={<Plus className="size-4" />} onClick={onNewChatOrder}>ثبت سفارش چت</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={status} onChange={setStatus} items={[
            { value: "", label: "همه وضعیت‌ها" },
            { value: "payment_submitted", label: `منتظر تأیید${n("payment_submitted")}` },
            { value: "awaiting_payment", label: `منتظر پرداخت${n("awaiting_payment")}` },
            { value: "confirmed", label: `تأییدشده${n("confirmed")}` },
            { value: "rejected", label: "ردشده" },
          ]} />
          {day && <button onClick={() => setDay("")} className="inline-flex items-center gap-1 rounded-full bg-primary/12 text-primary px-3 h-8 text-[13px] font-bold cursor-pointer">
            {jDate(day)}<X className="size-3.5" aria-label="برداشتن فیلتر روز" /></button>}
        </div>
      </div>
      {!data ? <Card><ListRowsSkeleton rows={4} /></Card> : data.items.length === 0 ? (
        <Card><EmptyState icon={<ShoppingBag className="size-7" />} title={q || status || source || day ? "سفارشی با این فیلتر نیست" : "هنوز سفارشی نیست"}
          text="سفارش‌های دستیار AI، سفارش‌هایی که خودت از چت ثبت می‌کنی و فاکتورهایی که مشتری فیشش را فرستاده همه اینجا جمع می‌شوند." /></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{data.items.map((o: any) => <OrderCard key={o.key} o={o} highlight={o.key === focus} />)}</div>
          {data.total > 30 && (
            <div className="flex items-center justify-center gap-3 mt-5 text-[13px]">
              <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>قبلی</Button>
              <span className="tnum text-muted">صفحهٔ {faNum(page + 1)} از {faNum(Math.ceil(data.total / 30))}</span>
              <Button size="sm" variant="secondary" disabled={(page + 1) * 30 >= data.total} onClick={() => setPage(page + 1)}>بعدی</Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
