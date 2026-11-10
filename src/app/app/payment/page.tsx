"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, LayoutDashboard, RotateCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { faDigits, faNum, jDate, jDateTime, toman } from "@/lib/format";
import { Logo } from "@/components/shell/Brand";
import { Button, Card, Skeleton, cn } from "@/components/ui/primitives";

/** Where the bank sends the seller back: the outcome of the payment, then on to the dashboard. */
export default function PaymentResult() {
  const params = useSearchParams();
  const qc = useQueryClient();
  const ok = params.get("status") === "success";
  const id = params.get("id");
  const { data, isLoading } = useQuery({ queryKey: ["payment", id], queryFn: () => api<any>(`/payments/${id}`), enabled: !!id, retry: false });
  useEffect(() => {
    if (ok) { qc.invalidateQueries({ queryKey: ["subscription"] }); qc.invalidateQueries({ queryKey: ["me"] }); }
  }, [ok, qc]);
  const paid = data ? data.status === "paid" : ok;

  const rows: [string, React.ReactNode][] = data ? [
    ["پلن", data.plan ? `${data.plan.name} (${faNum(data.plan.duration_months)} ماهه)` : "—"],
    ["مبلغ", toman(data.amount_toman)],
    ["درگاه", data.bank_label || data.bank],
    ...(data.reference_number ? [["کد پیگیری بانک", <span key="r" dir="ltr" className="tnum break-all">{faDigits(data.reference_number)}</span>] as [string, React.ReactNode]] : []),
    ...(data.tracking_code ? [["شمارهٔ تراکنش", <span key="t" dir="ltr" className="tnum break-all">{faDigits(data.tracking_code)}</span>] as [string, React.ReactNode]] : []),
    ...(paid && data.subscription ? [["اعتبار اشتراک", `تا ${jDate(data.subscription.ends_at)}`] as [string, React.ReactNode]] : []),
    ["زمان", jDateTime(data.paid_at || data.created_at)],
  ] : [];

  return (
    <div className="min-h-dvh grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo /></div>
        <Card strong className="p-6 sm:p-8 text-center">
          <span className={cn("mx-auto size-16 rounded-full grid place-items-center", paid ? "bg-success/12 text-success" : "bg-danger/12 text-danger")}>
            {paid ? <CheckCircle2 className="size-9" /> : <XCircle className="size-9" />}
          </span>
          <h1 className="mt-4 text-[22px] font-black">{paid ? "پرداخت موفق بود" : "پرداخت انجام نشد"}</h1>
          <p className="mt-1.5 text-muted text-[14px]">
            {paid ? "اشتراک شما فعال شد و همهٔ امکانات پلن باز است."
              : "مبلغی برداشت نشده یا اگر از حسابتان کم شده، طبق قانون بانک تا ۷۲ ساعت به حسابتان برمی‌گردد."}
          </p>

          {id && (isLoading ? <Skeleton className="h-40 mt-6 rounded-2xl" /> : rows.length > 0 && (
            <dl className="mt-6 rounded-2xl bg-subtle p-4 text-[13px] text-start space-y-2.5">
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3"><dt className="text-muted shrink-0 whitespace-nowrap">{k}</dt><dd className="font-bold text-end min-w-0">{v}</dd></div>
              ))}
            </dl>
          ))}
          {!paid && data?.message && <p className="mt-3 text-[12px] text-muted">پیام بانک: {data.message}</p>}

          <div className="mt-6 flex flex-col gap-2">
            <Link href="/app"><Button size="lg" className="w-full" icon={<LayoutDashboard className="size-4" />}>رفتن به داشبورد</Button></Link>
            {!paid && <Link href="/app/billing"><Button size="lg" variant="secondary" className="w-full" icon={<RotateCcw className="size-4" />}>دوباره امتحان کنید</Button></Link>}
          </div>
        </Card>
      </div>
    </div>
  );
}
