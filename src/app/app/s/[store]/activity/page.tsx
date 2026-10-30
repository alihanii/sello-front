"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ago, faNum, jDateTime } from "@/lib/format";
import { useChannels, useStoreId } from "@/lib/hooks";
import { OP_STATUS, OP_TYPES } from "@/lib/meta";
import { PlatformIcon, StatusChip } from "@/components/ui/status";
import { Button, Card, EmptyState, PageHeader, Select, Skeleton, cn } from "@/components/ui/primitives";

export default function ActivityPage() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const sp = useSearchParams();
  const [type, setType] = useState("");
  const [status, setStatus] = useState(sp.get("status") ?? "");
  const [channel, setChannel] = useState("");
  const [page, setPage] = useState(1);
  const { data: channels = [] } = useChannels(sid);
  const params = new URLSearchParams({ type, status: status === "failed" ? "failed,partial" : status, page: String(page), size: "30" });
  if (channel) params.set("channel_id", channel);
  const { data } = useQuery({ queryKey: ["operations", sid, params.toString()], queryFn: () => api(`/stores/${sid}/operations?${params}`) });
  const seen = useMutation({ mutationFn: () => api(`/stores/${sid}/operations/mark-seen`, { method: "POST" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["ops-summary", sid] }) });
  useEffect(() => { seen.mutate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHeader title="فعالیت‌ها و لاگ" subtitle="هر کاری که Sello انجام می‌دهد: اتصال، انتشار، کرال، ساخت با AI؛ با وضعیت زنده و دلیل هر خطا." />
      <Card className="p-3 mb-4 flex flex-wrap gap-2">
        <Select className="w-auto" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="نوع">
          <option value="">همهٔ انواع</option>{Object.entries(OP_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select className="w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="وضعیت">
          <option value="">همهٔ وضعیت‌ها</option>
          <option value="failed">فقط ناموفق‌ها</option>
          {Object.entries(OP_STATUS).filter(([k]) => k !== "failed").map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
        <Select className="w-auto" value={channel} onChange={(e) => { setChannel(e.target.value); setPage(1); }} aria-label="کانال">
          <option value="">همهٔ کانال‌ها</option>{channels.map((c: any) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
        </Select>
      </Card>
      <Card strong>
        {!data ? <Skeleton className="h-96 m-4" /> : data.items.length === 0 ? <EmptyState icon={<Activity className="size-6" />} title="فعالیتی پیدا نشد" /> : (
          <ul className="divide-y divide-[var(--glass-edge)]">
            {data.items.map((o: any) => {
              const ch = channels.find((c: any) => c.id === o.channel_id);
              return (
                <li key={o.id}>
                  <Link href={`/app/s/${sid}/activity/${o.id}`} className={cn("flex items-start gap-3 p-4 hover:bg-subtle/60 transition", !o.seen && o.status === "failed" && "bg-danger/4")}>
                    <div className="pt-0.5">{ch ? <PlatformIcon platform={ch.platform} size={30} /> : <span className="size-[30px] rounded-lg bg-subtle grid place-items-center"><Activity className="size-4 text-muted" /></span>}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[14px]">{o.title_fa}</span>
                        <StatusChip status={o.status} kind="op" />
                      </div>
                      {o.status === "running" && o.current_step && <div className="text-[13px] text-primary mt-0.5">{o.current_step}…</div>}
                      {o.error_message_fa && <div className="text-[13px] text-danger mt-0.5">{o.error_message_fa}</div>}
                      <div className="text-[12px] text-muted mt-1">
                        {OP_TYPES[o.type]} · {o.actor === "ai" ? "توسط AI/خودکار" : "توسط کاربر"}{o.trigger === "retry" && ` · تلاش ${faNum(o.attempt)}`} · <span title={jDateTime(o.created_at)}>{ago(o.created_at)}</span>
                      </div>
                    </div>
                    <ChevronLeft className="size-4 text-muted mt-2" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {data && data.total > 30 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>قبلی</Button>
          <span className="text-[13px] text-muted tnum">{faNum(page)} / {faNum(Math.ceil(data.total / 30))}</span>
          <Button variant="secondary" size="sm" disabled={page * 30 >= data.total} onClick={() => setPage(page + 1)}>بعدی</Button>
        </div>
      )}
    </>
  );
}
