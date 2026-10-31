"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { API_URL, api, getToken } from "@/lib/api";
import { faNum, toman } from "@/lib/format";
import { Button, Chip, Dialog, cn } from "@/components/ui/primitives";
import { VirtualList } from "@/components/ui/VirtualList";

type Row = { row: number; data: Record<string, any>; errors: string[]; action: "create" | "update" };
type Preview = { rows: Row[]; total: number; valid: number; create: number; update: number };

/** Products from an Excel/CSV file: template download, a full check of every row, then save. */
export function ImportDialog({ storeId, open, onClose }: { storeId: number; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [onlyErrors, setOnlyErrors] = useState(false);

  const reset = () => { setFile(null); setPreview(null); setOnlyErrors(false); if (input.current) input.current.value = ""; };
  const close = () => { reset(); onClose(); };

  const template = async (format: "xlsx" | "csv") => {
    const res = await fetch(`${API_URL}/api/v1/stores/${storeId}/products/import-template?format=${format}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) return toast.error("دانلود فایل نمونه انجام نشد.");
    const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement("a"), { href: url, download: `sello-products-template.${format}` }).click();
  };

  const check = useMutation({
    mutationFn: (f: File) => {
      const fd = new FormData();
      fd.append("file", f);
      return api<Preview>(`/stores/${storeId}/products/import/preview`, { method: "POST", body: fd });
    },
    onSuccess: (p) => { setPreview(p); setOnlyErrors(p.valid < p.total); },
    onError: (e: any) => { toast.error(e.message); reset(); },
  });

  const save = useMutation({
    mutationFn: () => api<{ created: number; updated: number; image_failed: number }>(`/stores/${storeId}/products/import`, {
      method: "POST", json: { items: preview!.rows.filter((r) => !r.errors.length).map((r) => r.data) },
    }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["products", storeId] });
      const parts = [r.created && `${faNum(r.created)} محصول جدید`, r.updated && `${faNum(r.updated)} محصول به‌روز`].filter(Boolean).join(" و ");
      toast.success(`${parts} ثبت شد.`);
      if (r.image_failed) toast.warning(`${faNum(r.image_failed)} عکس دریافت نشد؛ لینکش را بررسی کن.`);
      close();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pick = (f: File | undefined) => { if (!f) return; setFile(f); check.mutate(f); };
  const rows = preview ? (onlyErrors ? preview.rows.filter((r) => r.errors.length) : preview.rows) : [];
  const bad = preview ? preview.total - preview.valid : 0;

  return (
    <Dialog open={open} onClose={close} title="ورود محصول از اکسل یا CSV" wide>
      {!preview ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-subtle p-4 text-[13px] leading-7 text-muted">
            فایل نمونه را دانلود کن، محصولاتت را در آن بنویس و همین‌جا بارگذاری کن. فقط ستون «عنوان» اجباری است.
            اگر «کد کالا» با محصولی که از قبل داری یکی باشد، همان محصول به‌روز می‌شود. قبل از ذخیره همهٔ ردیف‌ها را می‌بینی.
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" variant="secondary" icon={<FileSpreadsheet className="size-4" />} onClick={() => template("xlsx")}>فایل نمونهٔ اکسل</Button>
              <Button size="sm" variant="ghost" onClick={() => template("csv")}>فایل نمونهٔ CSV</Button>
            </div>
          </div>
          <label
            className={cn("flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-edge p-8 text-center cursor-pointer hover:border-primary transition",
              check.isPending && "opacity-60 pointer-events-none")}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
          >
            <Upload className="size-6 text-muted" />
            <span className="font-semibold text-[14px]">{check.isPending ? `در حال بررسی ${file?.name ?? ""}…` : "فایل را اینجا بکش یا انتخاب کن"}</span>
            <span className="text-[12px] text-muted">xlsx یا csv · حداکثر ۱۰۰۰ محصول و ۵ مگابایت</span>
            <input ref={input} type="file" className="sr-only" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-semibold truncate max-w-[50%]" dir="auto">{file?.name}</span>
            <Chip>{faNum(preview.total)} ردیف</Chip>
            {preview.create > 0 && <Chip tone="success">{faNum(preview.create)} جدید</Chip>}
            {preview.update > 0 && <Chip tone="primary">{faNum(preview.update)} به‌روزرسانی</Chip>}
            {bad > 0 && <Chip tone="danger">{faNum(bad)} ردیف مشکل دارد</Chip>}
            {bad > 0 && bad < preview.total && (
              <button type="button" className="ms-auto text-muted hover:text-fg underline underline-offset-4" onClick={() => setOnlyErrors(!onlyErrors)}>
                {onlyErrors ? "نمایش همه" : "فقط ردیف‌های مشکل‌دار"}
              </button>
            )}
          </div>
          {bad > 0 && <p className="text-[12px] text-muted">ردیف‌های مشکل‌دار ذخیره نمی‌شوند؛ می‌توانی فایل را درست کنی و دوباره بارگذاری کنی.</p>}
          <div className="rounded-2xl border border-edge overflow-hidden">
            <div className="grid grid-cols-[3rem_1fr_7rem_4rem_6rem] gap-2 px-3 py-2 text-[12px] text-muted font-semibold bg-subtle">
              <span>ردیف</span><span>عنوان</span><span>قیمت</span><span>موجودی</span><span>وضعیت</span>
            </div>
            <VirtualList items={rows} getKey={(r) => r.row} estimate={44} maxHeight={360} gap={0} render={(r) => (
              <div className={cn("grid grid-cols-[3rem_1fr_7rem_4rem_6rem] gap-2 px-3 py-2.5 text-[13px] border-t border-edge items-start", r.errors.length && "bg-danger/6")}>
                <span className="tnum text-muted">{faNum(r.row)}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{r.data.title || "—"}</span>
                  {r.data.sku && <span className="block text-[11px] text-muted" dir="ltr">{r.data.sku}</span>}
                  {r.errors.map((e) => <span key={e} className="block text-[12px] text-danger">{e}</span>)}
                </span>
                <span className="tnum">{r.data.price != null ? toman(r.data.price) : "—"}</span>
                <span className="tnum">{r.data.stock_qty != null ? faNum(r.data.stock_qty) : "—"}</span>
                <span>{r.errors.length ? <Chip tone="danger">رد می‌شود</Chip> : r.action === "update" ? <Chip tone="primary">به‌روزرسانی</Chip> : <Chip tone="success">جدید</Chip>}</span>
              </div>
            )} />
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="ghost" onClick={reset}>فایل دیگر</Button>
            <Button disabled={!preview.valid} loading={save.isPending} onClick={() => save.mutate()}>
              {preview.valid ? `ثبت ${faNum(preview.valid)} محصول` : "ردیف سالمی برای ثبت نیست"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
