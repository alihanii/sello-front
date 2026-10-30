"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button, Card, CardHeader, Chip, Field, Input, PageHeader, Skeleton, Switch } from "@/components/ui/primitives";

const STEPS = [
  "در developers.facebook.com یک اپ از نوع Business بساز و محصول «Instagram» › «API setup with Instagram login» را اضافه کن.",
  "آدرس بازگشت (Redirect URI) زیر را در بخش Business login settings ثبت کن.",
  "Instagram app ID و Instagram app secret را اینجا وارد کن.",
  "تا قبل از App Review فقط حساب‌هایی که به‌عنوان Tester به اپ اضافه شده‌اند وصل می‌شوند؛ برای همهٔ کاربران، دسترسی‌های instagram_business_basic و instagram_business_content_publish را برای Advanced Access به بررسی Meta بفرست.",
  "دامنه‌های اینستاگرام در ایران فیلتر است؛ اگر سرور داخل ایران است، یک پروکسی HTTP/SOCKS خارج از ایران وارد کن.",
  "SELLO_PUBLIC_BASE_URL باید آدرس عمومی بک‌اند باشد؛ اینستاگرام عکس‌ها را مستقیم از همین آدرس دانلود می‌کند.",
];

export default function Integrations() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-ig"], queryFn: () => api<any>("/admin/integrations/instagram") });
  const [f, setF] = useState<any>(null);
  useEffect(() => { if (data) setF({ ...data, app_secret: "" }); }, [data]);
  const save = useMutation({
    mutationFn: () => api("/admin/integrations/instagram", { method: "PUT", json: {
      enabled: f.enabled, app_id: f.app_id, proxy: f.proxy, app_secret: f.app_secret ? f.app_secret : null } }),
    onSuccess: (d: any) => { qc.setQueryData(["admin-ig"], d); qc.invalidateQueries({ queryKey: ["platforms"] }); toast.success("ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!f) return <Skeleton className="h-96" />;
  const copy = () => { navigator.clipboard.writeText(f.redirect_uri); toast.success("کپی شد"); };

  return (
    <>
      <PageHeader title="یکپارچه‌سازی‌ها" subtitle="اتصال اپ Meta برای انتشار در اینستاگرام."
        actions={<Button loading={save.isPending} onClick={() => save.mutate()}>ذخیره</Button>} />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 items-start">
        <Card>
          <CardHeader title="اینستاگرام" subtitle="Instagram API with Instagram Login"
            action={<Chip tone={f.enabled && f.oauth_ready ? "success" : "neutral"}>{f.enabled ? (f.oauth_ready ? "فعال" : "ناقص") : "غیرفعال"}</Chip>} />
          <div className="px-4 sm:px-5 pb-5 space-y-4">
            <label className="flex items-center gap-3 text-[14px]"><Switch checked={f.enabled} onChange={(v) => setF({ ...f, enabled: v })} />نمایش اینستاگرام برای فروشنده‌ها</label>
            <Field label="Instagram app ID"><Input dir="ltr" className="text-left tnum" value={f.app_id} onChange={(e) => setF({ ...f, app_id: e.target.value })} /></Field>
            <Field label="Instagram app secret" hint={f.has_secret ? "ذخیره شده؛ برای تغییر مقدار جدید وارد کن." : "هنوز وارد نشده."}>
              <Input dir="ltr" type="password" className="text-left font-mono" placeholder={f.has_secret ? "••••••••" : ""} value={f.app_secret} onChange={(e) => setF({ ...f, app_secret: e.target.value })} />
            </Field>
            <Field label="پروکسی (اختیاری)" hint="مثل http://user:pass@host:port یا socks5://host:port">
              <Input dir="ltr" className="text-left font-mono text-[13px]" value={f.proxy} onChange={(e) => setF({ ...f, proxy: e.target.value })} />
            </Field>
            <Field label="Redirect URI">
              <div className="flex gap-2"><Input dir="ltr" readOnly className="text-left font-mono text-[13px]" value={f.redirect_uri} />
                <Button variant="secondary" icon={<Copy className="size-4" />} onClick={copy} aria-label="کپی" /></div>
            </Field>
            <div className="text-[12px] text-muted" dir="ltr">scopes: {f.scopes}</div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-bold mb-3">راه‌اندازی</div>
          <ol className="list-decimal ps-5 space-y-2 text-[13px] text-muted leading-6">{STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
        </Card>
      </div>
    </>
  );
}
