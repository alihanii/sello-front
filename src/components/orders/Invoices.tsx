"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, FileText, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago, faDigits, faNum, jDateTime, toman } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { INVOICE_STATUS, copyText, orderQueries, usePatchInvoice, useInvalidateOrders } from "@/lib/orders";
import { Button, Card, Chip, EmptyState, Field, Input, NumberInput, Switch, Tabs, Textarea } from "@/components/ui/primitives";
import { FormCardSkeleton, ListRowsSkeleton } from "@/components/ui/skeletons";

export function InvoiceList({ onNew }: { onNew: () => void }) {
  const sid = useStoreId();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const params = new URLSearchParams({ status, q, source: "invoice", limit: "50" });
  const { data } = useQuery({ ...orderQueries.invoices(sid, params), placeholderData: keepPreviousData, refetchInterval: 30_000 });
  const patch = usePatchInvoice(sid);
  const n = (k: string) => (data?.counts?.[k] ? ` (${faNum(data.counts[k])})` : "");
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <Tabs value={status} onChange={setStatus} items={[
          { value: "", label: "همه" },
          { value: "awaiting_payment", label: `منتظر پرداخت${n("awaiting_payment")}` },
          { value: "payment_submitted", label: `فیش رسیده${n("payment_submitted")}` },
          { value: "confirmed", label: `پرداخت‌شده${n("confirmed")}` },
          { value: "cancelled", label: "لغوشده" },
        ]} />
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="size-4 text-muted absolute top-3.5 start-3.5" aria-hidden />
          <Input className="ps-10" placeholder="نام، موبایل یا شمارهٔ فاکتور" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جستجوی فاکتور" />
        </div>
        <div className="flex-1 hidden lg:block" />
        <Button icon={<Plus className="size-4" />} onClick={onNew}>فاکتور جدید</Button>
      </div>
      {!data ? <Card><ListRowsSkeleton rows={5} /></Card> : data.items.length === 0 ? (
        <Card><EmptyState icon={<FileText className="size-7" />} title={q || status ? "فاکتوری با این فیلتر نیست" : "هنوز فاکتوری نساخته‌ای"}
          text="فاکتور بساز، لینکش را برای مشتری بفرست؛ مشتری کارت‌به‌کارت می‌کند، فیش را بارگذاری می‌کند و سفارش در لیست سفارشات ثبت می‌شود."
          action={<Button icon={<Plus className="size-4" />} onClick={onNew}>ساخت اولین فاکتور</Button>} /></Card>
      ) : (
        <Card className="divide-y divide-[var(--glass-edge)]">
          {data.items.map((i: any) => {
            const st = i.expired ? { label: "منقضی شده", tone: "neutral" } : INVOICE_STATUS[i.status];
            return (
              <div key={i.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="size-10 rounded-xl bg-accent/15 text-[color-mix(in_oklab,var(--accent),var(--fg)_45%)] grid place-items-center shrink-0"><FileText className="size-4" /></span>
                  <div className="min-w-0">
                    <div className="font-bold flex items-center gap-2 flex-wrap"><span className="tnum">فاکتور {faDigits(i.number)}</span><Chip tone={st?.tone}>{st?.label}</Chip></div>
                    <div className="text-[12px] text-muted truncate">
                      {i.customer_name || "بدون نام"} · {i.items.length === 1 ? i.items[0].title : `${faNum(i.items.length)} قلم`} · {jDateTime(i.created_at)}
                    </div>
                    <div className="text-[12px] text-muted flex items-center gap-1 mt-0.5">
                      {i.viewed_at ? <><Eye className="size-3.5" />مشتری دید {ago(i.viewed_at)}</> : <><EyeOff className="size-3.5" />هنوز باز نشده</>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  <span className="font-black tnum">{toman(i.total_toman)}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" icon={<Copy className="size-4" />} onClick={() => copyText(i.link, "لینک کپی شد")}>لینک</Button>
                    <a href={i.link} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost" aria-label="دیدن فاکتور"><Eye className="size-4" /></Button></a>
                    {i.status === "awaiting_payment" && <Button size="sm" variant="ghost" className="text-danger" onClick={() => confirm("فاکتور لغو شود؟ لینکش دیگر قابل پرداخت نیست.") && patch.mutate({ id: i.id, status: "cancelled" })}>لغو</Button>}
                    {(i.expired || i.status === "cancelled") && <Button size="sm" variant="ghost" onClick={() => patch.mutate({ id: i.id, status: "awaiting_payment" })}>فعال‌سازی دوباره</Button>}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </>
  );
}

export function InvoiceSettings() {
  const sid = useStoreId();
  const refresh = useInvalidateOrders(sid);
  const { data } = useQuery(orderQueries.settings(sid));
  const [f, setF] = useState<any>(null);
  useEffect(() => { if (data && !f) setF(data); }, [data, f]);
  const save = useMutation({
    mutationFn: () => api(`/stores/${sid}/invoice-settings`, { method: "PUT", json: {
      seller_name: f.seller_name, phone: f.phone, address: f.address, card_number: f.card_number, sheba: f.sheba, holder: f.holder,
      bank_name: f.bank_name, pay_link: f.pay_link, require_receipt: f.require_receipt, ask_address: f.ask_address, ask_phone: f.ask_phone,
      expire_hours: f.expire_hours, default_shipping_toman: f.default_shipping_toman, note: f.note, thank_you: f.thank_you, next_number: f.next_number,
    } }),
    onSuccess: (d) => { setF(d); refresh(); toast.success("تنظیمات فاکتور ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!f) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><FormCardSkeleton fields={4} /><FormCardSkeleton fields={4} /></div>;
  const bind = (k: string) => ({ value: f[k] ?? "", onChange: (e: any) => setF({ ...f, [k]: e.target.value }) });
  const toggle = (k: string, title: string, hint: string) => (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-subtle p-3 cursor-pointer">
      <span><b className="text-[14px]">{title}</b><span className="block text-[12px] text-muted">{hint}</span></span>
      <Switch checked={!!f[k]} onChange={(v) => setF({ ...f, [k]: v })} label={title} />
    </label>
  );
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <Card className="p-5 space-y-3">
        <h3 className="font-extrabold text-[15px]">اطلاعات پرداخت</h3>
        <p className="text-[13px] text-muted -mt-2">مشتری روی فاکتور همین‌ها را می‌بیند و با یک ضربه کپی می‌کند.</p>
        <Field label="شماره کارت"><Input dir="ltr" inputMode="numeric" className="text-left tnum" placeholder="6037 9911 1234 5678" {...bind("card_number")} /></Field>
        <Field label="شماره شبا" hint="اختیاری"><Input dir="ltr" className="text-left tnum" placeholder="IR..." {...bind("sheba")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="به نام"><Input {...bind("holder")} /></Field>
          <Field label="بانک"><Input placeholder="ملت، سامان…" {...bind("bank_name")} /></Field>
        </div>
        <Field label="لینک پرداخت آنلاین" hint="اختیاری: لینک درگاه خودت (زرین‌لینک، آیدی‌پی…). روی فاکتور دکمهٔ «پرداخت آنلاین» می‌آید."><Input dir="ltr" className="text-left" placeholder="https://zarinp.al/..." {...bind("pay_link")} /></Field>
        {toggle("require_receipt", "عکس فیش اجباری باشد", "خاموش باشد، مشتری می‌تواند فقط کد پیگیری بزند.")}
      </Card>
      <div className="space-y-4">
        <Card className="p-5 space-y-3">
          <h3 className="font-extrabold text-[15px]">سربرگ فاکتور</h3>
          <Field label="نام فروشنده روی فاکتور"><Input {...bind("seller_name")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="تلفن پشتیبانی"><Input dir="ltr" className="text-left" {...bind("phone")} /></Field>
            <Field label="شمارهٔ فاکتور بعدی"><NumberInput grouping={false} value={f.next_number} onChange={(v) => setF({ ...f, next_number: v || 1 })} /></Field>
          </div>
          <Field label="آدرس"><Input {...bind("address")} /></Field>
          <Field label="توضیحات پایین فاکتور" hint="شرایط ارسال، مرجوعی، زمان تحویل…"><Textarea rows={3} {...bind("note")} /></Field>
        </Card>
        <Card className="p-5 space-y-3">
          <h3 className="font-extrabold text-[15px]">رفتار فاکتور</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="مهلت پرداخت (ساعت)" hint="۰ یعنی بدون مهلت"><NumberInput grouping={false} value={f.expire_hours} onChange={(v) => setF({ ...f, expire_hours: v })} /></Field>
            <Field label="هزینهٔ ارسال پیش‌فرض"><NumberInput value={f.default_shipping_toman} onChange={(v) => setF({ ...f, default_shipping_toman: v })} /></Field>
          </div>
          {toggle("ask_phone", "موبایل مشتری را بپرس", "اگر روی فاکتور نزده باشی، مشتری هنگام ارسال فیش وارد می‌کند.")}
          {toggle("ask_address", "آدرس تحویل را بپرس", "برای کالای فیزیکی روشن بماند.")}
          <Field label="پیام بعد از ارسال فیش"><Input placeholder="ممنون از خریدت! بعد از تأیید، سفارش ارسال می‌شود." {...bind("thank_you")} /></Field>
        </Card>
        <Button type="submit" size="lg" className="w-full" loading={save.isPending}>ذخیرهٔ تنظیمات</Button>
      </div>
    </form>
  );
}
