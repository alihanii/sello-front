"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, FileText, Minus, Package, Plus, Search, Send, Settings2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { api, mediaUrl } from "@/lib/api";
import { faDigits, faNum, toman } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { rules, useZodForm, z } from "@/lib/form";
import { ORDER_PLATFORMS, copyText, orderQueries, useInvalidateOrders } from "@/lib/orders";
import { Banner } from "@/components/ui/Banner";
import { Button, Card, CardHeader, Dialog, Field, Input, NumberInput, Select, Switch, Textarea, cn, FormActions } from "@/components/ui/primitives";


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

const lineSchema = z.object({
  product_id: z.number().nullable(),
  title: z.string().trim().min(1, "نام ردیف را بنویس.").max(300),
  variant: rules.text(120),
  qty: z.number().int().min(1, "حداقل ۱."),
  unit_price: rules.toman,
  image_url: z.string().optional(),
  stock: z.number().nullable().optional(),
});

const makeSchema = (chat: boolean) => z.object({
  items: z.array(lineSchema).min(1, "حداقل یک محصول اضافه کن."),
  customer_name: rules.text(160),
  customer_phone: rules.mobile,
  customer_address: rules.text(1000),
  discount_toman: rules.toman,
  shipping_toman: rules.toman,
  note: rules.text(1500),
  platform: z.string(),
  paid: z.boolean(),
}).superRefine((v, ctx) => {
  const subtotal = v.items.reduce((a, l) => a + l.qty * l.unit_price, 0);
  if (!chat && subtotal - Math.min(v.discount_toman, subtotal) + v.shipping_toman <= 0) {
    ctx.addIssue({ code: "custom", path: ["items"], message: "جمع فاکتور باید بیشتر از صفر باشد؛ قیمت ردیف‌ها را بزن." });
  }
});
type InvoiceValues = z.infer<ReturnType<typeof makeSchema>>;

const blank = (shipping = 0): InvoiceValues => ({
  items: [], customer_name: "", customer_phone: "", customer_address: "", discount_toman: 0, shipping_toman: shipping,
  note: "", platform: "instagram", paid: false,
});

/** New invoice (a payment link for the customer), or with `chat`, an order the seller took in a chat by hand. */
export function InvoiceForm({ chat = false, onDone }: { chat?: boolean; onDone: () => void }) {
  const sid = useStoreId();
  const refresh = useInvalidateOrders(sid);
  const { data: conf } = useQuery(orderQueries.settings(sid));
  const [schema] = useState(() => makeSchema(chat));
  const { register, control, handleSubmit, reset, setValue, getValues, formState: { errors } } = useZodForm(schema, { defaultValues: blank() });
  const { fields, append, remove, update } = useFieldArray({ control, name: "items" });
  const [created, setCreated] = useState<any>(null);
  // The store's default shipping arrives after the form mounts; use it until the seller types their own.
  useEffect(() => { if (conf && !getValues("shipping_toman")) setValue("shipping_toman", conf.default_shipping_toman ?? 0); }, [conf, getValues, setValue]);
  const [items, discount, shipping] = useWatch({ control, name: ["items", "discount_toman", "shipping_toman"] });
  const subtotal = (items ?? []).reduce((a: number, l: any) => a + (l.qty || 0) * (l.unit_price || 0), 0);
  const total = Math.max(0, subtotal - Math.min(discount || 0, subtotal) + (shipping || 0));
  const add = (p: any) => {
    const at = (getValues("items") ?? []).findIndex((l: any) => l.product_id === p.id);
    if (at >= 0) update(at, { ...getValues(`items.${at}`), qty: getValues(`items.${at}.qty`) + 1 });
    else append({ product_id: p.id, title: p.title, variant: "", qty: 1, unit_price: p.price, image_url: p.images?.[0]?.url ?? "", stock: p.stock_qty });
  };
  const again = () => { reset(blank(conf?.default_shipping_toman ?? 0)); setCreated(null); };
  const save = useMutation({
    mutationFn: (v: InvoiceValues) => api(`/stores/${sid}/invoices`, { method: "POST", json: {
      source: chat ? "chat" : "invoice", platform: chat ? v.platform : "", customer_name: v.customer_name, customer_phone: v.customer_phone,
      customer_address: v.customer_address, discount_toman: v.discount_toman, shipping_toman: v.shipping_toman, note: v.note,
      status: chat && v.paid ? "confirmed" : "awaiting_payment",
      items: v.items.map(({ product_id, title, variant, qty, unit_price }) => ({ product_id, title, variant, qty, unit_price })),
    } }),
    onSuccess: (inv) => { refresh(); setCreated(inv); },
    onError: (e: any) => toast.error(e.message),
  });
  const submit = handleSubmit((v) => save.mutate(v as InvoiceValues));
  const itemsError = (errors.items as any)?.message ?? (errors.items as any)?.root?.message;

  return (
    <>
    <form onSubmit={submit} noValidate>
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
                <Button type="button" variant="secondary" icon={<Plus className="size-4" />} onClick={() => append({ product_id: null, title: "", variant: "", qty: 1, unit_price: 0, image_url: "", stock: null })}>ردیف دستی</Button>
              </div>
              {fields.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-edge p-8 text-center text-[14px] text-muted"><FileText className="size-6 mx-auto mb-2" />هنوز محصولی اضافه نشده.</div>
              ) : (
                <ul className="space-y-2">
                  {fields.map((l, i) => {
                    const e = (errors.items as any)?.[i];
                    const qty = items?.[i]?.qty ?? l.qty;
                    return (
                      <li key={l.id} className="rounded-2xl bg-subtle p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {l.image_url ? <img src={mediaUrl(l.image_url)} alt="" className="size-12 rounded-xl object-cover shrink-0" /> : <span className="size-12 rounded-xl bg-glass grid place-items-center shrink-0"><Package className="size-4 text-muted" /></span>}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            {l.product_id ? <div className="font-semibold text-[14px] truncate">{l.title}</div> : <>
                              <Input className="!h-9" placeholder="نام کالا یا خدمت" {...register(`items.${i}.title`)} aria-label="نام ردیف" aria-invalid={!!e?.title} />
                              {e?.title && <span className="block text-[12px] text-danger">{e.title.message}</span>}
                            </>}
                            <Input className="!h-9 text-[13px]" placeholder="رنگ، سایز… (اختیاری)" {...register(`items.${i}.variant`)} aria-label="مشخصات" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Controller control={control} name={`items.${i}.qty`} render={({ field }) => (
                            <div className="flex items-center rounded-xl bg-glass border border-edge h-9">
                              <button type="button" className="size-9 grid place-items-center cursor-pointer" onClick={() => field.onChange(Math.max(1, field.value - 1))} aria-label="کم کردن"><Minus className="size-3.5" /></button>
                              <span className="w-8 text-center tnum text-[14px] font-bold">{faNum(field.value)}</span>
                              <button type="button" className="size-9 grid place-items-center cursor-pointer" onClick={() => field.onChange(field.value + 1)} aria-label="زیاد کردن"><Plus className="size-3.5" /></button>
                            </div>
                          )} />
                          <Controller control={control} name={`items.${i}.unit_price`} render={({ field }) => (
                            <NumberInput className="!h-9 w-32" value={field.value} onChange={field.onChange} onBlur={field.onBlur} aria-label="قیمت واحد (تومان)" placeholder="قیمت" />
                          )} />
                          <Button type="button" size="sm" variant="ghost" onClick={() => remove(i)} aria-label="حذف ردیف"><Trash2 className="size-4 text-danger" /></Button>
                        </div>
                        {l.stock != null && qty > l.stock && <div className="text-[12px] text-warning">موجودی فقط {faNum(l.stock)} عدد است.</div>}
                      </li>
                    );
                  })}
                </ul>
              )}
              {itemsError && <p className="text-[13px] text-danger font-semibold" role="alert">{itemsError}</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="مشتری" subtitle={chat ? "مشخصات کسی که در چت سفارش داد." : "اختیاری؛ اگر خالی بماند، مشتری هنگام ارسال فیش خودش وارد می‌کند."} />
            <div className="px-4 sm:px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {chat && <Field label="از کجا سفارش داد؟">
                <Controller control={control} name="platform" render={({ field }) => (
                  <Select value={field.value} onChange={(e) => field.onChange(e.target.value)}>{ORDER_PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select>
                )} /></Field>}
              <Field label="نام" error={errors.customer_name?.message as string}><Input {...register("customer_name")} /></Field>
              <Field label="موبایل" error={errors.customer_phone?.message as string}><Input dir="ltr" inputMode="tel" className="text-left" placeholder="09xxxxxxxxx" {...register("customer_phone")} aria-invalid={!!errors.customer_phone} /></Field>
              <Field label="آدرس" className="sm:col-span-2" error={errors.customer_address?.message as string}><Textarea rows={2} className="!min-h-16" {...register("customer_address")} /></Field>
            </div>
          </Card>
        </div>
        <Card strong className="lg:sticky lg:top-20">
          <CardHeader title={chat ? "جمع سفارش" : "جمع فاکتور"} />
          <div className="px-4 sm:px-5 pb-5 space-y-3 text-[14px]">
            <div className="flex justify-between"><span className="text-muted">جمع اقلام</span><span className="tnum font-semibold">{faNum(subtotal)} تومان</span></div>
            {(["discount_toman", "shipping_toman"] as const).map((k) => (
              <Field key={k} label={k === "discount_toman" ? "تخفیف (تومان)" : "هزینهٔ ارسال (تومان)"} error={errors[k]?.message as string}>
                <Controller control={control} name={k} render={({ field }) => <NumberInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
              </Field>
            ))}
            <Field label={chat ? "یادداشت" : "توضیح روی فاکتور"} hint={chat ? undefined : "مشتری این را روی فاکتور می‌بیند."} error={errors.note?.message as string}>
              <Textarea rows={2} className="!min-h-16" {...register("note")} /></Field>
            {chat && <Controller control={control} name="paid" render={({ field }) => (
              <label className="flex items-center justify-between gap-3 rounded-2xl bg-subtle p-3 cursor-pointer"><span><b>پرداختش را گرفته‌ام</b><span className="block text-[12px] text-muted">سفارش تأییدشده ثبت می‌شود و موجودی کم می‌شود.</span></span><Switch checked={field.value} onChange={field.onChange} label="پرداخت‌شده" /></label>
            )} />}
            <div className="flex justify-between items-baseline border-t border-edge pt-3"><span className="font-bold">مبلغ قابل پرداخت</span><span className="tnum font-black text-[20px]">{faNum(total)} <span className="text-[12px] font-semibold text-muted">تومان</span></span></div>
            <Button type="submit" className="w-full max-lg:hidden" size="lg" loading={save.isPending}>{chat ? "ثبت سفارش" : "ساخت فاکتور و لینک پرداخت"}</Button>
          </div>
        </Card>
      </div>
      {/* Phones: the total card is at the very end, so the submit button floats above the tab bar instead. */}
      <FormActions className="lg:hidden" note={<span className="tnum text-fg">{faNum(total)} <span className="text-muted text-[12px]">تومان</span></span>}>
        <Button type="submit" size="lg" loading={save.isPending}>{chat ? "ثبت سفارش" : "ساخت فاکتور"}</Button>
      </FormActions>
    </form>
    {created && <Created inv={created} onClose={() => { again(); onDone(); }} onAnother={again} />}
    </>
  );
}
