"use client";

// Client-side forms: React Hook Form with Zod schemas. Every form using these lives in a "use client" component, so
// validation runs in the browser (CSR); the API validates again on its side.
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues, type FieldValues, type UseFormProps } from "react-hook-form";
import { z } from "zod";

export { z };

const toLatin = (v: string) => v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
const digits = (v: string) => toLatin(v ?? "").replace(/[\s-]/g, "");

/** Shared rules with Persian messages. */
export const rules = {
  required: (label: string) => z.string().trim().min(1, `${label} را وارد کن.`),
  text: (max: number) => z.string().trim().max(max, `حداکثر ${max} کاراکتر.`),
  mobile: z.string().transform(digits).refine((v) => v === "" || /^09\d{9}$/.test(v), "موبایل باید ۱۱ رقم و با ۰۹ شروع شود."),
  mobileRequired: z.string().transform(digits).refine((v) => /^09\d{9}$/.test(v), "موبایل باید ۱۱ رقم و با ۰۹ شروع شود."),
  phone: z.string().transform(digits).refine((v) => v === "" || /^\+?\d{7,14}$/.test(v), "شمارهٔ تلفن معتبر نیست."),
  card: z.string().transform(digits).refine((v) => v === "" || /^\d{16}$/.test(v), "شماره کارت باید ۱۶ رقم باشد."),
  sheba: z.string().transform((v) => digits(v).toUpperCase()).transform((v) => (v && !v.startsWith("IR") ? `IR${v}` : v))
    .refine((v) => v === "" || /^IR\d{24}$/.test(v), "شبا باید IR و ۲۴ رقم باشد."),
  url: z.string().trim().refine((v) => v === "" || /^https?:\/\/\S+\.\S+/.test(v), "لینک باید با https:// شروع شود."),
  toman: z.number({ invalid_type_error: "عدد وارد کن." }).int().min(0, "نمی‌تواند منفی باشد."),
};

export function useZodForm<S extends z.ZodTypeAny>(schema: S, props: Omit<UseFormProps<z.input<S> & FieldValues>, "resolver"> & { defaultValues?: DefaultValues<z.input<S> & FieldValues> } = {}) {
  return useForm<z.input<S> & FieldValues, unknown, z.output<S> & FieldValues>({ mode: "onTouched", ...props, resolver: zodResolver(schema) });
}
