"use client";

import { CheckCircle2, Clock, Copy, CreditCard, ExternalLink, Loader2, Phone, ReceiptText, Store, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL, mediaUrl } from "@/lib/api";
import { faDigits, faNum, jDate, jDateTime } from "@/lib/format";
import { Button, Card, cn } from "@/components/ui/primitives";
import { Logo } from "@/components/shell/Brand";
import { ReceiptForm } from "@/components/orders/ReceiptForm";

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

  useEffect(() => {
    fetch(`${API_URL}/api/v1/public/invoices/${code}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject((await r.json().catch(() => null))?.detail?.message ?? "فاکتور پیدا نشد.")))
      .then(setInv)
      .catch((e) => setError(typeof e === "string" ? e : "ارتباط با سرور برقرار نشد."));
  }, [code]);
  if (error) {
    return (
      <main className="min-h-dvh grid place-items-center p-4">
        <Card className="p-8 text-center max-w-sm"><XCircle className="size-10 text-danger mx-auto mb-3" /><h1 className="font-bold text-[18px]">{error}</h1>
          <p className="text-muted text-[14px] mt-1">لینک را دوباره از فروشنده بگیر.</p></Card>
      </main>
    );
  }
  if (!inv) return <main className="min-h-dvh grid place-items-center"><Loader2 className="size-7 animate-spin text-primary" aria-label="در حال بارگذاری" /></main>;

  const closed = inv.closed || inv.status === "confirmed" || inv.status === "cancelled" || inv.status === "payment_submitted" || inv.expired;
  const pay = inv.payment;
  if (closed) {
    const st = inv.status === "confirmed" ? { icon: CheckCircle2, tone: "text-success bg-success/12", title: "پرداخت تأیید شد", text: "سفارشت ثبت شد و در حال آماده‌سازی است. ممنون از خریدت." }
      : inv.status === "payment_submitted" ? { icon: Clock, tone: "text-warning bg-warning/14", title: "فیش ارسال شد؛ منتظر تأیید فروشنده", text: inv.thank_you || "فروشنده فیش را بررسی می‌کند و بعد از تأیید، سفارشت ارسال می‌شود." }
      : inv.status === "cancelled" ? { icon: XCircle, tone: "text-danger bg-danger/12", title: "این فاکتور لغو شده است", text: "این لینک دیگر قابل پرداخت نیست. اگر هنوز خرید می‌خواهی، از فروشنده فاکتور تازه بخواه." }
      : { icon: Clock, tone: "text-muted bg-subtle", title: "مهلت پرداخت این فاکتور تمام شده", text: "این لینک دیگر قابل پرداخت نیست. برای فاکتور تازه به فروشنده پیام بده." };
    return (
      <main className="min-h-dvh grid place-items-center px-4 py-10">
        <Card strong className="w-full max-w-md p-7 text-center">
          <span className={cn("size-16 rounded-full grid place-items-center mx-auto mb-4", st.tone)}><st.icon className="size-8" /></span>
          <h1 className="font-black text-[19px]">{st.title}</h1>
          <p className="text-muted text-[14px] mt-2 leading-7">{st.text}</p>
          <div className="mt-5 rounded-2xl bg-subtle p-4 text-[14px] space-y-1.5 text-start">
            <div className="flex justify-between"><span className="text-muted">فروشنده</span><b>{inv.seller.seller_name}</b></div>
            <div className="flex justify-between"><span className="text-muted">شمارهٔ فاکتور</span><b className="tnum">{faDigits(inv.number)}</b></div>
            <div className="flex justify-between"><span className="text-muted">مبلغ</span><Money v={inv.total_toman} /></div>
            {inv.submitted_at && <div className="flex justify-between"><span className="text-muted">ارسال فیش</span><span className="tnum">{jDateTime(inv.submitted_at)}</span></div>}
          </div>
          {inv.seller.phone && <a href={`tel:${inv.seller.phone}`} className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-primary font-bold"><Phone className="size-4" />تماس با فروشنده <span dir="ltr" className="tnum">{faDigits(inv.seller.phone)}</span></a>}
          <Link href="/" className="flex items-center justify-center gap-1.5 text-[12px] text-muted mt-6">فاکتور با <Logo className="text-[14px]" /></Link>
        </Card>
      </main>
    );
  }
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

                        {inv.status === "rejected" && <Card className="p-4 flex items-center gap-3"><XCircle className="size-6 text-danger shrink-0" /><div><b>فیش قبلی تأیید نشد.</b><div className="text-[13px] text-muted">اگر واریز کرده‌ای، فیش درست را دوباره بفرست یا با فروشنده تماس بگیر.</div></div></Card>}
                
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

        {(
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
              <ReceiptForm inv={inv} code={code} onSent={(d) => { setInv({ ...d, closed: true }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
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
