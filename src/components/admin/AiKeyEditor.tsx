"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useMe } from "@/lib/hooks";
import { Button, Dialog, Field, Input, Select, Switch } from "@/components/ui/primitives";

export const KIND_LABEL: Record<string, string> = { gemini: "Google Gemini", metis: "Gemini از طریق متیس", openai: "OpenAI سازگار", openrouter: "OpenRouter", anthropic: "Claude" };
export const EMPTY_KEY = { name: "", kind: "gemini", base_url: "", proxy: "", default_model: "gemini-3.6-flash", input_price_per_m: 0, output_price_per_m: 0, monthly_budget_toman: 0, is_active: true };

export function KeyEditor({ value, kinds, onClose }: { value: any; kinds: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [k, setK] = useState<any>({ api_key: "", ...value });
  const kindInfo = kinds.find((x) => x.kind === k.kind);
  const models = useMutation({
    mutationFn: () => api<{ models: string[] }>(`/admin/ai/models${value.id ? `?provider_id=${value.id}` : ""}`, {
      method: "POST", json: { kind: k.kind, base_url: k.base_url, api_key: k.api_key, proxy: k.proxy ?? "" } }),
    onSuccess: (r) => {
      if (!r.models.length) return toast.error("مدلی برای این کلید پیدا نشد.");
      if (!r.models.includes(k.default_model)) setK((cur: any) => ({ ...cur, default_model: r.models.find((m) => m === "gemini-3.6-flash") ?? r.models.find((m) => m.includes("flash")) ?? r.models[0] }));
      toast.success(`${r.models.length} مدل پیدا شد`);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const save = useMutation({
    mutationFn: () => api(value.id ? `/admin/ai/providers/${value.id}` : "/admin/ai/providers", { method: value.id ? "PUT" : "POST", json: k }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ai-providers"] }); qc.invalidateQueries({ queryKey: ["ai-status"] }); toast.success("ذخیره شد"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open onClose={onClose} title={value.id ? "ویرایش کلید" : "افزودن کلید AI"}>
      <div className="space-y-3">
        <Field label="نام نمایشی"><Input value={k.name} onChange={(e) => setK({ ...k, name: e.target.value })} placeholder="مثلاً Gemini اصلی" /></Field>
        <Field label="نوع سرویس"><Select value={k.kind} onChange={(e) => setK({ ...k, kind: e.target.value, base_url: "", default_model: kinds.find((x) => x.kind === e.target.value)?.model ?? k.default_model })}>
          {kinds.map((x) => <option key={x.kind} value={x.kind}>{x.label}</option>)}</Select></Field>
        <Field label="آدرس پایه (Base URL)" hint={kindInfo?.hint || `پیش‌فرض: ${kindInfo?.base_url}`}>
          <Input dir="ltr" className="text-left" value={k.base_url} placeholder={kindInfo?.base_url} onChange={(e) => setK({ ...k, base_url: e.target.value })} />
        </Field>
        <Field label="کلید API" hint={value.id ? `کلید فعلی: ••••${value.key_hint}؛ برای تغییر، کلید جدید وارد کنید` : "رمزنگاری‌شده ذخیره می‌شود و دیگر نمایش داده نمی‌شود"}>
          <Input dir="ltr" type="password" className="text-left font-mono" value={k.api_key} onChange={(e) => setK({ ...k, api_key: e.target.value })} autoComplete="off" />
        </Field>
        <Field label="پروکسی (اختیاری)" hint={k.kind === "metis" ? "متیس از داخل ایران پروکسی لازم ندارد." : "گوگل، OpenAI، OpenRouter و Anthropic درخواست ایران را رد می‌کنند؛ اگر سرور داخل ایران است: http://user:pass@host:port یا socks5://host:port"}>
          <Input dir="ltr" className="text-left font-mono text-[13px]" value={k.proxy ?? ""} onChange={(e) => setK({ ...k, proxy: e.target.value })} placeholder="socks5://127.0.0.1:1080" />
        </Field>
        <Field label="مدل پیش‌فرض" hint="«دریافت مدل‌ها» فقط مدل‌های متنی مناسب را می‌آورد (مدل‌های صوتی، TTS و تصویری حذف می‌شوند). مدل تصویری را در «مسیردهی کارها» برای تمیز کردن عکس انتخاب کن.">
          <div className="flex gap-2">
            {models.data?.models.length ? (
              <Select dir="ltr" className="text-left" value={k.default_model} onChange={(e) => setK({ ...k, default_model: e.target.value })}>
                {!models.data.models.includes(k.default_model) && k.default_model && <option value={k.default_model}>{k.default_model}</option>}
                {models.data.models.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            ) : (
              <Input dir="ltr" className="text-left" value={k.default_model} placeholder="gemini-3.6-flash" onChange={(e) => setK({ ...k, default_model: e.target.value })} />
            )}
            <Button type="button" variant="secondary" loading={models.isPending} disabled={!value.id && !k.api_key} onClick={() => models.mutate()}>دریافت مدل‌ها</Button>
          </div>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Field label="قیمت ورودی/۱M توکن"><Input dir="ltr" type="number" value={k.input_price_per_m} onChange={(e) => setK({ ...k, input_price_per_m: Number(e.target.value) })} /></Field>
          <Field label="قیمت خروجی/۱M توکن"><Input dir="ltr" type="number" value={k.output_price_per_m} onChange={(e) => setK({ ...k, output_price_per_m: Number(e.target.value) })} /></Field>
          <Field label="بودجهٔ ماهانه"><Input dir="ltr" type="number" value={k.monthly_budget_toman} onChange={(e) => setK({ ...k, monthly_budget_toman: Number(e.target.value) })} /></Field>
        </div>
        <p className="text-[12px] text-muted">قیمت‌ها به تومان و فقط برای تخمین هزینه در مانیتورینگ استفاده می‌شوند.</p>
        <label className="flex items-center gap-2 text-[14px]"><Switch checked={k.is_active} onChange={(v) => setK({ ...k, is_active: v })} />فعال</label>
        <Button className="w-full" loading={save.isPending} disabled={!k.name || (!value.id && !k.api_key)} onClick={() => save.mutate()}>ذخیره</Button>
      </div>
    </Dialog>
  );
}

/** Admin-only shortcut to add an AI key from any page; renders nothing for sellers. */
export function AddAiKeyButton({ label = "افزودن کلید AI", variant = "secondary", size = "md" }: { label?: string; variant?: "primary" | "secondary"; size?: "sm" | "md" }) {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const isAdmin = me?.role === "admin";
  const { data } = useQuery({ queryKey: ["ai-providers"], queryFn: () => api("/admin/ai/providers"), enabled: isAdmin && open });
  if (!isAdmin) return null;
  return (
    <>
      <Button variant={variant} size={size} icon={<KeyRound className="size-4" />} onClick={() => setOpen(true)}>{label}</Button>
      {open && data && <KeyEditor value={EMPTY_KEY} kinds={data.kinds ?? []} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Shown on AI-powered pages while no AI key is configured. Admins can add one right here. */
export function AiSetupBanner() {
  const { data } = useQuery({ queryKey: ["ai-status"], queryFn: () => api<{ available: boolean }>("/ai/status"), staleTime: 60_000 });
  const { data: me } = useMe();
  if (!data || data.available) return null;
  const isAdmin = me?.role === "admin";
  return (
    <div className="fade-in mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-ai/25 bg-ai/8 px-4 py-3">
      <Sparkles className="size-5 text-ai shrink-0" aria-hidden />
      <p className="flex-1 min-w-48 text-[13px] leading-6">
        <b>هوش مصنوعی هنوز فعال نیست.</b>{" "}
        {isAdmin ? "یک کلید AI اضافه کن تا ساخت محصول با AI و کرال هوشمند کار کنند." : "ادمین باید کلید AI را در پنل ادمین اضافه کند."}
      </p>
      <AddAiKeyButton variant="primary" size="sm" />
    </div>
  );
}
