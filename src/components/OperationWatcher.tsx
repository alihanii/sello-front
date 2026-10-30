"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { StepTimeline } from "@/components/ui/timeline";
import { StatusChip } from "@/components/ui/status";
import { Button, Card } from "@/components/ui/primitives";

/** Live view of one operation: status, current step, steps, and the error with its action. */
export function OperationWatcher({ opId, storeId, onDone }: { opId: number; storeId: number; onDone?: (op: any) => void }) {
  const { data: op } = useQuery({
    queryKey: ["operation", opId],
    queryFn: async () => {
      const o = await api(`/operations/${opId}`);
      if (["succeeded", "failed", "partial"].includes(o.status)) onDone?.(o);
      return o;
    },
    refetchInterval: (q) => (q.state.data && ["succeeded", "failed", "partial"].includes(q.state.data.status) ? false : 1200),
  });
  if (!op) return null;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="font-bold">{op.title_fa}</div>
          {op.current_step && <div className="text-[13px] text-muted">{op.current_step}…</div>}
        </div>
        <StatusChip status={op.status} kind="op" />
      </div>
      {op.error_message_fa && (
        <div className="rounded-xl bg-danger/8 text-danger p-3 text-[14px] mb-4 flex flex-wrap items-center justify-between gap-2">
          <span>{op.error_message_fa}</span>
          {op.suggested_action?.label && (
            <Link href={op.suggested_action.type === "reconnect" ? `/app/s/${storeId}/channels` : op.suggested_action.type === "upgrade" ? "/app/billing" : `/app/s/${storeId}/activity/${op.id}`}>
              <Button size="sm" variant="danger">{op.suggested_action.label}</Button>
            </Link>
          )}
        </div>
      )}
      <StepTimeline steps={op.steps} />
    </Card>
  );
}
