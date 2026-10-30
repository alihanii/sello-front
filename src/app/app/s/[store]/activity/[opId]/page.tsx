"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { faNum, jDateTime, ms } from "@/lib/format";
import { useChannels, useStoreId } from "@/lib/hooks";
import { OP_TYPES } from "@/lib/meta";
import { StepTimeline } from "@/components/ui/timeline";
import { PlatformIcon, StatusChip } from "@/components/ui/status";
import { Button, Card, CardHeader, Chip, Skeleton } from "@/components/ui/primitives";

const RESULT: Record<string, { label: string; tone: string }> = {
  created: { label: "محصول ساخته شد", tone: "success" }, updated: { label: "به‌روز شد", tone: "primary" },
  duplicate: { label: "تکراری", tone: "neutral" }, skipped: { label: "رد شد", tone: "neutral" },
  inbox: { label: "صندوق ورودی", tone: "warning" }, failed: { label: "خطا", tone: "danger" },
};

export default function OperationDetail() {
  const sid = useStoreId();
  const router = useRouter();
  const { opId } = useParams<{ opId: string }>();
  const { data: channels = [] } = useChannels(sid);
  const { data: op } = useQuery({
    queryKey: ["operation", Number(opId)], queryFn: () => api(`/operations/${opId}`),
    refetchInterval: (q) => (q.state.data && ["queued", "running"].includes(q.state.data.status) ? 1200 : false),
  });
  const { data: items } = useQuery({ queryKey: ["crawl-items", opId], queryFn: () => api(`/operations/${opId}/crawl-items`), enabled: op?.type === "crawl" });
  const retry = useMutation({
    mutationFn: () => api(`/operations/${opId}/retry`, { method: "POST" }),
    onSuccess: (n) => { toast.success("دوباره در صف قرار گرفت"); router.push(`/app/s/${sid}/activity/${n.id}`); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!op) return <Skeleton className="h-96" />;
  const ch = channels.find((c: any) => c.id === op.channel_id);
  const total = op.steps.reduce((a: number, s: any) => a + s.duration_ms, 0);
  return (
    <>
      <Link href={`/app/s/${sid}/activity`} className="text-muted text-[13px] inline-flex items-center gap-1 hover:text-fg mb-3"><ArrowRight className="size-4" />فعالیت‌ها</Link>
      <Card className="p-5 mb-4">
        <div className="flex flex-wrap items-start gap-4">
          {ch && <PlatformIcon platform={ch.platform} size={44} />}
          <div className="flex-1 min-w-52">
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-[20px] font-extrabold">{op.title_fa}</h1><StatusChip status={op.status} kind="op" /></div>
            <div className="text-[13px] text-muted mt-1 flex flex-wrap gap-x-3">
              <span>{OP_TYPES[op.type]}</span>
              <span>شروع‌کننده: {op.trigger === "automation" ? "اتوماسیون" : op.trigger === "schedule" ? "زمان‌بند" : op.trigger === "retry" ? `تلاش دوباره (${faNum(op.attempt)})` : "کاربر"}</span>
              <span>{jDateTime(op.created_at)}</span>
              <span className="tnum">مدت: {ms(total)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {op.product_id && <Link href={`/app/s/${sid}/products/${op.product_id}`}><Button variant="secondary" size="sm">مشاهدهٔ محصول</Button></Link>}
            {op.result?.remote_url && <a href={op.result.remote_url} target="_blank" rel="noreferrer"><Button variant="secondary" size="sm" icon={<ExternalLink className="size-4" />}>پست منتشرشده</Button></a>}
            {["failed", "partial"].includes(op.status) && op.type !== "connect" && <Button size="sm" icon={<RotateCcw className="size-4" />} loading={retry.isPending} onClick={() => retry.mutate()}>تلاش دوباره</Button>}
          </div>
        </div>
        {op.error_message_fa && (
          <div className="mt-4 rounded-xl bg-danger/8 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-danger font-semibold text-[14px]">{op.status === "partial" ? "نیمه‌موفق" : "دلیل خطا"}: {op.error_message_fa}</div>
              {op.error_code && <div className="text-[12px] text-muted mt-0.5" dir="ltr">code: {op.error_code}</div>}
            </div>
            {op.suggested_action?.type === "reconnect" && <Link href={`/app/s/${sid}/channels`}><Button size="sm" variant="danger">{op.suggested_action.label}</Button></Link>}
            {op.suggested_action?.type === "edit_product" && op.product_id && <Link href={`/app/s/${sid}/products/${op.product_id}`}><Button size="sm" variant="danger">{op.suggested_action.label}</Button></Link>}
            {op.suggested_action?.type === "retry" && <Button size="sm" variant="danger" onClick={() => retry.mutate()}>{op.suggested_action.label}</Button>}
            {["help", "info", "admin_ai"].includes(op.suggested_action?.type) && <Chip tone="warning">{op.suggested_action.label}</Chip>}
          </div>
        )}
      </Card>
      <Card className="mb-4">
        <CardHeader title="مراحل" subtitle="روی هر مرحله بزن تا درخواست و پاسخ کامل را ببینی" />
        <div className="px-5 pb-3"><StepTimeline steps={op.steps} /></div>
      </Card>
      {op.type === "crawl" && items && (
        <Card>
          <CardHeader title="آیتم‌های کرال" subtitle={`${faNum(items.length)} آیتم؛ هر کدام چه شد و چرا`} />
          <ul className="divide-y divide-[var(--glass-edge)]">
            {items.map((it: any) => (
              <li key={it.id} className="p-4 flex flex-wrap items-start gap-3">
                <Chip tone={RESULT[it.result]?.tone}>{RESULT[it.result]?.label ?? it.result}</Chip>
                <div className="flex-1 min-w-52">
                  <div className="text-[14px] font-semibold">{it.extracted?.title || "بدون عنوان"}</div>
                  <div className="text-[12px] text-muted line-clamp-2 whitespace-pre-line">{it.raw?.caption}</div>
                  {it.error_fa && <div className="text-[12px] text-danger mt-1">{it.error_fa}</div>}
                </div>
                <span className="text-[12px] text-muted">{it.extracted?.method === "llm" ? "استخراج با AI" : it.extracted?.method === "structured" ? "دیتای ساخت‌یافته" : "قاعده‌محور"}</span>
                {it.product_id && <Link href={`/app/s/${sid}/products/${it.product_id}`} className="text-primary text-[13px]">محصول</Link>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
