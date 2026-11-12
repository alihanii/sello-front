"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button, Card, CardHeader, Chip, Field, Input, PageHeader, Select, Switch, FormActions } from "@/components/ui/primitives";
import { FormSectionSkeleton } from "@/components/ui/skeletons";

const STEPS = [
  "در developers.facebook.com یک اپ از نوع Business بساز و محصول «Instagram» › «API setup with Instagram login» را اضافه کن.",
  "آدرس بازگشت (Redirect URI) زیر را در بخش Business login settings ثبت کن.",
  "Instagram app ID و Instagram app secret را اینجا وارد کن.",
  "تا قبل از App Review فقط حساب‌هایی که به‌عنوان Tester به اپ اضافه شده‌اند وصل می‌شوند؛ برای همهٔ کاربران، دسترسی‌های instagram_business_basic و instagram_business_content_publish را برای Advanced Access به بررسی Meta بفرست.",
  "دامنه‌های اینستاگرام در ایران فیلتر است؛ اگر سرور داخل ایران است، در پنل ادمین › پروکسی‌ها لینک‌های v2ray یا پروکسی بده.",
  "SELLO_PUBLIC_BASE_URL باید آدرس عمومی بک‌اند باشد؛ اینستاگرام عکس‌ها را مستقیم از همین آدرس دانلود می‌کند.",
];

const LOGIN_STEPS = [
  "فروشنده با نام کاربری و رمز اینستاگرام وصل می‌شود؛ اپ Meta لازم نیست و حساب شخصی هم کار می‌کند.",
  "همهٔ ترافیک این حساب‌ها فقط از پروکسی‌های «اینستاگرام» در پنل ادمین › پروکسی‌ها می‌رود. هر حساب به یک پروکسی ثابت می‌چسبد؛ فقط وقتی آن پروکسی خراب شود به پروکسی دیگری منتقل می‌شود.",
  "برای هر چند حساب یک پروکسی جدا بگذار؛ پروکسی‌های تمیز و ثابت (نه IP مشترک دیتاسنتری پرمصرف) خطر محدود شدن را کم می‌کنند.",
  "انتشارها با فاصلهٔ تصادفی بین حداقل و حداکثر و تا سقف روزانه انجام می‌شوند؛ اگر اینستاگرام هشدار بدهد، حساب خودکار استراحت می‌کند.",
  "این روش API رسمی Meta نیست؛ با تغییرات اینستاگرام ممکن است بعضی وقت‌ها نیاز به به‌روزرسانی داشته باشد.",
];

function PaymentCard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-pay"], queryFn: () => api<any>("/admin/integrations/payment") });
  const [f, setF] = useState<any>(null);
  useEffect(() => { if (data) setF({ enabled: data.enabled, bank: data.bank, gateways: data.gateways }); }, [data]);
  const save = useMutation({
    mutationFn: () => api("/admin/integrations/payment", { method: "PUT", json: f }),
    onSuccess: (d: any) => { qc.setQueryData(["admin-pay"], d); qc.invalidateQueries({ queryKey: ["payments-config"] }); toast.success("درگاه ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!f || !data) return <FormSectionSkeleton fields={3} />;
  const bank = data.banks[f.bank];
  const g = f.gateways[f.bank] ?? {};
  const setG = (k: string, v: any) => setF({ ...f, gateways: { ...f.gateways, [f.bank]: { ...g, [k]: v } } });
  const LABELS: Record<string, string> = { MERCHANT_CODE: "مرچنت کد", TERMINAL_CODE: "شمارهٔ ترمینال", SECRET_KEY: "کلید امنیتی", USERNAME: "نام کاربری", PASSWORD: "رمز عبور" };
  return (
    <Card>
      <CardHeader title="درگاه پرداخت" subtitle="خرید آنلاین پلن با az-iranian-bank-gateways"
        action={<Chip tone={data.enabled ? "success" : "neutral"}>{data.enabled ? "فعال" : "غیرفعال"}</Chip>} />
      <div className="px-4 sm:px-5 pb-5 space-y-4">
        <label className="flex items-center gap-3 text-[14px]"><Switch checked={f.enabled} onChange={(v) => setF({ ...f, enabled: v })} />پرداخت آنلاین برای خرید پلن</label>
        <Field label="درگاه"><Select value={f.bank} onChange={(e) => setF({ ...f, bank: e.target.value })}>
          {Object.entries(data.banks).map(([code, b]: any) => <option key={code} value={code}>{b.label}</option>)}</Select></Field>
        {bank.fields.map((k: string) => (
          <Field key={k} label={LABELS[k] ?? k} hint={String(g[k] ?? "").startsWith("••••") ? "ذخیره شده؛ برای تغییر مقدار جدید وارد کن." : undefined}>
            <Input dir="ltr" className="text-left font-mono text-[13px]" type={k === "PASSWORD" || k === "SECRET_KEY" ? "password" : "text"}
              value={g[k] ?? ""} onFocus={(e) => String(g[k] ?? "").startsWith("••••") && (setG(k, ""), e.currentTarget.select())} onChange={(e) => setG(k, e.target.value)} />
          </Field>
        ))}
        {bank.sandbox && <label className="flex items-center gap-3 text-[14px]"><Switch checked={!!g.SANDBOX} onChange={(v) => setG("SANDBOX", v)} />حالت آزمایشی (Sandbox)</label>}
        <Field label="آدرس بازگشت از بانک" hint="باید از اینترنت در دسترس باشد؛ در بعضی درگاه‌ها باید در پنل درگاه هم ثبت شود.">
          <Input dir="ltr" readOnly className="text-left font-mono text-[13px]" value={data.callback_url} />
        </Field>
        <FormActions><Button loading={save.isPending} onClick={() => save.mutate()}>ذخیرهٔ درگاه</Button></FormActions>
      </div>
    </Card>
  );
}

/** LinkedIn: sellers sign in with their own account; pacing per account, and the messaging ids LinkedIn rotates. */
function LinkedInCard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-li"], queryFn: () => api<any>("/admin/integrations/linkedin") });
  const [f, setF] = useState<any>(null);
  const [advanced, setAdvanced] = useState(false);
  useEffect(() => { if (data) setF({ ...data, query_ids: { ...data.query_ids } }); }, [data]);
  const save = useMutation({
    mutationFn: () => api("/admin/integrations/linkedin", { method: "PUT", json: {
      enabled: f.enabled, daily_limit: Number(f.daily_limit), gap_min_minutes: Number(f.gap_min_minutes),
      gap_max_minutes: Number(f.gap_max_minutes), query_ids: f.query_ids } }),
    onSuccess: (d: any) => { qc.setQueryData(["admin-li"], d); qc.invalidateQueries({ queryKey: ["platforms"] }); toast.success("ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!f) return <FormSectionSkeleton fields={3} />;
  const qid = (k: string) => (e: any) => setF({ ...f, query_ids: { ...f.query_ids, [k]: e.target.value } });
  return (
    <Card>
      <CardHeader title="لینکدین" subtitle="ورود فروشنده با ایمیل و رمز یا کوکی: پست با عکس، جواب پیام و کامنت"
        action={<Chip tone={f.enabled ? "success" : "neutral"}>{f.enabled ? "فعال" : "غیرفعال"}</Chip>} />
      <div className="px-4 sm:px-5 pb-5 space-y-4">
        <label className="flex items-center gap-3 text-[14px]"><Switch checked={f.enabled} onChange={(v) => setF({ ...f, enabled: v })} />نمایش لینکدین برای فروشنده‌ها</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="سقف روزانهٔ پست هر حساب">
            <Input dir="ltr" type="number" min={1} max={20} className="text-left tnum" value={f.daily_limit} onChange={(e) => setF({ ...f, daily_limit: e.target.value })} />
          </Field>
          <Field label="حداقل فاصله (دقیقه)">
            <Input dir="ltr" type="number" min={10} className="text-left tnum" value={f.gap_min_minutes} onChange={(e) => setF({ ...f, gap_min_minutes: e.target.value })} />
          </Field>
          <Field label="حداکثر فاصله (دقیقه)">
            <Input dir="ltr" type="number" min={10} className="text-left tnum" value={f.gap_max_minutes} onChange={(e) => setF({ ...f, gap_max_minutes: e.target.value })} />
          </Field>
        </div>
        <p className="text-[12px] text-muted leading-6">
          همهٔ ترافیک حساب‌های لینکدین فقط از پروکسی‌های «لینکدین» در پنل ادمین › پروکسی‌ها می‌رود و هر حساب به یک پروکسی ثابت می‌چسبد. پیام‌ها هر ۲٫۵ تا ۵ دقیقه و کامنت‌ها هر ۱۰ تا ۱۵ دقیقه خوانده می‌شوند. این روش API رسمی لینکدین نیست و با تغییرات لینکدین ممکن است نیاز به به‌روزرسانی داشته باشد.
        </p>
        <button type="button" className="text-[13px] text-muted hover:text-fg transition-colors" onClick={() => setAdvanced(!advanced)}>
          {advanced ? "بستن تنظیمات پیشرفته" : "تنظیمات پیشرفته (شناسه‌های پیام لینکدین)"}
        </button>
        {advanced && <div className="space-y-3">
          <p className="text-[12px] text-muted">اگر خواندن پیام‌ها خطا داد، queryId تازه را از تب Network مرورگر (درخواست voyagerMessagingGraphQL) اینجا بگذار. خالی = پیش‌فرض.</p>
          {(["conversations", "messages"] as const).map((k) => (
            <Field key={k} label={k === "conversations" ? "queryId فهرست گفتگوها" : "queryId پیام‌های یک گفتگو"}>
              <Input dir="ltr" className="text-left font-mono text-[12px]" placeholder={f.default_query_ids?.[k]} value={f.query_ids?.[k] ?? ""} onChange={qid(k)} />
            </Field>
          ))}
        </div>}
        <FormActions><Button loading={save.isPending} onClick={() => save.mutate()}>ذخیرهٔ لینکدین</Button></FormActions>
      </div>
    </Card>
  );
}

function InstagramCrawlerCard() {
  const qc = useQueryClient();
  const { data, error } = useQuery({ queryKey: ["admin-ig-crawler"], queryFn: () => api<any>("/admin/integrations/instagram-crawler"), retry: 1 });
  const [f, setF] = useState<any>(null);
  useEffect(() => { if (data) setF({ ...data, token: "" }); }, [data]);
  const save = useMutation({
    mutationFn: () => api("/admin/integrations/instagram-crawler", { method: "PUT", json: {
      provider: f.provider, proxy: f.proxy, token: f.token ? f.token : null } }),
    onSuccess: (d: any) => { qc.setQueryData(["admin-ig-crawler"], d); setF({ ...d, token: "" }); toast.success("ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  const test = useMutation({
    mutationFn: () => api<any>("/admin/integrations/instagram-crawler/test", { method: "POST" }),
    onSuccess: (r: any) => (r.ok ? toast.success(r.message) : toast.error(r.message)),
    onError: (e: any) => toast.error(e.message),
  });
  if (error) return (
    <Card className="p-5 text-[14px] leading-7">
      <div className="font-bold">کرال اینستاگرام با آیدی پیج</div>
      <p className="text-danger">تنظیمات از سرور خوانده نشد: {(error as any).message}</p>
      <p className="text-muted text-[13px]">اگر بک‌اند تازه به‌روز نشده، در پوشهٔ بک‌اند git pull بزن و دوباره اجرایش کن.</p>
    </Card>
  );
  if (!f) return <FormSectionSkeleton fields={2} />;
  return (
    <Card>
      <CardHeader title="کرال اینستاگرام با آیدی پیج" subtitle="با ذخیرهٔ کلید، کرال اینستاگرام برای همهٔ فروشنده‌ها باز می‌شود؛ بدون کلید برایشان قفل است."
        action={<Chip tone={f.has_token ? "success" : "neutral"}>{f.has_token ? "فعال برای همه" : "قفل (کلید وارد نشده)"}</Chip>} />
      <div className="px-4 sm:px-5 pb-5 space-y-4">
        <Field label="سرویس کرال">
          <Select value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })}>
            {f.providers.map((p: any) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </Select>
        </Field>
        <Field label="API token" hint={f.has_token ? `ذخیره شده (${f.token_hint})؛ برای تغییر مقدار جدید وارد کن.` : "از console.apify.com ← Settings ← API & Integrations بگیر."}>
          <Input dir="ltr" type="password" className="text-left font-mono" placeholder={f.has_token ? "••••••••" : "apify_api_…"} value={f.token} onChange={(e) => setF({ ...f, token: e.target.value })} />
        </Field>
        <Field label="پروکسی تکی (اختیاری، قدیمی)" hint="بهتر است از صفحهٔ «پروکسی‌ها» استفاده کنی؛ این فقط وقتی استفاده می‌شود که هیچ پروکسی سالمی آنجا نباشد. مثل socks5://host:port">
          <Input dir="ltr" className="text-left font-mono text-[13px]" value={f.proxy} onChange={(e) => setF({ ...f, proxy: e.target.value })} />
        </Field>
        <FormActions>
          <Button variant="secondary" loading={test.isPending} disabled={!f.has_token} onClick={() => test.mutate()}>تست کلید</Button>
          <Button loading={save.isPending} onClick={() => save.mutate()}>ذخیره</Button>
        </FormActions>
      </div>
    </Card>
  );
}

export default function Integrations() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-ig"], queryFn: () => api<any>("/admin/integrations/instagram") });
  const [f, setF] = useState<any>(null);
  useEffect(() => { if (data) setF({ ...data, app_secret: "" }); }, [data]);
  const save = useMutation({
    mutationFn: () => api("/admin/integrations/instagram", { method: "PUT", json: {
      enabled: f.enabled, app_id: f.app_id, proxy: f.proxy, app_secret: f.app_secret ? f.app_secret : null, method: f.method,
      daily_limit: Number(f.daily_limit), gap_min_minutes: Number(f.gap_min_minutes), gap_max_minutes: Number(f.gap_max_minutes) } }),
    onSuccess: (d: any) => { qc.setQueryData(["admin-ig"], d); qc.invalidateQueries({ queryKey: ["platforms"] }); toast.success("ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!f) return <FormSectionSkeleton fields={4} />;
  const copy = () => { navigator.clipboard.writeText(f.redirect_uri); toast.success("کپی شد"); };
  const login = f.method !== "oauth";

  return (
    <>
      <PageHeader title="یکپارچه‌سازی‌ها" subtitle="درگاه پرداخت، کرال اینستاگرام و اتصال اپ Meta برای اینستاگرام." />
      <div className="mb-4 max-w-3xl space-y-4"><PaymentCard /><InstagramCrawlerCard /><LinkedInCard /></div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 items-start">
        <Card>
          <CardHeader title="اینستاگرام" subtitle={login ? "ورود با نام کاربری و رمز (پست، استوری، ریلز)" : "Instagram API with Instagram Login"}
            action={<Chip tone={f.enabled && (login || f.oauth_ready) ? "success" : "neutral"}>{f.enabled ? (login || f.oauth_ready ? "فعال" : "ناقص") : "غیرفعال"}</Chip>} />
          <div className="px-4 sm:px-5 pb-5 space-y-4">
            <label className="flex items-center gap-3 text-[14px]"><Switch checked={f.enabled} onChange={(v) => setF({ ...f, enabled: v })} />نمایش اینستاگرام برای فروشنده‌ها</label>
            <Field label="روش اتصال فروشنده‌ها">
              <Select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} aria-label="روش اتصال">
                <option value="login">نام کاربری و رمز (بدون اپ Meta)</option>
                <option value="oauth">API رسمی Meta (نیاز به اپ تأییدشده)</option>
              </Select>
            </Field>
            {login && <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="سقف روزانهٔ هر حساب" hint="پست، استوری و ریلز با هم">
                <Input dir="ltr" type="number" min={1} max={50} className="text-left tnum" value={f.daily_limit} onChange={(e) => setF({ ...f, daily_limit: e.target.value })} />
              </Field>
              <Field label="حداقل فاصله (دقیقه)">
                <Input dir="ltr" type="number" min={1} className="text-left tnum" value={f.gap_min_minutes} onChange={(e) => setF({ ...f, gap_min_minutes: e.target.value })} />
              </Field>
              <Field label="حداکثر فاصله (دقیقه)">
                <Input dir="ltr" type="number" min={1} className="text-left tnum" value={f.gap_max_minutes} onChange={(e) => setF({ ...f, gap_max_minutes: e.target.value })} />
              </Field>
            </div>}
            {!login && <>
            <Field label="Instagram app ID"><Input dir="ltr" className="text-left tnum" value={f.app_id} onChange={(e) => setF({ ...f, app_id: e.target.value })} /></Field>
            <Field label="Instagram app secret" hint={f.has_secret ? "ذخیره شده؛ برای تغییر مقدار جدید وارد کن." : "هنوز وارد نشده."}>
              <Input dir="ltr" type="password" className="text-left font-mono" placeholder={f.has_secret ? "••••••••" : ""} value={f.app_secret} onChange={(e) => setF({ ...f, app_secret: e.target.value })} />
            </Field>
            <Field label="پروکسی تکی (اختیاری، قدیمی)" hint="بهتر است از صفحهٔ «پروکسی‌ها» استفاده کنی؛ این فقط وقتی استفاده می‌شود که هیچ پروکسی سالمی آنجا نباشد.">
              <Input dir="ltr" className="text-left font-mono text-[13px]" value={f.proxy} onChange={(e) => setF({ ...f, proxy: e.target.value })} />
            </Field>
            <Field label="Redirect URI">
              <div className="flex gap-2"><Input dir="ltr" readOnly className="text-left font-mono text-[13px]" value={f.redirect_uri} />
                <Button variant="secondary" icon={<Copy className="size-4" />} onClick={copy} aria-label="کپی" /></div>
            </Field>
            <div className="text-[12px] text-muted" dir="ltr">scopes: {f.scopes}</div>
            </>}
            <FormActions><Button loading={save.isPending} onClick={() => save.mutate()}>ذخیرهٔ اینستاگرام</Button></FormActions>
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-bold mb-3">راه‌اندازی</div>
          <ol className="list-decimal ps-5 space-y-2 text-[13px] text-muted leading-6">{(login ? LOGIN_STEPS : STEPS).map((s) => <li key={s}>{s}</li>)}</ol>
        </Card>
      </div>
    </>
  );
}
