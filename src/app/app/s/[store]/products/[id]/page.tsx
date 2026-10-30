"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, RefreshCw, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago, faNum, jDateTime } from "@/lib/format";
import { useChannels, useStoreId } from "@/lib/hooks";
import { OP_TYPES, PLATFORMS } from "@/lib/meta";
import { ProductForm } from "@/components/products/ProductForm";
import { PublishDialog } from "@/components/products/PublishDialog";
import { JsonViewer } from "@/components/ui/timeline";
import { PlatformIcon, PublisherIcon, SourceBadge, StatusChip } from "@/components/ui/status";
import { Button, Card, Chip, EmptyState, Skeleton, Tabs } from "@/components/ui/primitives";

export default function ProductDetail() {
  const sid = useStoreId();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"info" | "channels" | "logs" | "stock" | "source">("info");
  const [publishOpen, setPublishOpen] = useState(false);
  const { data: p } = useQuery({ queryKey: ["product", id], queryFn: () => api(`/products/${id}`), refetchInterval: (q) =>
    q.state.data?.listings?.some((l: any) => ["queued", "publishing"].includes(l.status)) ? 2000 : false });
  const { data: channels = [] } = useChannels(sid);
  const { data: ops } = useQuery({ queryKey: ["operations", sid, "product", id], queryFn: () => api(`/stores/${sid}/operations?product_id=${id}`), enabled: tab === "logs" });
  const { data: inv } = useQuery({ queryKey: ["inventory", id], queryFn: () => api(`/products/${id}/inventory`), enabled: tab === "stock" });

  const save = useMutation({
    mutationFn: (d: any) => api(`/products/${id}`, { method: "PATCH", json: d }),
    onSuccess: (r) => { qc.setQueryData(["product", id], r); toast.success("ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  const publish = useMutation({
    mutationFn: (ids: number[]) => api(`/products/${id}/publish`, { method: "POST", json: { channel_ids: ids } }),
    onSuccess: (r) => { toast.success(`${faNum(r.length)} انتشار در صف قرار گرفت`); setPublishOpen(false); qc.invalidateQueries({ queryKey: ["product", id] }); setTab("channels"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!p) return <Skeleton className="h-[600px]" />;
  const draft = { ...p, images: p.images.map((i: any) => i.url) };

  return (
    <>
      <Link href={`/app/s/${sid}/products`} className="text-muted text-[13px] inline-flex items-center gap-1 hover:text-fg mb-3"><ArrowRight className="size-4" />محصولات</Link>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[22px] font-extrabold">{p.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[13px] text-muted">
            <SourceBadge source={p.source} />
            {p.status === "draft" && <Chip tone="warning">پیش‌نویس</Chip>}
            <span className="tnum">#{faNum(p.id)}</span> · <span>ساخته‌شده {ago(p.created_at)} توسط {p.created_by === "ai" ? "AI" : p.created_by === "crawler" ? "کرالر" : "کاربر"}</span>
          </div>
        </div>
        <Button icon={<Send className="size-4" />} onClick={() => setPublishOpen(true)}>انتشار در کانال‌ها</Button>
      </div>
      <div className="mb-4 overflow-x-auto">
        <Tabs value={tab} onChange={setTab} items={[
          { value: "info", label: "اطلاعات" }, { value: "channels", label: `کانال‌ها (${faNum(p.listings.length)})` },
          { value: "logs", label: "لاگ انتشار" }, { value: "stock", label: "موجودی" }, { value: "source", label: "منبع" },
        ]} />
      </div>

      {tab === "info" && (
        <ProductForm key={p.updated_at} storeId={sid} initial={draft} onSubmit={(d) => save.mutate(d)} submitting={save.isPending}
          fieldSources={p.source === "ai" ? p.source_ref?.field_sources : undefined} />
      )}

      {tab === "channels" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.length === 0 && <Card className="md:col-span-2"><EmptyState icon={<Send className="size-6" />} title="کانالی وصل نیست"
            action={<Link href={`/app/s/${sid}/channels`}><Button>اتصال کانال</Button></Link>} /></Card>}
          {channels.map((ch: any) => {
            const l = p.listings.find((x: any) => x.channel_id === ch.id);
            return (
              <Card key={ch.id} className="p-5">
                <div className="flex items-center gap-3">
                  <PlatformIcon platform={ch.platform} size={36} />
                  <div className="flex-1">
                    <div className="font-bold">{ch.display_name}</div>
                    <div className="text-muted text-[12px]">{PLATFORMS[ch.platform]?.label}</div>
                  </div>
                  <StatusChip status={l?.status ?? "not_published"} />
                </div>
                {l && (
                  <dl className="grid grid-cols-2 gap-y-2 text-[13px] mt-4">
                    <dt className="text-muted">منتشرکننده</dt><dd className="flex items-center gap-1">{l.published_by ? <><PublisherIcon by={l.published_by} />{l.published_by === "user" ? "کاربر" : "AI / اتوماسیون"}</> : "—"}</dd>
                    <dt className="text-muted">تاریخ انتشار</dt><dd>{jDateTime(l.published_at)}</dd>
                    <dt className="text-muted">شناسه در پلتفرم</dt><dd className="tnum" dir="ltr">{l.remote_id || "—"}</dd>
                  </dl>
                )}
                {l?.last_error_fa && <p className="mt-3 text-[13px] text-danger bg-danger/8 rounded-xl p-3">{l.last_error_fa}</p>}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant={l?.status === "published" ? "secondary" : "primary"} loading={publish.isPending}
                    icon={l?.status === "published" || l?.status === "out_of_sync" ? <RefreshCw className="size-4" /> : <Send className="size-4" />}
                    disabled={l && ["queued", "publishing"].includes(l.status)} onClick={() => publish.mutate([ch.id])}>
                    {l?.status === "published" || l?.status === "out_of_sync" ? "به‌روزرسانی" : l?.status === "failed" ? "تلاش دوباره" : "انتشار"}
                  </Button>
                  {l?.remote_url && <a href={l.remote_url} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost" icon={<ExternalLink className="size-4" />}>مشاهده</Button></a>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "logs" && (
        <Card>
          {!ops ? <Skeleton className="h-40 m-5" /> : ops.items.length === 0 ? <EmptyState icon={<Send className="size-6" />} title="هنوز عملیاتی برای این محصول ثبت نشده" /> : (
            <ul className="divide-y divide-[var(--glass-edge)]">
              {ops.items.map((o: any) => (
                <li key={o.id}>
                  <Link href={`/app/s/${sid}/activity/${o.id}`} className="flex flex-wrap items-center gap-3 p-4 hover:bg-subtle/60">
                    <StatusChip status={o.status} kind="op" />
                    <span className="font-semibold text-[14px] flex-1">{o.title_fa}</span>
                    {o.error_message_fa && <span className="text-danger text-[13px] w-full sm:w-auto">{o.error_message_fa}</span>}
                    <span className="text-muted text-[12px]">{OP_TYPES[o.type]} · {o.trigger === "automation" ? "اتوماسیون" : o.trigger === "retry" ? "تلاش دوباره" : "کاربر"} · {ago(o.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "stock" && (
        <Card className="p-5">
          <div className="text-[14px] mb-4">موجودی فعلی: <b className="tnum">{faNum(p.stock_qty)}</b></div>
          <table className="w-full text-[14px]">
            <thead className="text-muted text-[12px]"><tr><th className="text-start p-2">تاریخ</th><th className="text-start p-2">تغییر</th><th className="text-start p-2">بعد از تغییر</th><th className="text-start p-2">دلیل</th></tr></thead>
            <tbody>
              {inv?.map((m: any) => (
                <tr key={m.id} className="border-t border-edge">
                  <td className="p-2 text-muted">{jDateTime(m.created_at)}</td>
                  <td className={`p-2 tnum ${m.delta > 0 ? "text-success" : "text-danger"}`} dir="ltr">{m.delta > 0 ? "+" : ""}{faNum(m.delta)}</td>
                  <td className="p-2 tnum">{faNum(m.qty_after)}</td>
                  <td className="p-2">{{ manual: "دستی", crawl_sync: "همگام‌سازی کرال", channel_sync: "همگام‌سازی کانال" }[m.reason as string] ?? m.reason} {m.note && `· ${m.note}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "source" && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2"><SourceBadge source={p.source} />
            {p.source === "ai" && <span className="text-[13px] text-muted flex items-center gap-1"><Sparkles className="size-3.5 text-ai" />ساخته‌شده با AI از رفرنس</span>}
            {p.source_ref?.url && <a href={p.source_ref.url} target="_blank" rel="noreferrer" className="text-primary text-[13px] inline-flex items-center gap-1">پست/صفحهٔ اصلی <ExternalLink className="size-3.5" /></a>}
          </div>
          <JsonViewer value={p.source_ref} />
        </Card>
      )}
      <PublishDialog open={publishOpen} onClose={() => setPublishOpen(false)} channels={channels} loading={publish.isPending} onConfirm={(ids: number[]) => publish.mutate(ids)} />
    </>
  );
}
