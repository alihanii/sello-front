"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, FileText, Minus, Package, Plus, Search, Send, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api, mediaUrl } from "@/lib/api";
import { faDigits, faNum, toman } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { ORDER_PLATFORMS, copyText, orderQueries, useInvalidateOrders } from "@/lib/orders";
import { Banner } from "@/components/ui/Banner";
import { Button, Card, CardHeader, Dialog, Field, Input, NumberInput, Select, Switch, Textarea, cn } from "@/components/ui/primitives";

type Line = { key: number; product_id?: number | null; title: string; variant: string; qty: number; unit_price: number; image_url?: string; stock?: number };
let seq = 0;

function ProductPicker({ onPick }: { onPick: (p: any) => void }) {
  const sid = useStoreId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { data, isFetching } = useQuery({
    queryKey: ["invoice-products", sid, q],
    queryFn: () => api(`/stores/${sid}/products?q=${encodeURIComponent(q)}&status=ready&page=1&size=8`),
    enabled: open,
  });
  return (
    <div className="relative">
      <Search className="size-4 text-muted absolute top-3.5 start-3.5" aria-hidden />
      <Input className="ps-10" placeholder="جستجو و افزودن محصول…" value={q} onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} aria-label="جستجوی محصول" />
      {open && (
        <div className="absolute z-20 inset-x-0 top-12 glass-strong rounded-2xl shadow-[var(--shadow)] p-1.5 max-h-80 overflow-auto">
          {!data ? <div className="p-3 text-[13px] text-muted">در حال جستجو…</div> : data.items.length === 0 ? (
            <div className="p-3 text-[13px] text-muted">{isFetching ? "در حال جستجو…" : "محصولی پیدا نشد. می‌توانی ردیف دستی اضافه کنی."}</div>
          ) : data.items.map((p: any) => (
            <button key={p.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(p); setQ(""); setOpen(false); }}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-subtle text-start cursor-pointer">
              {p.images?.[0] ? <img src={mediaUrl(p.images[0].url)} alt="" className="size-10 rounded-lg object-cover" /> : <span className="size-10 rounded-lg bg-subtle grid place-items-center"><Package className="size-4 text-muted" /></span>}
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-semibold truncate">{p.title}</span>
                <span className={cn("block text-[12px] tnum", p.stock_qty > 0 ? "text-muted" : "text-danger")}>{p.stock_qty > 0 ? `موجودی ${faNum(p.stock_qty)}` : "ناموجود"}</span>
              </span>
              <span className="text-[13px] font-bold tnum">{toman(p.price)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Created({ inv, onClose, onAnother }: { inv: any; onClose: () => void; onAnother: () => void }) {
  const text = `فاکتور ${faDigits(inv.number)} · مبلغ ${toman(inv.total_toman)}\nپرداخت و ارسال فیش از این لینک:\n${inv.link}`;
  return (
    <Dialog open onClose={onClose} title={inv.link ? "فاکتور ساخته شد" : "سفارش ثبت شد"}>
      {inv.link ? <>
        <p className="text-[14px] text-muted">این لینک را برای مشتری بفرست. مشتری مبلغ را واریز می‌کند، فیش را بارگذاری می‌کند و سفارش در لیست سفارشات می‌آید.</p>
        <div className="mt-4 rounded-2xl bg-subtle p-3 flex items-center gap-2">
          <code className="flex-1 min-w-0 truncate text-[13px]" dir="ltr">{inv.link}</code>
          <Button size="sm" icon={<Copy className="size-4" />} onClick={() => copyText(inv.link, "لینک کپی شد")}>کپی</Button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button variant="secondary" icon={<Copy className="size-4" />} onClick={() => copyText(text, "متن پیام کپی شد")}>کپی با متن پیام</Button>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(inv.link)}&text=${encodeURIComponent(`فاکتور ${faDigits(inv.number)} · ${toman(inv.total_toman)}`)}`} target="_blank" rel="noreferrer">
            <Button variant="secondary" className="w-full" icon={<Send className="size-4" />}>ارسال در تلگرام</Button></a>
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"><Button variant="secondary" className="w-full">ارسال در واتساپ</Button></a>
          <a href={inv.link} target="_blank" rel="noreferrer"><Button variant="ghost" className="w-full" icon={<ExternalLink className="size-4" />}>دیدن فاکتور</Button></a>
        </div>
      </> : <p className="text-[14px] text-muted">سفارش {faDigits(inv.number)} با مبلغ {toman(inv.total_toman)} در لیست سفارشات ثبت شد.</p>}
      <div className="flex gap-2 mt-5">
        <Button className="flex-1" onClick={onAnother}>{inv.link ? "فاکتور بعدی" : "سفارش بعدی"}</Button>
        <Button variant="ghost" onClick={onClose}>بستن</Button>
      </div>
    </Dialog>
  );
}

/** New invoice (a payment link for the customer), or with `chat`, an order the seller took in a chat by hand. */
export function InvoiceForm({ chat = false, onDone }: { chat?: boolean; onDone: () => void }) {
  const sid = useStoreId();
  const refresh = useInvalidateOrders(sid);
  const { data: conf } = useQuery(orderQueries.settings(sid));
  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [paid, setPaid] = useState(false);
  const [created, setCreated] = useState<any>(null);
  const ship = shipping ?? conf?.default_shipping_toman ?? 0;
  const subtotal = lines.reduce((a, l) => a + l.qty * l.unit_price, 0);
  const total = Math.max(0, subtotal - Math.min(discount, subtotal) + ship);
  const set = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const add = (p: any) => setLines((ls) => {
    const hit = ls.find((l) => l.product_id === p.id);
    if (hit) return ls.map((l) => (l === hit ? { ...l, qty: l.qty + 1 } : l));
    return [...ls, { key: ++seq, product_id: p.id, title: p.title, variant: "", qty: 1, unit_price: p.price, image_url: p.images?.[0]?.url, stock: p.stock_qty }];
  });
  const reset = () => { setLines([]); setCustomer({ name: "", phone: "", address: "" }); setDiscount(0); setShipping(null); setNote(""); setPaid(false); setCreated(null); };
  const save = useMutation({
    mutationFn: () => api(`/stores/${sid}/invoices`, { method: "POST", json: {
      source: chat ? "chat" : "invoice", platform: chat ? platform : "", customer_name: customer.name, customer_phone: customer.phone,
      customer_address: customer.address, discount_toman: discount, shipping_toman: ship, note,
      status: chat && paid ? "confirmed" : "awaiting_payment",
      items: lines.map((l) => ({ product_id: l.product_id ?? null, title: l.title, variant: l.variant, qty: l.qty, unit_price: l.unit_price })),
    } }),
    onSuccess: (inv) => { refresh(); setCreated(inv); },
    onError: (e: any) => toast.error(e.message),
  });
  const valid = lines.length > 0 && lines.every((l) => l.title.trim() && l.qty > 0) && (chat || total > 0);

  return (
    <>
      {!chat && conf && !conf.ready && (
        <div className="mb-4"><Banner icon={Settings2} href={`/app/s/${sid}/orders?tab=settings`}><b>اول اطلاعات پرداخت را وارد کن.</b> <span className="text-muted">شماره کارت، شبا یا لینک پرداختت را در تنظیمات فاکتور بزن تا روی فاکتور مشتری نمایش داده شود.</span></Banner></div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <Card className="relative z-10">
            <CardHeader title="محصولات" subtitle="از محصولات فروشگاه انتخاب کن یا ردیف دستی بنویس." />
            <div className="px-4 sm:px-5 pb-5 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1"><ProductPicker onPick={add} /></div>
                <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => setLines((ls) => [...ls, { key: ++seq, title: "", variant: "", qty: 1, unit_price: 0 }])}>ردیف دستی</Button>
              </div>
              {lines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-edge p-8 text-center text-[14px] text-muted"><FileText className="size-6 mx-auto mb-2" />هنوز محصولی اضافه نشده.</div>
              ) : (
                <ul className="space-y-2">
                  {lines.map((l) => (
                    <li key={l.key} className="rounded-2xl bg-subtle p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {l.image_url ? <img src={mediaUrl(l.image_url)} alt="" className="size-12 rounded-xl object-cover shrink-0" /> : <span className="size-12 rounded-xl bg-glass grid place-items-center shrink-0"><Package className="size-4 text-muted" /></span>}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {l.product_id ? <div className="font-semibold text-[14px] truncate">{l.title}</div>
                            : <Input className="!h-9" placeholder="نام کالا یا خدمت" value={l.title} onChange={(e) => set(l.key, { title: e.target.value })} aria-label="نام ردیف" />}
                          <Input className="!h-9 text-[13px]" placeholder="رنگ، سایز… (اختیاری)" value={l.variant} onChange={(e) => set(l.key, { variant: e.target.value })} aria-label="مشخصات" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-xl bg-glass border border-edge h-9">
                          <button type="button" className="size-9 grid place-items-center cursor-pointer" onClick={() => set(l.key, { qty: Math.max(1, l.qty - 1) })} aria-label="کم کردن"><Minus className="size-3.5" /></button>
                          <span className="w-8 text-center tnum text-[14px] font-bold">{faNum(l.qty)}</span>
                          <button type="button" className="size-9 grid place-items-center cursor-pointer" onClick={() => set(l.key, { qty: l.qty + 1 })} aria-label="زیاد کردن"><Plus className="size-3.5" /></button>
                        </div>
                        <NumberInput className="!h-9 w-32" value={l.unit_price} onChange={(v) => set(l.key, { unit_price: v })} aria-label="قیمت واحد (تومان)" placeholder="قیمت" />
                        <Button size="sm" variant="ghost" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} aria-label="حذف ردیف"><Trash2 className="size-4 text-danger" /></Button>
                      </div>
                      {l.stock != null && l.qty > l.stock && <div className="text-[12px] text-warning sm:hidden">موجودی فقط {faNum(l.stock)} عدد است.</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title="مشتری" subtitle={chat ? "مشخصات کسی که در چت سفارش داد." : "اختیاری؛ اگر خالی بماند، مشتری هنگام ارسال فیش خودش وارد می‌کند."} />
            <div className="px-4 sm:px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {chat && <Field label="از کجا سفارش داد؟"><Select value={platform} onChange={(e) => setPlatform(e.target.value)}>{ORDER_PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select></Field>}
              <Field label="نام"><Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></Field>
              <Field label="موبایل"><Input dir="ltr" inputMode="tel" className="text-left" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></Field>
              <Field label="آدرس" className="sm:col-span-2"><Textarea rows={2} className="!min-h-16" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} /></Field>
            </div>
          </Card>
        </div>
        <Card strong className="lg:sticky lg:top-20">
          <CardHeader title={chat ? "جمع سفارش" : "جمع فاکتور"} />
          <div className="px-4 sm:px-5 pb-5 space-y-3 text-[14px]">
            <div className="flex justify-between"><span className="text-muted">جمع اقلام</span><span className="tnum font-semibold">{faNum(subtotal)} تومان</span></div>
            <Field label="تخفیف (تومان)"><NumberInput value={discount} onChange={setDiscount} /></Field>
            <Field label="هزینهٔ ارسال (تومان)"><NumberInput value={ship} onChange={(v) => setShipping(v)} /></Field>
            <Field label={chat ? "یادداشت" : "توضیح روی فاکتور"} hint={chat ? undefined : "مشتری این را روی فاکتور می‌بیند."}><Textarea rows={2} className="!min-h-16" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            {chat && <label className="flex items-center justify-between gap-3 rounded-2xl bg-subtle p-3 cursor-pointer"><span><b>پرداختش را گرفته‌ام</b><span className="block text-[12px] text-muted">سفارش تأییدشده ثبت می‌شود و موجودی کم می‌شود.</span></span><Switch checked={paid} onChange={setPaid} label="پرداخت‌شده" /></label>}
            <div className="flex justify-between items-baseline border-t border-edge pt-3"><span className="font-bold">مبلغ قابل پرداخت</span><span className="tnum font-black text-[20px]">{faNum(total)} <span className="text-[12px] font-semibold text-muted">تومان</span></span></div>
            <Button className="w-full" size="lg" disabled={!valid} loading={save.isPending} onClick={() => save.mutate()}>{chat ? "ثبت سفارش" : "ساخت فاکتور و لینک پرداخت"}</Button>
          </div>
        </Card>
      </div>
      {created && <Created inv={created} onClose={() => { reset(); onDone(); }} onAnother={reset} />}
    </>
  );
}
