"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { faNum, jDate } from "@/lib/format";
import { PlanCards } from "@/components/plans/PlanCards";
import { Button, Card, Chip, PageHeader, Skeleton, cn } from "@/components/ui/primitives";
import { PlanCardsSkeleton } from "@/components/ui/skeletons";

const COUNTS: [string, string][] = [["max_stores", "فروشگاه"], ["max_channels", "کانال"], ["max_products", "محصول"], ["monthly_publishes", "انتشار در ماه"]];
const UNLIMITED = 100000;

/** This month's use of one AI allowance, as a bar that turns amber near the cap and red at it. */
function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = limit >= UNLIMITED;
  const pct = unlimited || !limit ? (limit ? 0 : 100) : Math.min(100, Math.round((100 * used) / limit));
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="font-semibold">{label}</span>
        <span className="text-muted whitespace-nowrap">{unlimited ? "نامحدود" : `${faNum(used)} از ${faNum(limit)}`}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-subtle overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-danger" : pct >= 80 ? "bg-warning" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

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
      {sub && (sub.status === "expired" || sub.status === "blocked") && (
        <Card className="p-4 mb-4 flex items-start gap-3 border-danger/40 bg-danger/8 text-[14px]">
          <AlertTriangle className="size-5 text-danger shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">{sub.status === "blocked" ? "حساب شما غیرفعال است" : "پلن شما تمام شده"}</div>
            <div className="text-muted mt-0.5">دستیار چت و کارهای هوش مصنوعی خاموش‌اند. {sub.status === "expired" && "با تمدید پلن دوباره روشن می‌شوند."}</div>
          </div>
        </Card>
      )}
      <Card className="p-5 sm:p-6 mb-10">
        {sub ? (
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 items-center">
            <div className="min-w-0">
              <div className="text-muted text-[13px]">پلن فعلی</div>
              <div className="text-[20px] font-extrabold">
                {sub.subscription ? `${sub.subscription.plan.name} (${faNum(sub.subscription.plan.duration_months)} ماهه)` : sub.status === "expired" ? "بدون پلن فعال" : "رایگان / آزمایشی"}
              </div>
              {sub.subscription && <div className="text-muted text-[13px]">تا {jDate(sub.subscription.ends_at)}</div>}
              <div className="flex flex-wrap gap-2 mt-3">
                {COUNTS.map(([k, l]) => <Chip key={k}>{sub.limits[k] >= UNLIMITED ? "نامحدود" : faNum(sub.limits[k])} {l}</Chip>)}
              </div>
              {sub.pending_request && <Chip tone="warning" className="mt-3" icon={<Clock className="size-3" />}>درخواست خرید شما در حال بررسی است</Chip>}
            </div>
            <div className="space-y-4">
              <div className="text-[13px] font-bold text-muted">مصرف این ماه</div>
              <Meter label="جواب AI دستیار چت" used={sub.usage?.chat_messages ?? 0} limit={sub.limits.monthly_chat_messages ?? 0} />
              <Meter label="اعتبار AI (ساخت محصول، کرال، عکس)" used={sub.usage?.ai_credits ?? 0} limit={sub.limits.monthly_ai_credits ?? 0} />
            </div>
          </div>
        ) : <Skeleton className="h-24 w-full" />}
      </Card>
      {plans ? (
        <PlanCards plans={plans} onSelect={(p) => (payCfg?.enabled ? pay.mutate(p) : request.mutate(p))}
          loadingId={pay.isPending || pay.isSuccess ? pay.variables?.id : request.isPending ? request.variables?.id : undefined}
          currentPlanId={sub?.subscription?.plan?.id} pending={!payCfg?.enabled && !!sub?.pending_request} />
      ) : <PlanCardsSkeleton />}
      <p className="text-center text-muted text-[13px] mt-8">
        {payCfg?.enabled ? `پرداخت امن از طریق درگاه ${payCfg.label}؛ اشتراک بلافاصله بعد از پرداخت فعال می‌شود.` : "پس از ثبت درخواست، پلن توسط پشتیبانی فعال می‌شود."}
      </p>
    </div>
  );
}
