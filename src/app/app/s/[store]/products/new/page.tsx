"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { PenLine, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useStoreId } from "@/lib/hooks";
import { EMPTY_DETAILS, ProductDetails } from "@/components/products/ProductDetails";
import { ImageUploader } from "@/components/products/ImageUploader";
import { Button, Card, Field, PageHeader, Spinner, Tabs, Textarea } from "@/components/ui/primitives";

type Mode = "ai" | "manual";

export default function NewProduct() {
  const sid = useStoreId();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "manual" ? "manual" : "ai");
  return (
    <>
      <PageHeader title="افزودن محصول" />
      <div className="mb-4 max-w-2xl">
        <Tabs value={mode} onChange={setMode} items={[
          { value: "ai", label: <span className="flex items-center gap-1.5"><Sparkles className="size-4" />ساخت با AI</span> },
          { value: "manual", label: <span className="flex items-center gap-1.5"><PenLine className="size-4" />دستی</span> },
        ]} />
      </div>
      {mode === "ai" ? <AiCreate storeId={sid} /> : <ManualCreate storeId={sid} />}
    </>
  );
}

function ManualCreate({ storeId }: { storeId: number }) {
  const router = useRouter();
  const create = useMutation({
    mutationFn: (d: any) => api(`/stores/${storeId}/products`, { method: "POST", json: d }),
    onSuccess: (p) => { toast.success("محصول ذخیره شد"); router.push(`/app/s/${storeId}/products/${p.id}`); },
    onError: (e: any) => toast.error(e.message),
  });
  return <ProductDetails storeId={storeId} initial={EMPTY_DETAILS} onSave={(d) => create.mutate(d)} saving={create.isPending} />;
}

/** Description + raw photo in, a finished product (with a suitable photo when AI images are available) out. */
function AiCreate({ storeId }: { storeId: number }) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [opId, setOpId] = useState<number | null>(null);
  const [kind, setKind] = useState<"product" | "design">("product");
  const { data: status } = useQuery({ queryKey: ["ai-status"], queryFn: () => api("/ai/status") });
  const canImage = !!status?.image_edit;
  // AI's first guess for the main photo; the seller only changes it when it's wrong.
  const main = images[0];
  useEffect(() => {
    if (!main || !canImage) return;
    setKind("product");
    let live = true;
    api<{ kind: "product" | "design" }>(`/stores/${storeId}/photo-kind`, { method: "POST", json: { url: main } })
      .then((r) => live && setKind(r.kind)).catch(() => {});
    return () => { live = false; };
  }, [main, canImage, storeId]);
  const go = useMutation({
    mutationFn: () => api<any>(`/stores/${storeId}/ai-products`, { method: "POST", json: { images, note, clean_image: canImage, photo_kind: kind } }),
    onSuccess: (op) => setOpId(op.id),
    onError: () => toast.error("ساخت محصول شروع نشد؛ دوباره امتحان کن."),
  });
  const { data: op } = useQuery({
    queryKey: ["operation", opId], enabled: !!opId, queryFn: () => api(`/operations/${opId}`),
    refetchInterval: (q) => (q.state.data && !["queued", "running"].includes(q.state.data.status) ? false : 1500),
  });
  useEffect(() => {
    if (!op || ["queued", "running"].includes(op.status)) return;
    if (op.result?.product_id) router.push(`/app/s/${storeId}/products/${op.result.product_id}`);
    else { toast.error("ساخت محصول با AI انجام نشد؛ چند دقیقه بعد دوباره امتحان کن یا دستی اضافه کن."); setOpId(null); }
  }, [op, router, storeId]);

  if (status && !status.available) {
    return <Card className="p-6 max-w-2xl text-[14px] text-muted">ساخت با AI فعلاً در دسترس نیست. از حالت «دستی» استفاده کن.</Card>;
  }
  if (opId) {
    return (
      <Card className="p-10 max-w-2xl text-center">
        <Spinner className="size-8 mx-auto text-ai" />
        <div className="font-semibold mt-4">در حال ساخت محصول…</div>
        <div className="text-[13px] text-muted mt-1">چند ثانیه صبر کن؛ بعدش می‌توانی همه‌چیز را ویرایش کنی.</div>
      </Card>
    );
  }
  return (
    <div className="space-y-4 max-w-2xl">
      <Card className="p-5 space-y-4">
        <Field label="عکس محصول" hint="عکس خام کافی است؛ با گوشی هم بگیری خوب است.">
          <ImageUploader storeId={storeId} value={images} onChange={setImages} max={5} />
        </Field>
        {main && canImage && (
          <div className="grid grid-cols-2 gap-2 text-[13px]">
            {([["product", "این عکس محصولمه؛ مرتبش کن"], ["design", "این طرحه؛ عکس محصول رو بساز"]] as const).map(([v, label]) => (
              <button key={v} type="button" onClick={() => setKind(v)}
                className={`rounded-xl border p-3 cursor-pointer text-start ${kind === v ? "border-ai bg-ai/8 font-semibold" : "border-edge text-muted"}`}>{label}</button>
            ))}
          </div>
        )}
        <Field label="توضیح کوتاه">
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلاً: هودی مشکی دورس، سایز L و XL، چاپ رنگی جلو" />
        </Field>
      </Card>
      <Button variant="ai" size="lg" className="w-full" icon={<Sparkles className="size-4" />} loading={go.isPending}
        disabled={!images.length && !note.trim()} onClick={() => go.mutate()}>بساز</Button>
    </div>
  );
}
