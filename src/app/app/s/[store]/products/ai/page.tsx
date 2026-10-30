"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, Link2, Palette, Plus, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { api, mediaUrl } from "@/lib/api";
import { faNum } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { ImageUploader } from "@/components/products/ImageUploader";
import { OperationWatcher } from "@/components/OperationWatcher";
import { Button, Card, CardHeader, Chip, Field, Input, PageHeader, Switch, Textarea } from "@/components/ui/primitives";
import { AiSetupBanner } from "@/components/admin/AiKeyEditor";

export default function AiCreate() {
  const sid = useStoreId();
  const [images, setImages] = useState<string[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [useStyle, setUseStyle] = useState(true);
  const [bulk, setBulk] = useState(false);
  const [samples, setSamples] = useState<number[]>([]);
  const [ops, setOps] = useState<any[]>([]);
  const [done, setDone] = useState<Record<number, any>>({});
  const { data: profile } = useQuery({ queryKey: ["style", sid], queryFn: () => api(`/stores/${sid}/style-profile`) });
  const { data: golden } = useQuery({ queryKey: ["products", sid, "golden"], queryFn: () => api(`/stores/${sid}/products?size=12`) });

  const go = useMutation({
    mutationFn: () => api(`/stores/${sid}/reference-sets`, { method: "POST", json: {
      images, urls, note, price: Number(price.replace(/\D/g, "") || 0), stock_qty: Number(stock || 0), use_style_profile: useStyle,
      product_ids: samples, bulk } }),
    onSuccess: (r) => { setOps(r); setDone({}); },
    onError: (e: any) => toast.error(e.message),
  });
  const rebuild = useMutation({
    mutationFn: () => api(`/stores/${sid}/style-profile/rebuild`, { method: "POST" }),
    onSuccess: (op) => setOps([op]),
    onError: (e: any) => toast.error(e.message),
  });
  const addUrl = () => { if (/^https?:\/\//.test(url)) { setUrls([...new Set([...urls, url])]); setUrl(""); } else toast.error("لینک باید با http شروع شود"); };

  return (
    <>
      <PageHeader title="ساخت محصول با AI" subtitle="عکس، لینک یا سبک محصولات قبلی‌ات را بده؛ AI محصول کامل می‌سازد و قبل از ذخیره بازبینی می‌کنی." />
      <AiSetupBanner />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader title={<span className="flex items-center gap-2"><ImageIcon className="size-4 text-primary" />عکس محصول</span>} subtitle="AI نوع، رنگ، جنس و جزئیات را از عکس درمی‌آورد" />
            <div className="px-5 pb-5"><ImageUploader storeId={sid} value={images} onChange={setImages} /></div>
          </Card>
          <Card>
            <CardHeader title={<span className="flex items-center gap-2"><Link2 className="size-4 text-crawl" />لینک محصول مرجع</span>}
              subtitle="صفحه را کرال می‌کنیم و ساختار و ویژگی‌هایش را الگو می‌گیریم؛ متن و عکس آن کپی نمی‌شود" />
            <div className="px-5 pb-5 space-y-2">
              <div className="flex gap-2">
                <Input dir="ltr" className="text-left" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())} />
                <Button variant="secondary" onClick={addUrl} aria-label="افزودن لینک"><Plus className="size-4" /></Button>
              </div>
              {urls.map((u) => (
                <div key={u} className="flex items-center gap-2 text-[13px] bg-subtle rounded-lg px-3 py-2" dir="ltr">
                  <span className="flex-1 truncate">{u}</span>
                  <button className="cursor-pointer" aria-label="حذف" onClick={() => setUrls(urls.filter((x) => x !== u))}><X className="size-3.5" /></button>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title={<span className="flex items-center gap-2"><Palette className="size-4 text-ai" />سبک فروشگاه</span>}
              subtitle="محصول جدید شبیه محصولات قبلی کانالت نوشته می‌شود"
              action={<Switch checked={useStyle} onChange={setUseStyle} label="استفاده از سبک فروشگاه" />} />
            {useStyle && (
              <div className="px-5 pb-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  {profile?.profile ? <Chip tone="ai">پروفایل سبک آماده است · لحن {profile.profile.tone === "formal" ? "رسمی" : "صمیمی"}</Chip>
                    : <Chip>هنوز پروفایل سبک ساخته نشده</Chip>}
                  <Button size="sm" variant="ghost" loading={rebuild.isPending} onClick={() => rebuild.mutate()}>{profile?.profile ? "به‌روزرسانی پروفایل" : "ساخت پروفایل از محصولات"}</Button>
                </div>
                <div className="text-[13px] font-semibold">نمونه‌ها (اختیاری): محصولاتی که AI باید شبیه‌شان بنویسد</div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {golden?.items?.filter((p: any) => p.source !== "ai").map((p: any) => (
                    <button key={p.id} onClick={() => setSamples(samples.includes(p.id) ? samples.filter((x) => x !== p.id) : [...samples, p.id])}
                      className={`shrink-0 w-28 rounded-xl p-1.5 text-start border cursor-pointer ${samples.includes(p.id) ? "border-ai bg-ai/8" : "border-edge"}`}>
                      <div className="aspect-square rounded-lg bg-subtle overflow-hidden">{p.images[0] && <img src={mediaUrl(p.images[0].url)} alt="" className="size-full object-cover" />}</div>
                      <div className="text-[11px] line-clamp-2 mt-1">{p.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
        <div className="space-y-4 lg:sticky lg:top-24">
          <Card className="p-5 space-y-4">
            <Field label="توضیح شما (اختیاری)"><Textarea rows={3} placeholder="مثلاً: مانتو لینن، سایز ۳۸ تا ۴۶، ارسال رایگان" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="قیمت (تومان)"><Input dir="ltr" className="text-left tnum" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
              <Field label="موجودی"><Input dir="ltr" className="text-left tnum" value={stock} onChange={(e) => setStock(e.target.value)} /></Field>
            </div>
            <label className="flex items-center justify-between gap-3 text-[14px]">
              <span>تولید گروهی<span className="block text-muted text-[12px]">برای هر عکس یا لینک یک محصول جدا</span></span>
              <Switch checked={bulk} onChange={setBulk} label="تولید گروهی" />
            </label>
            <Button variant="ai" size="lg" className="w-full" icon={<Sparkles className="size-4" />} loading={go.isPending}
              disabled={!images.length && !urls.length && !note.trim()} onClick={() => go.mutate()}>
              {bulk && images.length + urls.length > 1 ? `ساخت ${faNum(images.length + urls.length)} محصول` : "ساخت محصول"}
            </Button>
          </Card>
          {ops.map((op) => (
            <div key={op.id} className="space-y-2">
              <OperationWatcher opId={op.id} storeId={sid} onDone={(o) => setDone((d) => (d[o.id] ? d : { ...d, [o.id]: o }))} />
              {done[op.id]?.result?.product_id && (
                <Link href={`/app/s/${sid}/products/${done[op.id].result.product_id}`}><Button className="w-full">بازبینی و ذخیرهٔ محصول</Button></Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
