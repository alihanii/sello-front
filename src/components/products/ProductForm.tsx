"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { faNum } from "@/lib/format";
import { Button, Card, CardHeader, Field, Input, Switch, Textarea } from "@/components/ui/primitives";
import { ImageUploader } from "./ImageUploader";

export type ProductDraft = {
  title: string; description: string; price: number; compare_at_price: number; stock_qty: number; sku: string;
  brand: string; category_hint: string; attributes: Record<string, string>; tags: string[]; images: string[];
  status: string; is_golden_sample: boolean;
};

export const emptyDraft: ProductDraft = {
  title: "", description: "", price: 0, compare_at_price: 0, stock_qty: 0, sku: "", brand: "", category_hint: "",
  attributes: {}, tags: [], images: [], status: "ready", is_golden_sample: false,
};

const num = (v: string) => Number(v.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/\D/g, "") || 0);

export function ProductForm({ storeId, initial, onSubmit, submitting, submitLabel = "ذخیره", fieldSources }: {
  storeId: number; initial: ProductDraft; onSubmit: (d: ProductDraft) => void; submitting?: boolean; submitLabel?: string;
  fieldSources?: Record<string, string>;
}) {
  const [d, setD] = useState<ProductDraft>(initial);
  const [tag, setTag] = useState("");
  const [attrKey, setAttrKey] = useState("");
  const [attrVal, setAttrVal] = useState("");
  const set = (k: keyof ProductDraft, v: any) => setD({ ...d, [k]: v });
  const SRC: Record<string, string> = { image: "از عکس", link: "از لینک", style: "از سبک فروشگاه", note: "از توضیح شما", guess: "حدس AI" };
  const src = (k: string) => fieldSources?.[k] && <span className="text-[11px] font-normal text-ai ms-2">({SRC[fieldSources[k]] ?? fieldSources[k]})</span>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(d); }} className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-5 space-y-4">
          <Field label="عکس‌ها"><ImageUploader storeId={storeId} value={d.images} onChange={(v) => set("images", v)} /></Field>
          <Field label={<>عنوان {src("title")}</>}><Input value={d.title} onChange={(e) => set("title", e.target.value)} required maxLength={300} /></Field>
          <Field label={<>توضیحات {src("description")}</>} hint={`${faNum(d.description.length)} کاراکتر (دیجی‌کالا حداقل ۱۵۰ کاراکتر می‌خواهد)`}>
            <Textarea rows={7} value={d.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </Card>
        <Card>
          <CardHeader title={<>ویژگی‌ها {src("attributes")}</>} subtitle="مثل جنس، رنگ، سایز؛ برای پر کردن فرم پلتفرم‌ها استفاده می‌شود" />
          <div className="px-5 pb-5 space-y-2">
            {Object.entries(d.attributes).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-32 text-[13px] font-semibold">{k}</span>
                <Input value={v} onChange={(e) => set("attributes", { ...d.attributes, [k]: e.target.value })} />
                <Button type="button" variant="ghost" size="sm" aria-label="حذف" onClick={() => { const a = { ...d.attributes }; delete a[k]; set("attributes", a); }}><X className="size-4" /></Button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input placeholder="نام ویژگی" value={attrKey} onChange={(e) => setAttrKey(e.target.value)} className="w-32" />
              <Input placeholder="مقدار" value={attrVal} onChange={(e) => setAttrVal(e.target.value)} />
              <Button type="button" variant="secondary" size="sm" disabled={!attrKey} aria-label="افزودن ویژگی"
                onClick={() => { set("attributes", { ...d.attributes, [attrKey]: attrVal }); setAttrKey(""); setAttrVal(""); }}><Plus className="size-4" /></Button>
            </div>
          </div>
        </Card>
      </div>
      <div className="space-y-4 lg:sticky lg:top-24">
        <Card className="p-5 space-y-4">
          <Field label={<>قیمت (تومان) {src("price")}</>}><Input dir="ltr" className="text-left tnum" value={d.price ? d.price.toLocaleString("en") : ""} onChange={(e) => set("price", num(e.target.value))} /></Field>
          <Field label="قیمت قبل از تخفیف"><Input dir="ltr" className="text-left tnum" value={d.compare_at_price ? d.compare_at_price.toLocaleString("en") : ""} onChange={(e) => set("compare_at_price", num(e.target.value))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="موجودی"><Input dir="ltr" className="text-left tnum" type="number" value={d.stock_qty} onChange={(e) => set("stock_qty", Number(e.target.value))} /></Field>
            <Field label="شناسه (SKU)"><Input dir="ltr" className="text-left" value={d.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
          </div>
          <Field label="برند"><Input value={d.brand} onChange={(e) => set("brand", e.target.value)} /></Field>
          <Field label="دسته"><Input value={d.category_hint} onChange={(e) => set("category_hint", e.target.value)} /></Field>
          <Field label="برچسب‌ها">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {d.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 bg-subtle rounded-full ps-2.5 pe-1 py-0.5 text-[12px]">
                  {t}<button type="button" className="cursor-pointer" aria-label={`حذف ${t}`} onClick={() => set("tags", d.tags.filter((x) => x !== t))}><X className="size-3" /></button>
                </span>
              ))}
            </div>
            <Input placeholder="برچسب و Enter" value={tag} onChange={(e) => setTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (tag.trim()) set("tags", [...new Set([...d.tags, tag.trim()])]); setTag(""); } }} />
          </Field>
          <label className="flex items-center justify-between gap-3 text-[14px]">
            <span>آماده برای انتشار<span className="block text-muted text-[12px]">پیش‌نویس‌ها خودکار منتشر نمی‌شوند</span></span>
            <Switch checked={d.status === "ready"} onChange={(v) => set("status", v ? "ready" : "draft")} label="آماده برای انتشار" />
          </label>
          <label className="flex items-center justify-between gap-3 text-[14px]">
            <span>نمونهٔ طلایی<span className="block text-muted text-[12px]">AI محصولات جدید را به سبک این محصول می‌سازد</span></span>
            <Switch checked={d.is_golden_sample} onChange={(v) => set("is_golden_sample", v)} label="نمونهٔ طلایی" />
          </label>
        </Card>
        <Button type="submit" size="lg" className="w-full" loading={submitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}
