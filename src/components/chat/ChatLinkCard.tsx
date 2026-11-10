"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Link2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useStoreId } from "@/lib/hooks";
import { Button, Card, Field, Input, Switch, Textarea } from "@/components/ui/primitives";

/** The store's own chat page («لینک چت») for the Instagram / Telegram bio: copy the link, change its address, greeting. */
export function ChatLinkCard() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const key = ["chat-link", sid];
  const { data } = useQuery({ queryKey: key, queryFn: () => api(`/stores/${sid}/chat-link`) });
  const [editing, setEditing] = useState(false);
  const [slug, setSlug] = useState("");
  const [greeting, setGreeting] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (data) { setSlug(data.slug); setGreeting(data.greeting); } }, [data]);
  const save = useMutation({
    mutationFn: (body: any) => api(`/stores/${sid}/chat-link`, { method: "PUT", json: body }),
    onSuccess: (r) => { qc.setQueryData(key, r); setEditing(false); toast.success("ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!data) return <div className="h-36 rounded-card bg-subtle shimmer mb-6" />;
  const copy = async () => { try { await navigator.clipboard.writeText(data.url); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { toast.error("کپی نشد؛ لینک را دستی انتخاب کن."); } };

  return (
    <Card className="p-5 mb-6">
      <div className="flex items-start gap-3">
        <span className="size-10 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0"><Link2 className="size-5" /></span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="font-bold">لینک چت فروشگاه</div>
            <Switch checked={data.enabled} onChange={(v) => save.mutate({ enabled: v })} label="روشن" disabled={save.isPending} />
          </div>
          <p className="text-[13px] text-muted mt-0.5 leading-6">این لینک را در بیو اینستاگرام یا کانال تلگرامت بگذار. مشتری اسمش را می‌نویسد و با همین دستیار گفتگو می‌کند، سفارش می‌دهد و فیش می‌فرستد؛ گفتگوها و سفارش‌ها همین‌جا کنار بقیه می‌آیند.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <code dir="ltr" className="flex-1 min-w-0 truncate text-left font-mono text-[14px] font-bold rounded-control bg-subtle px-3 h-11 leading-[44px]">{data.url}</code>
        <Button variant="secondary" icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />} onClick={copy}>{copied ? "کپی شد" : "کپی"}</Button>
        <a href={data.url} target="_blank" rel="noreferrer"><Button variant="ghost" icon={<ExternalLink className="size-4" />}>باز کردن</Button></a>
        <Button variant="ghost" icon={<Pencil className="size-4" />} onClick={() => setEditing((v) => !v)}>ویرایش</Button>
      </div>
      {!data.assistant_on && data.enabled && <p className="text-[13px] bg-warning/10 rounded-xl p-3 mt-3">دستیار خاموش است؛ پیام‌ها می‌رسند ولی جواب خودکار داده نمی‌شود. از تب «دستیار» روشنش کن.</p>}
      <p className="text-[12px] text-muted mt-3 leading-6">
        نکته: اگر به انتهای لینک <code dir="ltr" className="font-mono">?name=</code> و بعد اسم مشتری را اضافه کنی، اسمش از قبل پر می‌شود (مثلاً وقتی لینک را برای یک مشتری خاص می‌فرستی).
      </p>
      {editing && (
        <form className="mt-4 pt-4 border-t border-edge space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate({ slug, greeting }); }}>
          <Field label="آدرس لینک" hint="حروف انگلیسی کوچک، عدد و خط تیره. با عوض کردنش لینک قبلی دیگر کار نمی‌کند.">
            <div className="flex items-center gap-2" dir="ltr">
              <span className="text-[13px] text-muted font-mono shrink-0">{data.url.slice(0, data.url.length - data.slug.length)}</span>
              <Input dir="ltr" className="text-left font-mono" value={slug} maxLength={32} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required />
            </div>
          </Field>
          <Field label="پیام خوشامد بالای چت" hint="خالی بگذاری، متن پیش‌فرض نمایش داده می‌شود.">
            <Textarea rows={2} maxLength={300} value={greeting} placeholder={data.default_greeting} onChange={(e) => setGreeting(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" loading={save.isPending}>ذخیره</Button>
            <Button type="button" variant="ghost" onClick={() => { setEditing(false); setSlug(data.slug); setGreeting(data.greeting); }}>انصراف</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
