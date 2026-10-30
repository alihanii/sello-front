"use client";

import { useQuery } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import { faNum } from "@/lib/format";
import { ImageUploader } from "@/components/products/ImageUploader";

export type StyleValue = { images: string[]; productIds: number[] };
export const NO_STYLE: StyleValue = { images: [], productIds: [] };
const MAX = 3;

/** Photos whose look (background, light, framing) the AI photo should copy: uploads and/or existing products. */
export function StyleSamples({ storeId, value, onChange, excludeId }: { storeId: number; value: StyleValue; onChange: (v: StyleValue) => void; excludeId?: number }) {
  const { data } = useQuery({ queryKey: ["products", storeId, "style-samples"], queryFn: () => api(`/stores/${storeId}/products?size=24`) });
  const products = (data?.items ?? []).filter((p: any) => p.id !== excludeId && p.images?.length);
  const used = value.images.length + value.productIds.length;
  const toggle = (id: number) => onChange({ ...value, productIds: value.productIds.includes(id)
    ? value.productIds.filter((x) => x !== id) : used < MAX ? [...value.productIds, id] : value.productIds });
  return (
    <div className="space-y-2 rounded-xl bg-subtle/60 p-3">
      <div className="text-[13px] font-semibold">نمونهٔ سبک عکس (اختیاری، تا {faNum(MAX)} عکس)</div>
      <div className="text-[12px] text-muted leading-5">پس‌زمینه، نور و کادرِ عکس جدید شبیه این نمونه‌ها می‌شود. اگر چیزی انتخاب نکنی، از عکس محصولات قبلی فروشگاهت استفاده می‌شود.</div>
      <ImageUploader storeId={storeId} value={value.images} max={MAX - value.productIds.length} onChange={(images) => onChange({ ...value, images })} />
      {products.length > 0 && (
        <>
          <div className="text-[12px] text-muted">یا از محصولات خودت انتخاب کن:</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {products.map((p: any) => (
              <button key={p.id} type="button" onClick={() => toggle(p.id)} title={p.title}
                className={`shrink-0 size-16 rounded-lg overflow-hidden border-2 cursor-pointer ${value.productIds.includes(p.id) ? "border-ai" : "border-transparent opacity-80"}`}>
                <img src={mediaUrl(p.images[0].url)} alt={p.title} className="size-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
