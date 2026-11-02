"use client";

import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { faNum, toman } from "@/lib/format";
import { Button, Dialog, Field, Input, NumberInput, Select, Switch, cn } from "@/components/ui/primitives";
import { CategoryInput } from "./CategoryInput";

type PriceMode = "set" | "inc_pct" | "dec_pct" | "inc_amt" | "dec_amt";
type StockMode = "set" | "add" | "sub";

export type BulkEdit = {
  price?: { mode: "set" | "percent" | "amount"; value: number; round_to: number };
  stock?: { mode: "set" | "add"; value: number };
  category?: string;
  attribute?: { name: string; value: string; remove: boolean };
};

const INITIAL = {
  usePrice: false, priceMode: "inc_pct" as PriceMode, priceValue: 0, roundTo: 0,
  useStock: false, stockMode: "set" as StockMode, stockValue: 0,
  useCategory: false, category: "", clearCategory: false,
  useAttr: false, attrName: "", attrValue: "", attrRemove: false,
};

/** Same math as the server (_new_price), for the preview only. */
function previewPrice(price: number, e: NonNullable<BulkEdit["price"]>) {
  let n = e.mode === "set" ? e.value : e.mode === "percent" ? price * (1 + e.value / 100) : price + e.value;
  if (e.round_to) n = Math.round(n / e.round_to) * e.round_to;
  return Math.max(0, Math.round(n));
}

/** Manual bulk edit: price, stock, category and one detail, for the selected products or every product matching the filter. */
export function BulkEditDialog({ open, onClose, storeId, count, sample, loading, onConfirm }: {
  open: boolean; onClose: () => void; storeId: number; count: number; sample: any[]; loading?: boolean;
  onConfirm: (edit: BulkEdit) => void;
}) {
  const [f, setF] = useState(INITIAL);
  useEffect(() => { if (open) setF(INITIAL); }, [open]);
  const set = (patch: Partial<typeof INITIAL>) => setF({ ...f, ...patch });

  const edit: BulkEdit = {};
  if (f.usePrice) {
    const sign = f.priceMode.startsWith("dec") ? -1 : 1;
    edit.price = { mode: f.priceMode === "set" ? "set" : f.priceMode.endsWith("pct") ? "percent" : "amount", value: sign * f.priceValue, round_to: f.roundTo };
  }
  if (f.useStock) edit.stock = { mode: f.stockMode === "set" ? "set" : "add", value: f.stockMode === "sub" ? -f.stockValue : f.stockValue };
  if (f.useCategory) edit.category = f.clearCategory ? "" : f.category.trim();
  if (f.useAttr) edit.attribute = { name: f.attrName.trim(), value: f.attrValue.trim(), remove: f.attrRemove };

  const problem =
    !f.usePrice && !f.useStock && !f.useCategory && !f.useAttr ? "حداقل یک تغییر را روشن کن." :
    f.usePrice && f.priceMode !== "set" && !f.priceValue ? "مقدار تغییر قیمت را بنویس." :
    f.useCategory && !f.clearCategory && !f.category.trim() ? "دسته‌بندی را بنویس یا «پاک کردن دسته» را بزن." :
    f.useAttr && !f.attrName.trim() ? "نام ویژگی را بنویس." :
    f.useAttr && !f.attrRemove && !f.attrValue.trim() ? "مقدار ویژگی را بنویس." : "";

  const section = (on: boolean, toggle: (v: boolean) => void, label: string, body: React.ReactNode) => (
    <div className={cn("rounded-2xl border border-edge p-3", on && "border-primary/40 bg-primary/4")}>
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="font-semibold text-[14px]">{label}</span>
        <Switch checked={on} onChange={toggle} label={label} />
      </label>
      {on && <div className="mt-3 space-y-3">{body}</div>}
    </div>
  );

  return (
    <Dialog open={open} onClose={onClose} title={`ویرایش گروهی ${faNum(count)} محصول`}>
      <div className="space-y-3">
        {section(f.usePrice, (v) => set({ usePrice: v }), "قیمت", <>
          <div className="grid grid-cols-2 gap-2">
            <Select value={f.priceMode} onChange={(e) => set({ priceMode: e.target.value as PriceMode })} aria-label="نوع تغییر قیمت">
              <option value="inc_pct">افزایش درصدی</option>
              <option value="dec_pct">کاهش درصدی</option>
              <option value="inc_amt">افزایش مبلغ ثابت</option>
              <option value="dec_amt">کاهش مبلغ ثابت</option>
              <option value="set">قیمت جدید برای همه</option>
            </Select>
            <NumberInput value={f.priceValue} grouping={!f.priceMode.endsWith("pct")} onChange={(v) => set({ priceValue: v })}
              placeholder={f.priceMode.endsWith("pct") ? "درصد" : "تومان"} aria-label="مقدار" />
          </div>
          <Field label="گرد کردن">
            <Select value={String(f.roundTo)} onChange={(e) => set({ roundTo: Number(e.target.value) })} aria-label="گرد کردن">
              <option value="0">بدون گرد کردن</option>
              <option value="1000">به هزار تومان</option>
              <option value="10000">به ده هزار تومان</option>
            </Select>
          </Field>
          {edit.price && sample.length > 0 && (
            <ul className="text-[13px] space-y-1 bg-subtle rounded-xl p-2.5">
              {sample.slice(0, 3).map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span className="line-clamp-1 text-muted">{p.title}</span>
                  <span className="tnum whitespace-nowrap">{toman(p.price)} ← {toman(previewPrice(p.price, edit.price!))}</span>
                </li>
              ))}
            </ul>
          )}
        </>)}

        {section(f.useStock, (v) => set({ useStock: v }), "موجودی", (
          <div className="grid grid-cols-2 gap-2">
            <Select value={f.stockMode} onChange={(e) => set({ stockMode: e.target.value as StockMode })} aria-label="نوع تغییر موجودی">
              <option value="set">موجودی جدید برای همه</option>
              <option value="add">اضافه کردن</option>
              <option value="sub">کم کردن</option>
            </Select>
            <NumberInput value={f.stockValue} grouping={false} onChange={(v) => set({ stockValue: v })} aria-label="تعداد" />
          </div>
        ))}

        {section(f.useCategory, (v) => set({ useCategory: v }), "دسته‌بندی", <>
          {!f.clearCategory && <CategoryInput storeId={storeId} value={f.category} onChange={(v) => set({ category: v })} />}
          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={f.clearCategory} onChange={(e) => set({ clearCategory: e.target.checked })} />
            پاک کردن دسته (بدون دسته)
          </label>
        </>)}

        {section(f.useAttr, (v) => set({ useAttr: v }), "ویژگی", <>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="نام، مثلاً جنس" value={f.attrName} onChange={(e) => set({ attrName: e.target.value })} aria-label="نام ویژگی" />
            {!f.attrRemove && <Input placeholder="مقدار، مثلاً نخی" value={f.attrValue} onChange={(e) => set({ attrValue: e.target.value })} aria-label="مقدار ویژگی" />}
          </div>
          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={f.attrRemove} onChange={(e) => set({ attrRemove: e.target.checked })} />
            این ویژگی از محصولات حذف شود
          </label>
        </>)}

        <p className="text-[12px] text-muted">پست‌هایی که قبلاً منتشر شده‌اند خودکار عوض نمی‌شوند؛ این محصولات «نیاز به به‌روزرسانی» می‌خورند.</p>
        {problem && <p className="text-[13px] text-warning">{problem}</p>}
        <Button className="w-full" disabled={!!problem} loading={loading} icon={<Pencil className="size-4" />} onClick={() => onConfirm(edit)}>
          اعمال روی {faNum(count)} محصول
        </Button>
      </div>
    </Dialog>
  );
}
