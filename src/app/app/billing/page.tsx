"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { faNum, jDate } from "@/lib/format";
import { PlanCards } from "@/components/plans/PlanCards";
import { Button, Card, Chip, PageHeader, Skeleton } from "@/components/ui/primitives";

const LIMIT_LABELS: Record<string, string> = {
  max_stores: "فروشگاه", max_channels: "کانال", max_products: "محصول", monthly_publishes: "انتشار در ماه",
  monthly_ai_credits: "اعتبار AI در ماه",
};

export default function Billing() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: plans } = useQuery({ queryKey: ["plans"], queryFn: () => api<any[]>("/plans") });
  const { data: sub } = useQuery({ queryKey: ["subscription"], queryFn: () => api("/me/subscription") });
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
        <PlanCards plans={plans} onSelect={(p) => request.mutate(p)} loadingId={request.variables?.id}
          currentPlanId={sub?.subscription?.plan?.id} />
      ) : <Skeleton className="h-96" />}
      <p className="text-center text-muted text-[13px] mt-8">پس از ثبت درخواست، پلن توسط پشتیبانی فعال می‌شود. پرداخت آنلاین به‌زودی اضافه می‌شود.</p>
    </div>
  );
}
