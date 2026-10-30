"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Inbox, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago, faDigits, faNum, toman } from "@/lib/format";
import { Button, Card, CardHeader, Chip, EmptyState, PageHeader } from "@/components/ui/primitives";

export default function Requests() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-requests"], queryFn: () => api<any[]>("/admin/plan-requests") });
  const { data: payments = [] } = useQuery({ queryKey: ["admin-payments"], queryFn: () => api<any[]>("/admin/payments") });
  const decide = useMutation({
    mutationFn: ({ id, approve }: any) => api(`/admin/plan-requests/${id}`, { method: "POST", json: { approve } }),
    onSuccess: (_, v: any) => { toast.success(v.approve ? "پلن فعال شد" : "رد شد"); qc.invalidateQueries({ queryKey: ["admin-requests"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
  return (
    <>
      <PageHeader title="خریدها" subtitle="درخواست‌های خرید دستی و پرداخت‌های آنلاین" />
      <Card strong>
        {data.length === 0 ? <EmptyState icon={<Inbox className="size-6" />} title="درخواستی در انتظار نیست" /> : (
          <ul className="divide-y divide-[var(--glass-edge)]">
            {data.map((r) => (
              <li key={r.id} className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-48">
                  <Link href={`/admin/users/${r.user.id}`} className="font-semibold hover:text-primary">{r.user.name || faDigits(r.user.phone)}</Link>
                  <div className="text-[13px] text-muted">{r.plan.name} · {faNum(r.plan.duration_months)} ماهه · <span className="tnum">{toman(r.plan.price_toman)}</span> · {ago(r.created_at)}</div>
                </div>
                <Button size="sm" icon={<Check className="size-4" />} loading={decide.isPending} onClick={() => decide.mutate({ id: r.id, approve: true })}>تأیید و فعال‌سازی</Button>
                <Button size="sm" variant="ghost" icon={<X className="size-4" />} onClick={() => decide.mutate({ id: r.id, approve: false })}>رد</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card strong className="mt-6">
        <CardHeader title="پرداخت‌های آنلاین" subtitle="پرداخت موفق، پلن را خودکار فعال می‌کند." />
        {payments.length === 0 ? <EmptyState icon={<Inbox className="size-6" />} title="هنوز پرداختی ثبت نشده" /> : (
          <ul className="divide-y divide-[var(--glass-edge)]">
            {payments.map((p) => (
              <li key={p.id} className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-48">
                  <Link href={`/admin/users/${p.user.id}`} className="font-semibold hover:text-primary">{p.user.name || faDigits(p.user.phone)}</Link>
                  <div className="text-[13px] text-muted">{p.plan} · <span className="tnum">{toman(p.amount_toman)}</span> · {p.bank_type} · {ago(p.created_at)}
                    {p.tracking_code && <> · کد پیگیری <span className="tnum">{faDigits(p.tracking_code)}</span></>}</div>
                  {p.status === "failed" && p.message && <div className="text-[12px] text-danger mt-1 line-clamp-2">{p.message}</div>}
                </div>
                <Chip tone={p.status === "paid" ? "success" : p.status === "failed" ? "danger" : "warning"}>
                  {p.status === "paid" ? "پرداخت‌شده" : p.status === "failed" ? "ناموفق" : "در انتظار بانک"}
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
