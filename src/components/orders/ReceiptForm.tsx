"use client";

import { ImagePlus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { API_URL } from "@/lib/api";
import { rules, useZodForm, z } from "@/lib/form";
import { Button, Field, FormActions, Input, PhoneInput, Textarea } from "@/components/ui/primitives";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** What the customer sends after paying. Which fields are required follows the seller's invoice settings. */
function receiptSchema(inv: any) {
  return z.object({
    file: z.instanceof(File).nullable()
      .refine((f) => !f || IMAGE_TYPES.includes(f.type), "فیش باید عکس JPG، PNG یا WEBP باشد.")
      .refine((f) => !f || f.size <= 8 * 1024 * 1024, "حجم عکس فیش حداکثر ۸ مگابایت است.")
      .refine((f) => !inv.require_receipt || !!f, "عکس فیش واریز را انتخاب کن."),
    payment_ref: rules.text(120),
    name: rules.text(160),
    phone: inv.ask_phone ? rules.mobileRequired : rules.mobile,
    address: inv.ask_address ? rules.required("آدرس تحویل").pipe(rules.text(1000)) : rules.text(1000),
    note: rules.text(1000),
  }).refine((v) => !!v.file || !!v.payment_ref, { path: ["payment_ref"], message: "عکس فیش یا کد پیگیری را وارد کن." });
}

export function ReceiptForm({ inv, code, onSent }: { inv: any; code: string; onSent: (invoice: any) => void }) {
  const schema = useMemo(() => receiptSchema(inv), [inv]);
  const { register, control, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useZodForm(schema, {
    defaultValues: { file: null, payment_ref: "", name: inv.customer.name ?? "", phone: inv.customer.phone ?? "", address: inv.customer.address ?? "", note: "" },
  });
  const input = useRef<HTMLInputElement>(null);
  const file = watch("file");
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file) return setPreview("");
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const submit = handleSubmit(async (v: any) => {
    const body = new FormData();
    if (v.file) body.append("file", v.file);
    for (const k of ["payment_ref", "name", "phone", "address", "note"]) body.append(k, v[k] ?? "");
    try {
      const r = await fetch(`${API_URL}/api/v1/public/invoices/${code}/receipt`, { method: "POST", body });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.detail?.message ?? "ارسال نشد؛ دوباره امتحان کن.");
      onSent(d);
    } catch (err: any) {
      setError("root", { message: err.message === "Failed to fetch" ? "ارتباط برقرار نشد؛ دوباره امتحان کن." : err.message });
    }
  });
  const msg = (k: string) => (errors as any)[k]?.message as string | undefined;

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <div className="font-extrabold text-[15px]">{inv.status === "rejected" ? "ارسال دوبارهٔ فیش" : "بعد از واریز، فیش را بفرست"}</div>
      <Controller control={control} name="file" render={({ field }) => (
        <>
          <input ref={input} type="file" accept={IMAGE_TYPES.join(",")} className="hidden" onChange={(e) => field.onChange(e.target.files?.[0] ?? null)} />
          <button type="button" onClick={() => input.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-edge hover:border-primary transition p-4 flex flex-col items-center gap-2 cursor-pointer"
            >
            {preview ? <img src={preview} alt="فیش انتخاب‌شده" className="max-h-56 rounded-xl" /> : <ImagePlus className="size-8 text-primary" />}
            <span className="text-[14px] font-bold">{preview ? "تغییر عکس فیش" : `عکس فیش واریز${inv.require_receipt ? "" : " (اختیاری)"}`}</span>
            {!preview && <span className="text-[12px] text-muted">اسکرین‌شات پیامک بانک یا رسید اپ بانکی</span>}
          </button>
          {msg("file") && <span className="block text-[12px] text-danger">{msg("file")}</span>}
        </>
      )} />
      <Field label={`کد پیگیری / شمارهٔ ارجاع${inv.require_receipt ? " (اختیاری)" : ""}`} error={msg("payment_ref")}>
        <Input dir="ltr" inputMode="numeric" className="text-left tnum" {...register("payment_ref")} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="نام و نام خانوادگی" error={msg("name")}><Input autoComplete="name" {...register("name")} /></Field>
        {inv.ask_phone && <Field label="موبایل" error={msg("phone")}><PhoneInput {...register("phone")} aria-invalid={!!msg("phone")} /></Field>}
      </div>
      {inv.ask_address && <Field label="آدرس کامل و کد پستی" error={msg("address")}><Textarea rows={2} className="!min-h-20" autoComplete="street-address" {...register("address")} aria-invalid={!!msg("address")} /></Field>}
      <Field label="توضیح برای فروشنده (اختیاری)" error={msg("note")}><Input {...register("note")} /></Field>
      {errors.root?.message && <p className="text-[13px] text-danger font-semibold" role="alert">{errors.root.message}</p>}
      <FormActions noNav><Button type="submit" size="lg" className="w-full" loading={isSubmitting}>ارسال فیش و ثبت سفارش</Button></FormActions>
    </form>
  );
}
