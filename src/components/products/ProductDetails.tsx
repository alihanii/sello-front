"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button, Card, Field, Input, NumberInput, Textarea, FormActions } from "@/components/ui/primitives";
import { CategoryInput } from "./CategoryInput";
import { IMAGE_ORDER_HINT, ImageUploader } from "./ImageUploader";
import { VIDEO_HINT, VideoUploader } from "./VideoUploader";

export type Details = { images: string[]; title: string; sku: string; category: string; brand: string; tags: string[]; price: number; stock_qty: number; description: string; attributes: Record<string, string>; video_url?: string };
export const EMPTY_DETAILS: Details = { images: [], title: "", sku: "", category: "", brand: "", tags: [], price: 0, stock_qty: 0, description: "", attributes: {}, video_url: "" };

/** The whole product form: photos and details, nothing else. Used for manual add and for editing. */
export function ProductDetails({ storeId, initial, onSave, saving, saveLabel = "ذخیره" }: {
  storeId: number; initial: Details; onSave: (d: Details) => void; saving?: boolean; saveLabel?: string;
}) {
  const [d, setD] = useState<Details>(initial);
  // Typed as text ("زمستانه، اورسایز"), saved as a list.
  const [tagsText, setTagsText] = useState((initial.tags ?? []).join("، "));
  const [rows, setRows] = useState<[string, string][]>(Object.entries(initial.attributes ?? {}).map(([k, v]) => [k, String(v)]));
  const set = <K extends keyof Details>(k: K, v: Details[K]) => setD({ ...d, [k]: v });
  const setRow = (i: number, j: 0 | 1, v: string) => setRows(rows.map((r, n) => (n === i ? (j ? [r[0], v] : [v, r[1]]) : r)));
  const tags = [...new Set(tagsText.split(/[،,#\n]/).map((t) => t.trim()).filter(Boolean))].slice(0, 20);
  const submit = () => onSave({ ...d, tags, attributes: Object.fromEntries(rows.filter(([k]) => k.trim()).map(([k, v]) => [k.trim(), v.trim()])) });

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
      <Card className="p-5 space-y-4">
        <Field label="عکس‌ها" tip={IMAGE_ORDER_HINT}>
          <ImageUploader storeId={storeId} value={d.images} onChange={(v) => set("images", v)} hint={false} />
        </Field>
        <Field label="ویدیو" tip={VIDEO_HINT}>
          <VideoUploader storeId={storeId} value={d.video_url ?? ""} onChange={(v) => set("video_url", v)} />
        </Field>
        <Field label="نام محصول"><Input value={d.title} onChange={(e) => set("title", e.target.value)} required maxLength={300} /></Field>
        <Field label="کد محصول" tip="کوتاه و یکتا، مثل H12. اگر خالی بماند، موقع ساخت محصول از کدی که در توضیحات نوشته‌ای (مثل «کد: H12») و اگر نبود از شمارهٔ محصول پر می‌شود. کد محصول در خط اول توضیحات هم نوشته می‌شود تا در پست کانال دیده شود؛ مشتری با فرستادن همین کد در چت سفارش می‌دهد و دستیار دقیقاً همین محصول را پیدا می‌کند.">
          <Input dir="ltr" className="text-left w-48" maxLength={80} placeholder="خودکار" value={d.sku ?? ""} onChange={(e) => set("sku", e.target.value.trim())} />
        </Field>
        <Field label="دسته‌بندی" tip="از دسته‌های قبلی انتخاب کن یا یک دستهٔ تازه بنویس.">
          <CategoryInput storeId={storeId} value={d.category ?? ""} onChange={(v) => set("category", v)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="برند" tip="فقط اگر برند مشخصی دارد.">
            <Input maxLength={120} placeholder="مثلاً ال‌سی‌من" value={d.brand ?? ""} onChange={(e) => set("brand", e.target.value)} />
          </Field>
          <Field label="برچسب‌ها" tip="با ویرگول جدا کن. دستیار چت در جستجوی محصول از این‌ها کمک می‌گیرد.">
            <Input placeholder="مثلاً زمستانه، اورسایز" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="قیمت (تومان)"><NumberInput value={d.price} onChange={(v) => set("price", v)} /></Field>
          <Field label="موجودی"><NumberInput value={d.stock_qty} grouping={false} onChange={(v) => set("stock_qty", v)} /></Field>
        </div>
        <Field label="توضیحات"><Textarea rows={6} value={d.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <Field label="جزئیات" tip="مثل جنس، رنگ، سایز">
          <div className="space-y-2">
            {rows.map(([k, v], i) => (
              <div key={i} className="flex items-center gap-2">
                <Input className="w-32" placeholder="مثلاً جنس" value={k} onChange={(e) => setRow(i, 0, e.target.value)} />
                <Input placeholder="مثلاً نخ" value={v} onChange={(e) => setRow(i, 1, e.target.value)} />
                <Button type="button" variant="ghost" size="sm" aria-label="حذف" onClick={() => setRows(rows.filter((_, n) => n !== i))}><X className="size-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" icon={<Plus className="size-4" />} onClick={() => setRows([...rows, ["", ""]])}>افزودن</Button>
          </div>
        </Field>
      </Card>
      <FormActions><Button type="submit" size="lg" loading={saving} disabled={!d.title.trim()}>{saveLabel}</Button></FormActions>
    </form>
  );
}
