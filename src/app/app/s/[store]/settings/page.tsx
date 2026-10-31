"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useStoreId } from "@/lib/hooks";
import { Button, Card, Field, Input, PageHeader, Switch, Textarea } from "@/components/ui/primitives";

export default function Settings() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const { data: store } = useQuery({ queryKey: ["store", sid], queryFn: () => api(`/stores/${sid}`) });
  const [f, setF] = useState<any>(null);
  useEffect(() => { if (store) setF(store); }, [store]);
  const save = useMutation({
    mutationFn: () => api(`/stores/${sid}`, { method: "PATCH", json: { name: f.name, category: f.category, logo_url: f.logo_url, settings: f.settings } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stores"] }); qc.invalidateQueries({ queryKey: ["store", sid] }); toast.success("ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!f) return null;
  const s = f.settings;
  const setS = (k: string, v: any) => setF({ ...f, settings: { ...s, [k]: v } });
  return (
    <>
      <PageHeader title="تنظیمات فروشگاه" actions={<Button loading={save.isPending} onClick={() => save.mutate()}>ذخیره</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Card className="p-5 space-y-4">
          <Field label="نام فروشگاه"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="دسته"><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
          <Field label="امضای انتهای پست" hint="مثلاً آیدی پشتیبانی یا «ارسال به سراسر ایران»"><Textarea rows={2} value={s.caption_signature} onChange={(e) => setS("caption_signature", e.target.value)} /></Field>
        </Card>
        <Card className="p-5 space-y-4">
          <label className="flex items-center justify-between gap-3 text-[14px]">نمایش قیمت در کپشن پست‌ها<Switch checked={s.show_price_in_caption} onChange={(v) => setS("show_price_in_caption", v)} /></label>
          <label className="flex items-center justify-between gap-3 text-[14px]"><span>محصولات کرال‌شده اول به صندوق ورودی بروند<span className="block text-[12px] text-muted">تا قبل از تأیید تو محصول نهایی نشوند</span></span><Switch checked={s.crawl_to_inbox} onChange={(v) => setS("crawl_to_inbox", v)} /></label>
        </Card>
      </div>
    </>
  );
}
