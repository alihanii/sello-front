"use client";

import { CheckCircle2, Clock, Copy, CreditCard, ExternalLink, ImagePlus, Loader2, Phone, ReceiptText, Store, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { API_URL, mediaUrl } from "@/lib/api";
import { faDigits, faNum, jDate, jDateTime } from "@/lib/format";
import { Button, Card, Field, Input, Textarea, cn } from "@/components/ui/primitives";
import { Logo } from "@/components/shell/Brand";

const card4 = (v: string) => faDigits(v.replace(/(\d{4})(?=\d)/g, "$1 "));

function CopyRow({ label, value, shown, small }: { label: string; value: string; shown?: string; small?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1600); } catch {} }}
      className="w-full flex items-center justify-between gap-3 rounded-2xl bg-subtle px-4 py-3 text-start cursor-pointer hover:bg-glass-strong transition">
      <span className="min-w-0">
        <span className="block text-[12px] text-muted">{label}</span>
        <span className={cn("block font-black tnum truncate", small ? "text-[13px] sm:text-[15px]" : "text-[17px] sm:text-[19px] tracking-wide")} dir="ltr">{shown ?? value}</span>
      </span>
      <span className={cn("text-[12px] font-bold flex items-center gap-1 shrink-0", done ? "text-success" : "text-primary")}>
        {done ? <><CheckCircle2 className="size-4" />کپی شد</> : <><Copy className="size-4" />کپی</>}
      </span>
    </button>
  );
}

function Money({ v, big }: { v: number; big?: boolean }) {
  return <span className={cn("tnum", big && "text-[22px] font-black")}>{faNum(v)} <span className="text-[12px] font-semibold text-muted">تومان</span></span>;
}

export default function PublicInvoice() {
  const { code } = useParams<{ code: string }>();
  const [inv, setInv] = useState<any>(null);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "", payment_ref: "", note: "" });
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/public/invoices/${code}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject((await r.json().catch(() => null))?.detail?.message ?? "فاکتور پیدا نشد.")))
      .then((d) => { setInv(d); setForm((f) => ({ ...f, name: d.customer.name, phone: d.customer.phone, address: d.customer.address })); })
      .catch((e) => setError(typeof e === "string" ? e : "ارتباط با سرور برقرار نشد."));
  }, [code]);
  useEffect(() => {
    if (!file) return setPreview("");
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (inv.require_receipt && !file) return setFormError("عکس فیش واریز را انتخاب کن.");
    if (!file && !form.payment_ref.trim()) return setFormError("عکس فیش یا کد پیگیری را وارد کن.");
    const body = new FormData();
    if (file) body.append("file", file);
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    setSending(true);
    try {
      const r = await fetch(`${API_URL}/api/v1/public/invoices/${code}/receipt`, { method: "POST", body });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.detail?.message ?? "ارسال نشد؛ دوباره امتحان کن.");
      setInv(d);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setFormError(err.message === "Failed to fetch" ? "ارتباط برقرار نشد؛ دوباره امتحان کن." : err.message);
    } finally {
      setSending(false);
    }
  };

  if (error) {
    return (
      <main className="min-h-dvh grid place-items-center p-4">
        <Card className="p-8 text-center max-w-sm"><XCircle className="size-10 text-danger mx-auto mb-3" /><h1 className="font-bold text-[18px]">{error}</h1>
          <p className="text-muted text-[14px] mt-1">لینک را دوباره از فروشنده بگیر.</p></Card>
      </main>
    );
  }
  if (!inv) return <main className="min-h-dvh grid place-items-center"><Loader2 className="size-7 animate-spin text-primary" aria-label="در حال بارگذاری" /></main>;

  const closed = inv.status === "confirmed" || inv.status === "cancelled" || inv.expired;
  const sent = inv.status === "payment_submitted";
  const pay = inv.payment;
  return (
    <main className="min-h-dvh px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-xl space-y-4">
        <header className="flex items-center gap-3">
          {inv.seller.logo_url ? <img src={mediaUrl(inv.seller.logo_url)} alt="" className="size-12 rounded-2xl object-cover" />
            : <span className="size-12 rounded-2xl bg-primary text-primary-fg grid place-items-center"><Store className="size-5" /></span>}
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-[19px] truncate">{inv.seller.seller_name}</h1>
            <div className="text-[13px] text-muted tnum">فاکتور {faDigits(inv.number)} · {jDate(inv.created_at)}</div>
          </div>
        </header>

        {inv.status === "confirmed" && <Card className="p-4 flex items-center gap-3 border-success/30"><CheckCircle2 className="size-6 text-success shrink-0" /><div><b>پرداخت تأیید شد.</b><div className="text-[13px] text-muted">سفارشت در حال آماده‌سازی است. ممنون از خریدت.</div></div></Card>}
        {sent && <Card className="p-4 flex items-center gap-3"><Clock className="size-6 text-warning shrink-0" /><div><b>فیش رسید؛ منتظر تأیید فروشنده.</b><div className="text-[13px] text-muted">{inv.thank_you || "بعد از بررسی، سفارشت ثبت و ارسال می‌شود."}</div></div></Card>}
        {inv.status === "rejected" && <Card className="p-4 flex items-center gap-3"><XCircle className="size-6 text-danger shrink-0" /><div><b>فیش قبلی تأیید نشد.</b><div className="text-[13px] text-muted">اگر واریز کرده‌ای، فیش درست را دوباره بفرست یا با فروشنده تماس بگیر.</div></div></Card>}
        {inv.status === "cancelled" && <Card className="p-4 flex items-center gap-3"><XCircle className="size-6 text-muted shrink-0" /><b>این فاکتور لغو شده است.</b></Card>}
        {inv.expired && <Card className="p-4 flex items-center gap-3"><Clock className="size-6 text-muted shrink-0" /><div><b>مهلت پرداخت تمام شده.</b><div className="text-[13px] text-muted">برای فاکتور تازه به فروشنده پیام بده.</div></div></Card>}

        <Card strong className="p-5">
          <div className="flex items-center gap-2 font-extrabold text-[15px] mb-3"><ReceiptText className="size-4 text-primary" />اقلام فاکتور</div>
          <ul className="divide-y divide-[var(--glass-edge)]">
            {inv.items.map((it: any, i: number) => (
              <li key={i} className="flex items-center gap-3 py-3">
                {it.image_url && <img src={mediaUrl(it.image_url)} alt="" className="size-12 rounded-xl object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px]">{it.title}</div>
                  <div className="text-[12px] text-muted tnum">{it.variant ? `${it.variant} · ` : ""}{faNum(it.qty)} × {faNum(it.unit_price)}</div>
                </div>
                <span className="text-[14px] font-bold tnum">{faNum(it.qty * it.unit_price)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-edge mt-1 pt-3 space-y-1.5 text-[14px]">
            {(inv.discount_toman > 0 || inv.shipping_toman > 0) && <div className="flex justify-between"><span className="text-muted">جمع اقلام</span><Money v={inv.subtotal_toman} /></div>}
            {inv.discount_toman > 0 && <div className="flex justify-between text-success"><span>تخفیف</span><span className="tnum">− {faNum(inv.discount_toman)}</span></div>}
            {inv.shipping_toman > 0 && <div className="flex justify-between"><span className="text-muted">هزینهٔ ارسال</span><Money v={inv.shipping_toman} /></div>}
            <div className="flex justify-between items-baseline pt-1"><span className="font-bold">مبلغ قابل پرداخت</span><Money v={inv.total_toman} big /></div>
          </div>
          {inv.note && <p className="mt-3 rounded-2xl bg-subtle p-3 text-[13px] whitespace-pre-line">{inv.note}</p>}
          {inv.expires_at && inv.status === "awaiting_payment" && !inv.expired && <p className="mt-3 text-[12px] text-muted flex items-center gap-1"><Clock className="size-3.5" />مهلت پرداخت تا {jDateTime(inv.expires_at)}</p>}
        </Card>

        {!closed && (
          <>
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2 font-extrabold text-[15px]"><CreditCard className="size-4 text-primary" />پرداخت</div>
              {pay.card_number && <CopyRow label={`کارت به کارت${pay.holder ? ` · به نام ${pay.holder}` : ""}${pay.bank_name ? ` · ${pay.bank_name}` : ""}`} value={pay.card_number} shown={card4(pay.card_number)} />}
              {pay.sheba && <CopyRow label="شماره شبا" value={pay.sheba} shown={faDigits(pay.sheba)} small />}
              <CopyRow label="مبلغ (تومان)" value={String(inv.total_toman)} shown={faNum(inv.total_toman)} />
              {pay.pay_link && <a href={pay.pay_link} target="_blank" rel="noreferrer" className="block"><Button className="w-full" size="lg" icon={<ExternalLink className="size-4" />}>پرداخت آنلاین</Button></a>}
              {!pay.card_number && !pay.sheba && !pay.pay_link && <p className="text-[13px] text-muted">روش پرداخت را از فروشنده بپرس، بعد فیش را همین‌جا بفرست.</p>}
            </Card>

            <Card className="p-5">
              <form onSubmit={submit} className="space-y-3">
                <div className="font-extrabold text-[15px]">{sent ? "ارسال دوبارهٔ فیش" : "بعد از واریز، فیش را بفرست"}</div>
                <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => input.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-edge hover:border-primary transition p-4 flex flex-col items-center gap-2 cursor-pointer">
                  {preview ? <img src={preview} alt="فیش انتخاب‌شده" className="max-h-56 rounded-xl" /> : <ImagePlus className="size-8 text-primary" />}
                  <span className="text-[14px] font-bold">{preview ? "تغییر عکس فیش" : `عکس فیش واریز${inv.require_receipt ? "" : " (اختیاری)"}`}</span>
                  {!preview && <span className="text-[12px] text-muted">اسکرین‌شات پیامک بانک یا رسید اپ بانکی</span>}
                </button>
                <Field label={`کد پیگیری / شمارهٔ ارجاع${inv.require_receipt ? " (اختیاری)" : ""}`}><Input dir="ltr" inputMode="numeric" className="text-left tnum" value={form.payment_ref} onChange={(e) => setForm({ ...form, payment_ref: e.target.value })} /></Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="نام و نام خانوادگی"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></Field>
                  {inv.ask_phone && <Field label="موبایل"><Input dir="ltr" inputMode="tel" className="text-left" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" required /></Field>}
                </div>
                {inv.ask_address && <Field label="آدرس کامل و کد پستی"><Textarea rows={2} className="!min-h-20" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} autoComplete="street-address" required /></Field>}
                <Field label="توضیح برای فروشنده (اختیاری)"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
                {formError && <p className="text-[13px] text-danger font-semibold" role="alert">{formError}</p>}
                <Button type="submit" size="lg" className="w-full" loading={sending}>ارسال فیش و ثبت سفارش</Button>
              </form>
            </Card>
          </>
        )}

        {(inv.terms || inv.seller.phone || inv.seller.address) && (
          <Card className="p-5 text-[13px] text-muted space-y-1.5">
            {inv.terms && <p className="whitespace-pre-line">{inv.terms}</p>}
            {inv.seller.phone && <p className="flex items-center gap-1.5"><Phone className="size-3.5" /><a href={`tel:${inv.seller.phone}`} dir="ltr" className="tnum">{faDigits(inv.seller.phone)}</a></p>}
            {inv.seller.address && <p>{inv.seller.address}</p>}
          </Card>
        )}
        <Link href="/" className="flex items-center justify-center gap-1.5 text-[12px] text-muted pt-2">فاکتور با <Logo className="text-[14px]" /></Link>
      </div>
    </main>
  );
}
