"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Store, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { api, mediaUrl } from "@/lib/api";
import { rules, useZodForm, z } from "@/lib/form";
import { storeQueries, useStoreId } from "@/lib/hooks";
import { Button, Card, Field, Input, PageHeader, Spinner, Switch, Textarea, FormActions } from "@/components/ui/primitives";
import { SettingsSkeleton } from "@/components/ui/skeletons";

const schema = z.object({
  name: rules.required("نام فروشگاه").pipe(rules.text(120)),
  category: rules.text(80),
  logo_url: z.string(),
  caption_signature: rules.text(500),
  show_price_in_caption: z.boolean(),
  crawl_to_inbox: z.boolean(),
});
type Form = z.infer<typeof schema>;

const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Square logo: upload, preview, remove. Shown in the store switcher and on invoices. */
function LogoPicker({ value, onChange, name }: { value: string; onChange: (url: string) => void; name: string }) {
  const sid = useStoreId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) return toast.error("لوگو باید عکس JPG، PNG یا WEBP باشد.");
    if (file.size > 3 * 1024 * 1024) return toast.error("حجم لوگو حداکثر ۳ مگابایت است.");
    const body = new FormData();
    body.append("files", file);
    setBusy(true);
    try {
      const { urls } = await api<{ urls: string[] }>(`/stores/${sid}/uploads`, { method: "POST", body });
      onChange(urls[0]);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={() => input.current?.click()} aria-label="انتخاب لوگو"
        className="relative size-20 rounded-2xl bg-subtle border border-edge overflow-hidden grid place-items-center cursor-pointer hover:border-primary transition shrink-0">
        {value ? <img src={mediaUrl(value)} alt={`لوگوی ${name}`} className="size-full object-cover" /> : <Store className="size-7 text-muted" />}
        {busy && <span className="absolute inset-0 bg-black/30 grid place-items-center"><Spinner className="text-white" /></span>}
      </button>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" icon={<ImagePlus className="size-4" />} disabled={busy} onClick={() => input.current?.click()}>{value ? "تغییر لوگو" : "بارگذاری لوگو"}</Button>
          {value && <Button type="button" size="sm" variant="ghost" className="text-danger" icon={<Trash2 className="size-4" />} onClick={() => onChange("")}>حذف</Button>}
        </div>
        <p className="text-[12px] text-muted">مربعی، حداقل ۲۵۶×۲۵۶ پیکسل. روی فاکتورها و منوی فروشگاه دیده می‌شود.</p>
      </div>
      <input ref={input} type="file" accept={LOGO_TYPES.join(",")} className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
}

export default function Settings() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const { data: store } = useQuery(storeQueries.store(sid));
  const form = useZodForm(schema);
  const { register, control, handleSubmit, reset, formState: { errors, isDirty } } = form;
  useEffect(() => {
    if (store) reset({
      name: store.name, category: store.category ?? "", logo_url: store.logo_url ?? "",
      caption_signature: store.settings?.caption_signature ?? "", show_price_in_caption: !!store.settings?.show_price_in_caption,
      crawl_to_inbox: !!store.settings?.crawl_to_inbox,
    });
  }, [store, reset]);
  const save = useMutation({
    // Only this page's settings are sent, so other pages' settings (invoice...) are never overwritten with stale copies.
    mutationFn: (v: Form) => api(`/stores/${sid}`, { method: "PATCH", json: {
      name: v.name, category: v.category, logo_url: v.logo_url,
      settings: { caption_signature: v.caption_signature, show_price_in_caption: v.show_price_in_caption, crawl_to_inbox: v.crawl_to_inbox },
    } }),
    onSuccess: (s: any) => {
      qc.invalidateQueries({ queryKey: ["stores"] }); qc.invalidateQueries({ queryKey: ["store", sid] }); qc.invalidateQueries({ queryKey: ["invoice-settings", sid] });
      reset({ name: s.name, category: s.category, logo_url: s.logo_url, caption_signature: s.settings.caption_signature ?? "",
        show_price_in_caption: !!s.settings.show_price_in_caption, crawl_to_inbox: !!s.settings.crawl_to_inbox });
      toast.success("ذخیره شد");
    },
    onError: (e: any) => toast.error(e.message),
  });
  if (!store) return <SettingsSkeleton />;
  const submit = handleSubmit((v) => save.mutate(v as Form));
  return (
    <form onSubmit={submit} noValidate>
      <PageHeader title="تنظیمات فروشگاه" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Card className="p-5 space-y-4">
          <Field label="لوگوی فروشگاه">
            <Controller control={control} name="logo_url" render={({ field }) => (
              <LogoPicker value={field.value ?? ""} name={store.name} onChange={(url) => field.onChange(url)} />
            )} />
          </Field>
          <Field label="نام فروشگاه" error={errors.name?.message as string}><Input {...register("name")} aria-invalid={!!errors.name} /></Field>
          <Field label="دسته" error={errors.category?.message as string}><Input {...register("category")} /></Field>
          <Field label="امضای انتهای پست" hint="مثلاً آیدی پشتیبانی یا «ارسال به سراسر ایران»" error={errors.caption_signature?.message as string}>
            <Textarea rows={2} {...register("caption_signature")} /></Field>
        </Card>
        <Card className="p-5 space-y-4">
          <Controller control={control} name="show_price_in_caption" render={({ field }) => (
            <label className="flex items-center justify-between gap-3 text-[14px]">نمایش قیمت در کپشن پست‌ها<Switch checked={!!field.value} onChange={field.onChange} /></label>
          )} />
          <Controller control={control} name="crawl_to_inbox" render={({ field }) => (
            <label className="flex items-center justify-between gap-3 text-[14px]"><span>محصولات کرال‌شده اول به صندوق ورودی بروند<span className="block text-[12px] text-muted">تا قبل از تأیید تو محصول نهایی نشوند</span></span><Switch checked={!!field.value} onChange={field.onChange} /></label>
          )} />
        </Card>
      </div>
      <FormActions note={isDirty ? "تغییرات ذخیره نشده" : undefined}><Button type="submit" size="lg" loading={save.isPending} disabled={!isDirty}>ذخیره</Button></FormActions>
    </form>
  );
}
