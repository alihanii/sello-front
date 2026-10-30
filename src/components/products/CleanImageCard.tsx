"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api, mediaUrl } from "@/lib/api";
import { OperationWatcher } from "@/components/OperationWatcher";
import { Button, Card, Select } from "@/components/ui/primitives";

const CATEGORIES = [
  { value: "general", label: "کالای عمومی" },
  { value: "flat_clothing", label: "لباس (بدون مدل)" },
  { value: "modeled_clothing", label: "لباس تن مدل (چادر، مانتو، …)" },
  { value: "footwear", label: "کفش" },
];

/** Cleans the main product photo with AI, or generates one when the product has none, in the shop's photo style. */
export function CleanImageCard({ product, storeId, onDone }: { product: any; storeId: number; onDone: () => void }) {
  const qc = useQueryClient();
  const { data: status } = useQuery({ queryKey: ["ai-status"], queryFn: () => api("/ai/status") });
  const [category, setCategory] = useState("general");
  const [opId, setOpId] = useState<number | null>(null);
  const main = product.images?.[0];
  const run = useMutation({
    mutationFn: () => api(`/products/${product.id}/clean-image`, { method: "POST", json: { image_id: main?.id ?? null, category } }),
    onSuccess: (op) => setOpId(op.id),
    onError: (e: any) => toast.error(e.message),
  });
  if (!status?.available) return null;
  return (
    <Card className="p-4 mb-4">
      <div className="flex flex-wrap items-center gap-4">
        {main ? <img src={mediaUrl(main.url)} alt="" className="size-16 rounded-xl object-cover bg-subtle" />
          : <div className="size-16 rounded-xl bg-subtle grid place-items-center"><Wand2 className="size-6 text-muted" /></div>}
        <div className="flex-1 min-w-52">
          <div className="font-semibold text-[14px] flex items-center gap-1.5"><Wand2 className="size-4 text-ai" />{main ? "تمیز کردن عکس اصلی با AI" : "ساخت عکس محصول با AI"}</div>
          <div className="text-[12px] text-muted mt-0.5">
            {status.image_edit
              ? `${main ? "همان محصول، مرتب و وسط کادر؛ عکس فعلی بعد از آن می‌ماند." : "از روی عنوان و توضیحات محصول یک عکس ساخته می‌شود."} سبک عکس از محصولات قبلی فروشگاهت گرفته می‌شود.`
              : status.image_edit_problem}
          </div>
        </div>
        {status.image_edit && (
          <div className="flex gap-2">
            <Select className="h-9 text-[13px]" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="نوع کالا">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
            <Button variant="ai" size="sm" loading={run.isPending} disabled={!!opId && !run.isError} onClick={() => run.mutate()}>{main ? "تمیز کن" : "بساز"}</Button>
          </div>
        )}
      </div>
      {opId && (
        <div className="mt-3">
          <OperationWatcher opId={opId} storeId={storeId} onDone={(o) => { onDone(); qc.invalidateQueries({ queryKey: ["ai-status"] }); if (o.status !== "succeeded") setOpId(null); }} />
        </div>
      )}
    </Card>
  );
}
