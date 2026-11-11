"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, FileText, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ago, faDigits, faNum, jDateTime, toman } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { rules, useZodForm, z } from "@/lib/form";
import { INVOICE_STATUS, copyText, orderQueries, usePatchInvoice, useInvalidateOrders } from "@/lib/orders";
import { Button, Card, Chip, EmptyState, Field, Input, NumberInput, Switch, Tabs, Textarea, FormActions } from "@/components/ui/primitives";
import { FormCardSkeleton, ListRowsSkeleton } from "@/components/ui/skeletons";

export function InvoiceList({ onNew }: { onNew: () => void }) {
  const sid = useStoreId();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const params = new URLSearchParams({ status, q, source: "invoice", limit: "50" });
  const { data } = useQuery({ ...orderQueries.invoices(sid, params), placeholderData: keepPreviousData, refetchInterval: 30_000 });
  const patch = usePatchInvoice(sid);
  const n = (k: string) => (data?.counts?.[k] ? ` (${faNum(data.counts[k])})` : "");
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <Tabs value={status} onChange={setStatus} items={[
          { value: "", label: "همه" },
          { value: "awaiting_payment", label: `منتظر پرداخت${n("awaiting_payment")}` },
          { value: "payment_submitted", label: `فیش رسیده${n("payment_submitted")}` },
          { value: "confirmed", label: `پرداخت‌شده${n("confirmed")}` },
          { value: "cancelled", label: "لغوشده" },
        ]} />
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="size-4 text-muted absolute top-3.5 start-3.5" aria-hidden />
          <Input className="ps-10" placeholder="نام، موبایل یا شمارهٔ فاکتور" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جستجوی فاکتور" />
        </div>
        <div className="flex-1 hidden lg:block" />
        <Button icon={<Plus className="size-4" />} onClick={onNew}>فاکتور جدید</Button>
      </div>
      {!data ? <Card><ListRowsSkeleton rows={5} /></Card> : data.items.length === 0 ? (
        <Card><EmptyState icon={<FileText className="size-7" />} title={q || status ? "فاکتوری با این فیلتر نیست" : "هنوز فاکتوری نساخته‌ای"}
          text="فاکتور بساز، لینکش را برای مشتری بفرست؛ مشتری کارت‌به‌کارت می‌کند، فیش را بارگذاری می‌کند و سفارش در لیست سفارشات ثبت می‌شود."
          action={<Button icon={<Plus className="size-4" />} onClick={onNew}>ساخت اولین فاکتور</Button>} /></Card>
      ) : (
        <Card className="divide-y divide-[var(--glass-edge)]">
          {data.items.map((i: any) => {
            const st = i.expired ? { label: "منقضی شده", tone: "neutral" } : INVOICE_STATUS[i.status];
            return (
              <div key={i.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="size-10 rounded-xl bg-accent/15 text-[color-mix(in_oklab,var(--accent),var(--fg)_45%)] grid place-items-center shrink-0"><FileText className="size-4" /></span>
                  <div className="min-w-0">
                    <div className="font-bold flex items-center gap-2 flex-wrap"><span className="tnum">فاکتور {faDigits(i.number)}</span><Chip tone={st?.tone}>{st?.label}</Chip></div>
                    <div className="text-[12px] text-muted truncate">
                      {i.customer_name || "بدون نام"} · {i.items.length === 1 ? i.items[0].title : `${faNum(i.items.length)} قلم`} · {jDateTime(i.created_at)}
                    </div>
                    <div className="text-[12px] text-muted flex items-center gap-1 mt-0.5">
                      {i.viewed_at ? <><Eye className="size-3.5" />مشتری دید {ago(i.viewed_at)}</> : <><EyeOff className="size-3.5" />هنوز باز نشده</>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  <span className="font-black tnum">{toman(i.total_toman)}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" icon={<Copy className="size-4" />} onClick={() => copyText(i.link, "لینک کپی شد")}>لینک</Button>
                    <a href={i.link} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost" aria-label="دیدن فاکتور"><Eye className="size-4" /></Button></a>
                    {i.status === "awaiting_payment" && <Button size="sm" variant="ghost" className="text-danger" onClick={() => confirm("فاکتور لغو شود؟ لینکش دیگر قابل پرداخت نیست.") && patch.mutate({ id: i.id, status: "cancelled" })}>لغو</Button>}
                    {(i.expired || i.status === "cancelled") && <Button size="sm" variant="ghost" onClick={() => patch.mutate({ id: i.id, status: "awaiting_payment" })}>فعال‌سازی دوباره</Button>}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </>
  );
}

const settingsSchema = z.object({
  card_number: rules.card, sheba: rules.sheba, holder: rules.text(120), bank_name: rules.text(60), pay_link: rules.url,
  require_receipt: z.boolean(), seller_name: rules.text(120), phone: rules.phone, address: rules.text(500),
  next_number: z.number().int().min(1, "حداقل ۱."), note: rules.text(1500),
  expire_hours: z.number().int().min(0).max(1440, "حداکثر ۶۰ روز (۱۴۴۰ ساعت)."), default_shipping_toman: rules.toman,
  ask_phone: z.boolean(), ask_address: z.boolean(), thank_you: rules.text(500),
});
type SettingsForm = z.infer<typeof settingsSchema>;
const SETTINGS_KEYS = Object.keys(settingsSchema.shape) as (keyof SettingsForm)[];
const pick = (d: any) => Object.fromEntries(SETTINGS_KEYS.map((k) => [k, d[k] ?? (typeof d[k] === "number" ? 0 : "")])) as SettingsForm;

export function InvoiceSettings() {
  const sid = useStoreId();
  const refresh = useInvalidateOrders(sid);
  const { data } = useQuery(orderQueries.settings(sid));
  const { register, control, handleSubmit, reset, formState: { errors, isDirty } } = useZodForm(settingsSchema);
  useEffect(() => { if (data) reset(pick(data)); }, [data, reset]);
  const save = useMutation({
    mutationFn: (v: SettingsForm) => api(`/stores/${sid}/invoice-settings`, { method: "PUT", json: v }),
    onSuccess: (d) => { reset(pick(d)); refresh(); toast.success("تنظیمات فاکتور ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!data) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><FormCardSkeleton fields={4} /><FormCardSkeleton fields={4} /></div>;
  const err = (k: keyof SettingsForm) => errors[k]?.message as string | undefined;
  const text = (k: keyof SettingsForm, label: string, props: React.ComponentProps<typeof Input> & { hint?: string } = {}) => {
    const { hint, ...rest } = props;
    return <Field label={label} hint={hint} error={err(k)}><Input {...rest} {...register(k)} aria-invalid={!!err(k)} /></Field>;
  };
  const num = (k: keyof SettingsForm, label: string, hint?: string, grouping = true) => (
    <Field label={label} hint={hint} error={err(k)}>
      <Controller control={control} name={k} render={({ field }) => <NumberInput grouping={grouping} value={field.value as number} onChange={field.onChange} onBlur={field.onBlur} />} />
    </Field>
  );
  const toggle = (k: keyof SettingsForm, title: string, hint: string) => (
    <Controller control={control} name={k} render={({ field }) => (
      <label className="flex items-center justify-between gap-3 rounded-2xl bg-subtle p-3 cursor-pointer">
        <span><b className="text-[14px]">{title}</b><span className="block text-[12px] text-muted">{hint}</span></span>
        <Switch checked={!!field.value} onChange={field.onChange} label={title} />
      </label>
    )} />
  );
  return (
    <form onSubmit={handleSubmit((v) => save.mutate(v as SettingsForm))} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <Card className="p-5 space-y-3">
        <h3 className="font-extrabold text-[15px]">اطلاعات پرداخت</h3>
        <p className="text-[13px] text-muted -mt-2">مشتری روی فاکتور همین‌ها را می‌بیند و با یک ضربه کپی می‌کند.</p>
        {text("card_number", "شماره کارت", { dir: "ltr", inputMode: "numeric", className: "text-left tnum", placeholder: "6037 9911 1234 5678" })}
        {text("sheba", "شماره شبا", { dir: "ltr", className: "text-left tnum", placeholder: "IR...", hint: "اختیاری" })}
        <div className="grid grid-cols-2 gap-3">
          {text("holder", "به نام")}
          {text("bank_name", "بانک", { placeholder: "ملت، سامان…" })}
        </div>
        {text("pay_link", "لینک پرداخت آنلاین", { dir: "ltr", className: "text-left", placeholder: "https://zarinp.al/...", hint: "اختیاری: لینک درگاه خودت (زرین‌لینک، آیدی‌پی…). روی فاکتور دکمهٔ «پرداخت آنلاین» می‌آید." })}
        {toggle("require_receipt", "عکس فیش اجباری باشد", "خاموش باشد، مشتری می‌تواند فقط کد پیگیری بزند.")}
      </Card>
      <div className="space-y-4">
        <Card className="p-5 space-y-3">
          <h3 className="font-extrabold text-[15px]">سربرگ فاکتور</h3>
          {text("seller_name", "نام فروشنده روی فاکتور", { hint: "لوگو از تنظیمات فروشگاه می‌آید." })}
          <div className="grid grid-cols-2 gap-3">
            {text("phone", "تلفن پشتیبانی", { dir: "ltr", className: "text-left" })}
            {num("next_number", "شمارهٔ فاکتور بعدی", undefined, false)}
          </div>
          {text("address", "آدرس")}
          <Field label="توضیحات پایین فاکتور" hint="شرایط ارسال، مرجوعی، زمان تحویل…" error={err("note")}><Textarea rows={3} {...register("note")} /></Field>
        </Card>
        <Card className="p-5 space-y-3">
          <h3 className="font-extrabold text-[15px]">رفتار فاکتور</h3>
          <div className="grid grid-cols-2 gap-3">
            {num("expire_hours", "مهلت پرداخت (ساعت)", "۰ یعنی بدون مهلت", false)}
            {num("default_shipping_toman", "هزینهٔ ارسال پیش‌فرض")}
          </div>
          {toggle("ask_phone", "موبایل مشتری را بپرس", "اگر روی فاکتور نزده باشی، مشتری هنگام ارسال فیش وارد می‌کند.")}
          {toggle("ask_address", "آدرس تحویل را بپرس", "برای کالای فیزیکی روشن بماند.")}
          {text("thank_you", "پیام بعد از ارسال فیش", { placeholder: "ممنون از خریدت! بعد از تأیید، سفارش ارسال می‌شود." })}
        </Card>
      </div>
      </div>
      <FormActions note={isDirty ? "تغییرات ذخیره نشده" : undefined}><Button type="submit" size="lg" loading={save.isPending}>ذخیرهٔ تنظیمات</Button></FormActions>
    </form>
  );
}
