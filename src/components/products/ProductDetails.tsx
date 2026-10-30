"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button, Card, Field, Input, NumberInput, Textarea } from "@/components/ui/primitives";
import { ImageUploader } from "./ImageUploader";

export type Details = { images: string[]; title: string; price: number; stock_qty: number; description: string; attributes: Record<string, string> };
export const EMPTY_DETAILS: Details = { images: [], title: "", price: 0, stock_qty: 0, description: "", attributes: {} };

/** The whole product form: photos and details, nothing else. Used for manual add and for editing. */
export function ProductDetails({ storeId, initial, onSave, saving, saveLabel = "ذخیره" }: {
  storeId: number; initial: Details; onSave: (d: Details) => void; saving?: boolean; saveLabel?: string;
}) {
  const [d, setD] = useState<Details>(initial);
  const [rows, setRows] = useState<[string, string][]>(Object.entries(initial.attributes ?? {}).map(([k, v]) => [k, String(v)]));
  const set = <K extends keyof Details>(k: K, v: Details[K]) => setD({ ...d, [k]: v });
  const setRow = (i: number, j: 0 | 1, v: string) => setRows(rows.map((r, n) => (n === i ? (j ? [r[0], v] : [v, r[1]]) : r)));
  const submit = () => onSave({ ...d, attributes: Object.fromEntries(rows.filter(([k]) => k.trim()).map(([k, v]) => [k.trim(), v.trim()])) });

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4 max-w-2xl">
      <Card className="p-5 space-y-4">
        <Field label="عکس‌ها" hint="عکس اول، عکس اصلی محصول است.">
          <ImageUploader storeId={storeId} value={d.images} onChange={(v) => set("images", v)} />
        </Field>
        <Field label="نام محصول"><Input value={d.title} onChange={(e) => set("title", e.target.value)} required maxLength={300} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="قیمت (تومان)"><NumberInput value={d.price} onChange={(v) => set("price", v)} /></Field>
          <Field label="موجودی"><NumberInput value={d.stock_qty} grouping={false} onChange={(v) => set("stock_qty", v)} /></Field>
        </div>
        <Field label="توضیحات"><Textarea rows={6} value={d.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <Field label="جزئیات" hint="مثل جنس، رنگ، سایز">
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
      <Button type="submit" size="lg" className="w-full" loading={saving} disabled={!d.title.trim()}>{saveLabel}</Button>
    </form>
  );
}
