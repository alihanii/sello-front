"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, PartyPopper, Send, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Logo } from "@/components/shell/AppShell";
import { OperationWatcher } from "@/components/OperationWatcher";
import { ImageUploader } from "@/components/products/ImageUploader";
import { PlatformIcon } from "@/components/ui/status";
import { Button, Card, Field, Input, Textarea, cn } from "@/components/ui/primitives";

const STEPS = ["فروشگاه", "کانال", "اولین محصول", "انتشار"];

export default function Onboarding() {
  const router = useRouter();
  const sp = useSearchParams();
  const qc = useQueryClient();
  const [step, setStep] = useState(sp.get("store") ? 1 : 0);
  const [storeId, setStoreId] = useState<number>(Number(sp.get("store")) || 0);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<"telegram" | "bale">("telegram");
  const [conn, setConn] = useState({ bot_token: "", chat_id: "" });
  const [connectOp, setConnectOp] = useState<number | null>(null);
  const [channelId, setChannelId] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [price, setPrice] = useState("");
  const [aiOp, setAiOp] = useState<number | null>(null);
  const [productId, setProductId] = useState<number | null>(null);
  const [publishOp, setPublishOp] = useState<number | null>(null);

  const createStore = useMutation({
    mutationFn: () => api("/stores", { method: "POST", json: { name } }),
    onSuccess: (s) => { setStoreId(s.id); qc.invalidateQueries({ queryKey: ["stores"] }); setStep(1); },
    onError: (e: any) => toast.error(e.message),
  });
  const connect = useMutation({
    mutationFn: () => api(`/stores/${storeId}/channels/connect`, { method: "POST", json: { platform, data: conn } }),
    onSuccess: (op) => setConnectOp(op.id),
    onError: (e: any) => toast.error(e.message),
  });
  const generate = useMutation({
    mutationFn: () => api(`/stores/${storeId}/reference-sets`, { method: "POST", json: { images, note, price: Number(price.replace(/\D/g, "") || 0), use_style_profile: false } }),
    onSuccess: (ops) => setAiOp(ops[0].id),
    onError: (e: any) => toast.error(e.message),
  });
  const manual = useMutation({
    mutationFn: () => api(`/stores/${storeId}/products`, { method: "POST", json: { title: note.split("\n")[0] || "محصول من", description: note, images, price: Number(price.replace(/\D/g, "") || 0) } }),
    onSuccess: (p) => { setProductId(p.id); setStep(3); },
    onError: (e: any) => toast.error(e.message),
  });
  const publish = useMutation({
    mutationFn: async () => {
      await api(`/products/${productId}`, { method: "PATCH", json: { status: "ready" } });
      return api(`/products/${productId}/publish`, { method: "POST", json: { channel_ids: [channelId] } });
    },
    onSuccess: (ops) => setPublishOp(ops[0].id),
    onError: (e: any) => toast.error(e.message),
  });
  const finish = async () => {
    await api("/auth/me", { method: "PATCH", json: { onboarded: true } });
    qc.invalidateQueries({ queryKey: ["me"] });
    router.replace(`/app/s/${storeId}${productId ? `/products/${productId}` : ""}`);
  };
  const { data: product } = useQuery({ queryKey: ["product", String(productId)], queryFn: () => api(`/products/${productId}`), enabled: !!productId });

  return (
    <div className="min-h-dvh max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8"><Logo /><Button variant="ghost" size="sm" onClick={finish} disabled={!storeId}>رد شدن</Button></div>
      <ol className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={cn("h-1.5 rounded-full transition-all", i <= step ? "bg-primary" : "bg-subtle")} />
            <div className={cn("text-[12px] mt-1.5 font-semibold", i === step ? "text-fg" : "text-muted")}>{s}</div>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card strong className="p-7 space-y-5">
          <div><h1 className="text-[22px] font-black">به Sello خوش آمدی 👋</h1><p className="text-muted">اول یک فروشگاه بساز. بعداً می‌توانی فروشگاه‌های بیشتری اضافه کنی.</p></div>
          <Field label="نام فروشگاه"><Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً بوتیک مهتاب" /></Field>
          <Button size="lg" className="w-full" disabled={!name.trim()} loading={createStore.isPending} onClick={() => createStore.mutate()}>ادامه</Button>
        </Card>
      )}

      {step === 1 && (
        <Card strong className="p-7 space-y-5">
          <div><h1 className="text-[22px] font-black">کانالت را وصل کن</h1><p className="text-muted">سریع‌ترین راه: ربات تلگرام یا بله. ربات را بساز، ادمین کانالت کن و توکنش را بده.</p></div>
          <div className="grid grid-cols-2 gap-2">
            {(["telegram", "bale"] as const).map((p) => (
              <button key={p} onClick={() => setPlatform(p)} className={cn("p-4 rounded-xl border flex items-center gap-3 cursor-pointer", platform === p ? "border-primary bg-primary/8" : "border-edge")}>
                <PlatformIcon platform={p} size={32} /><span className="font-bold">{p === "telegram" ? "تلگرام" : "بله"}</span>
              </button>
            ))}
          </div>
          {connectOp ? (
            <OperationWatcher opId={connectOp} storeId={storeId} onDone={async (o) => {
              if (o.status === "succeeded") { setChannelId(o.channel_id); setTimeout(() => setStep(2), 900); } else setConnectOp(null);
            }} />
          ) : <>
            <Field label="توکن ربات"><Input dir="ltr" className="text-left font-mono text-[13px]" value={conn.bot_token} onChange={(e) => setConn({ ...conn, bot_token: e.target.value })} /></Field>
            <Field label="آیدی کانال"><Input dir="ltr" className="text-left" placeholder="@myshop" value={conn.chat_id} onChange={(e) => setConn({ ...conn, chat_id: e.target.value })} /></Field>
            <div className="flex gap-2">
              <Button size="lg" className="flex-1" disabled={!conn.bot_token || !conn.chat_id} loading={connect.isPending} onClick={() => connect.mutate()}>اتصال</Button>
              <Button size="lg" variant="ghost" onClick={() => setStep(2)}>بعداً</Button>
            </div>
          </>}
        </Card>
      )}

      {step === 2 && (
        <Card strong className="p-7 space-y-5">
          <div><h1 className="text-[22px] font-black">اولین محصول</h1><p className="text-muted">یک عکس و یک خط توضیح بده؛ AI بقیه را می‌نویسد.</p></div>
          <ImageUploader storeId={storeId} value={images} onChange={setImages} max={4} />
          <Field label="توضیح کوتاه"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلاً: شال نخی تابستانه، ۵ رنگ" /></Field>
          <Field label="قیمت (تومان)"><Input dir="ltr" className="text-left tnum" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
          {aiOp ? (
            <OperationWatcher opId={aiOp} storeId={storeId} onDone={(o) => {
              if (o.result?.product_id) { setProductId(o.result.product_id); setTimeout(() => setStep(3), 900); }
            }} />
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="ai" size="lg" className="flex-1" icon={<Sparkles className="size-4" />} disabled={!images.length && !note.trim()} loading={generate.isPending} onClick={() => generate.mutate()}>ساخت با AI</Button>
              <Button variant="secondary" size="lg" disabled={!note.trim()} loading={manual.isPending} onClick={() => manual.mutate()}>بدون AI ذخیره کن</Button>
            </div>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card strong className="p-7 space-y-5">
          <div><h1 className="text-[22px] font-black flex items-center gap-2">آماده است <PartyPopper className="size-6 text-ai" /></h1>
            <p className="text-muted">این محصولی است که ساخته شد. با یک کلیک در کانالت منتشرش کن و مراحلش را زنده ببین.</p></div>
          {product && (
            <div className="rounded-2xl bg-subtle p-4">
              <div className="font-bold">{product.title}</div>
              <p className="text-[14px] text-muted mt-1 line-clamp-4 whitespace-pre-line">{product.description}</p>
            </div>
          )}
          {publishOp ? (
            <>
              <OperationWatcher opId={publishOp} storeId={storeId} />
              <Button size="lg" className="w-full" icon={<Check className="size-4" />} onClick={finish}>رفتن به پنل</Button>
            </>
          ) : channelId ? (
            <Button size="lg" className="w-full" icon={<Send className="size-4" />} loading={publish.isPending} onClick={() => publish.mutate()}>انتشار در کانال</Button>
          ) : (
            <Button size="lg" className="w-full" onClick={finish}>رفتن به پنل</Button>
          )}
        </Card>
      )}
    </div>
  );
}
