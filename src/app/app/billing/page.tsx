"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { faNum, jDate } from "@/lib/format";
import { PlanCards } from "@/components/plans/PlanCards";
import { Button, Card, Chip, PageHeader, Skeleton } from "@/components/ui/primitives";

const LIMIT_LABELS: Record<string, string> = {
  max_stores: "فروشگاه", max_channels: "کانال", max_products: "محصول", monthly_publishes: "انتشار در ماه",
  monthly_ai_credits: "اعتبار AI در ماه",
};

/** Sends the browser to the bank: a plain redirect for GET gateways, an auto-submitted form for POST ones. */
function goToBank(g: { url: string; method: string; params: Record<string, string> }) {
  if ((g.method || "GET").toUpperCase() === "GET") {
    const u = new URL(g.url);
    Object.entries(g.params || {}).forEach(([k, v]) => u.searchParams.set(k, String(v)));
    window.location.href = u.toString();
    return;
  }
  const f = document.createElement("form");
  f.method = "POST";
  f.action = g.url;
  Object.entries(g.params || {}).forEach(([k, v]) => {
    const i = document.createElement("input");
    i.type = "hidden"; i.name = k; i.value = String(v);
    f.appendChild(i);
  });
  document.body.appendChild(f);
  f.submit();
}

export default function Billing() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: plans } = useQuery({ queryKey: ["plans"], queryFn: () => api<any[]>("/plans") });
  const { data: sub } = useQuery({ queryKey: ["subscription"], queryFn: () => api("/me/subscription") });
  const params = useSearchParams();
  const { data: payCfg } = useQuery({ queryKey: ["payments-config"], queryFn: () => api("/payments/config") });
  useEffect(() => {
    const r = params.get("payment");
    if (!r) return;
    if (r === "success") toast.success("پرداخت موفق بود و اشتراک فعال شد.");
    else toast.error("پرداخت انجام نشد یا لغو شد. اگر مبلغی کم شده، طبق قانون بانک ظرف ۷۲ ساعت برمی‌گردد.");
    qc.invalidateQueries({ queryKey: ["subscription"] });
    router.replace("/app/billing");
  }, [params, qc, router]);
  const pay = useMutation({
    mutationFn: (plan: any) => api("/payments/start", { method: "POST", json: { plan_id: plan.id } }),
    onSuccess: (g: any) => goToBank(g),
    onError: (e: any) => toast.error(e.message),
  });
  const request = useMutation({
    mutationFn: (plan: any) => api("/plan-requests", { method: "POST", json: { plan_id: plan.id } }),
    onSuccess: (r) => { toast.success(r.message); qc.invalidateQueries({ queryKey: ["subscription"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" icon={<ArrowRight className="size-4" />} onClick={() => router.back()}>بازگشت</Button>
      <PageHeader title="پلن و اشتراک" />
      <Card className="p-6 mb-10 flex flex-wrap gap-6 items-center justify-between">
        {sub ? (
          <>
            <div>
              <div className="text-muted text-[13px]">پلن فعلی</div>
              <div className="text-[20px] font-extrabold">
                {sub.subscription ? `${sub.subscription.plan.name} (${faNum(sub.subscription.plan.duration_months)} ماهه)` : "رایگان / آزمایشی"}
              </div>
              {sub.subscription && <div className="text-muted text-[13px]">تا {jDate(sub.subscription.ends_at)}</div>}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(LIMIT_LABELS).map(([k, l]) => (
                <Chip key={k}>{sub.limits[k] >= 100000 ? "نامحدود" : faNum(sub.limits[k])} {l}</Chip>
              ))}
            </div>
            {sub.pending_request && <Chip tone="warning" icon={<Clock className="size-3" />}>درخواست خرید شما در حال بررسی است</Chip>}
          </>
        ) : <Skeleton className="h-16 w-full" />}
      </Card>
      {plans ? (
        <PlanCards plans={plans} onSelect={(p) => (payCfg?.enabled ? pay.mutate(p) : request.mutate(p))}
          loadingId={payCfg?.enabled ? (pay.isPending || pay.isSuccess ? pay.variables?.id : undefined) : request.variables?.id}
          currentPlanId={sub?.subscription?.plan?.id} />
      ) : <Skeleton className="h-96" />}
      <p className="text-center text-muted text-[13px] mt-8">
        {payCfg?.enabled ? `پرداخت امن از طریق درگاه ${payCfg.label}؛ اشتراک بلافاصله بعد از پرداخت فعال می‌شود.` : "پس از ثبت درخواست، پلن توسط پشتیبانی فعال می‌شود."}
      </p>
    </div>
  );
}
