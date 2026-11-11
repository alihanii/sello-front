"use client";

import { ImagePlus, Loader2, MessageCircleOff, Phone, Send, Store, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { API_URL, mediaUrl } from "@/lib/api";
import { faDigits } from "@/lib/format";
import { Button, Card, Input, cn } from "@/components/ui/primitives";
import { Logo } from "@/components/shell/Brand";

type Msg = { id: number; role: "customer" | "ai" | "seller"; text: string; image_url: string; buttons: string[][] | null; created_at?: string };
type Page = { slug: string; name: string; logo_url: string; greeting: string; assistant_on: boolean; menu: string[][]; phone_button: string };

async function call<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  let body = init.body;
  if (init.json !== undefined) { headers.set("Content-Type", "application/json"); body = JSON.stringify(init.json); }
  let res: Response;
  try { res = await fetch(`${API_URL}/api/v1/public/chat/${path}`, { ...init, headers, body }); } catch { throw new Error("ارتباط با سرور برقرار نشد."); }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(data?.detail?.message ?? "خطایی رخ داد."), { status: res.status });
  return data as T;
}

/** New messages into the list: each id once, and a saved customer message replaces its "sending…" copy. */
function merge(list: Msg[], incoming: Msg[]): Msg[] {
  let out = list;
  for (const m of incoming) {
    if (out.some((x) => x.id === m.id)) continue;
    if (m.role === "customer") {
      const temp = out.find((x) => x.id < 0 && x.role === "customer" && x.text === m.text && !!x.image_url === !!m.image_url);
      if (temp) out = out.filter((x) => x !== temp);
    }
    out = [...out, m];
  }
  return [...out.filter((x) => x.id > 0).sort((a, b) => a.id - b.id), ...out.filter((x) => x.id < 0)];
}

const toLatin = (s: string) => s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

/**
 * The store's own chat page (`/c/<slug>`), for the Instagram / Telegram bio. Same assistant and journey as the
 * store's Telegram / Bale bot: the welcome, tap-to-answer buttons, the cart and order buttons under the chat, sending
 * the phone number, product photos, and sending a photo (a receipt, a design to print, a product to find). The chat
 * is in the seller's panel with the others, and the seller's own replies show up here by polling.
 */
function ChatPage() {
  const { slug } = useParams<{ slug: string }>();
  const sp = useSearchParams();
  const key = `sello-chat:${slug}`;
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [draftName, setDraftName] = useState("");
  const [visitor, setVisitor] = useState("");
  const [ready, setReady] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState("");
  const [notice, setNotice] = useState("");
  // The server pushes new messages (Server-Sent Events) while the page is used; it lets go after an hour of nothing
  // new and the page opens it again on the next message or when the customer comes back to the tab.
  const [live, setLive] = useState(true);
  const lastRef = useRef(0);
  const [askPhone, setAskPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const last = msgs.reduce((m, x) => (x.id > m ? x.id : m), 0);

  useEffect(() => {
    call<Page>(slug).then(setPage).catch((e) => setError(e.message));
    let saved: { visitor?: string; name?: string } = {};
    try { saved = JSON.parse(localStorage.getItem(key) || "{}"); } catch {}
    const fromUrl = (sp.get("name") || "").trim().slice(0, 80);
    setDraftName(saved.name || fromUrl);
    if (saved.visitor && saved.name) {
      setVisitor(saved.visitor); setName(saved.name);
      call<{ messages: Msg[] }>(`${slug}/messages?visitor=${encodeURIComponent(saved.visitor)}`).then((r) => {
        setMsgs((m) => merge(m, r.messages));
      }).catch(() => {});
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const remember = (v: string, n: string) => { try { localStorage.setItem(key, JSON.stringify({ visitor: v, name: n })); } catch {} };

  // The seller may answer from the panel: check for new messages every few seconds while the page is open.
  useEffect(() => { lastRef.current = last; }, [last]);

  useEffect(() => {
    if (!visitor || !live) return;
    const es = new EventSource(`${API_URL}/api/v1/public/chat/${slug}/stream?visitor=${encodeURIComponent(visitor)}&after=${lastRef.current}`);
    es.onmessage = (e) => { try { const rows = JSON.parse(e.data) as Msg[]; setMsgs((m) => merge(m, rows)); } catch {} };
    es.addEventListener("bye", () => { es.close(); setLive(false); });
    return () => es.close();
  }, [visitor, slug, live]);

  useEffect(() => {
    const back = () => { if (!document.hidden) setLive(true); };
    document.addEventListener("visibilitychange", back);
    return () => document.removeEventListener("visibilitychange", back);
  }, []);

  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }); }, [msgs.length, busy, askPhone]);

  const apply = (r: { visitor: string; messages: Msg[]; notice?: string }, tempId: number) => {
    setLive(true); setNotice(r.notice ?? "");
    if (r.visitor !== visitor) { setVisitor(r.visitor); remember(r.visitor, name); }
    setMsgs((m) => merge(m.filter((x) => x.id !== tempId), r.messages));
  };

  const send = async (t: string) => {
    const body = t.trim();
    if (!body || busy) return;
    if (page?.phone_button && body === page.phone_button) { setAskPhone(true); return; }
    setBusy(true); setSendError(""); setText(""); setAskPhone(false);
    const temp: Msg = { id: -Date.now(), role: "customer", text: body, image_url: "", buttons: null };
    setMsgs((m) => [...m, temp]);
    try {
      apply(await call(`${slug}/messages`, { method: "POST", json: { visitor, name, text: body } }), temp.id);
    } catch (e: any) {
      setSendError(e.message); setText(body); setMsgs((m) => m.filter((x) => x.id !== temp.id));
    } finally { setBusy(false); }
  };

  const sendPhoto = async () => {
    if (!preview || busy) return;
    const caption = text.trim();
    setBusy(true); setSendError("");
    const temp: Msg = { id: -Date.now(), role: "customer", text: caption, image_url: preview.url, buttons: null };
    setMsgs((m) => [...m, temp]);
    const fd = new FormData();
    fd.append("file", preview.file); fd.append("name", name); fd.append("visitor", visitor); fd.append("text", caption);
    try {
      apply(await call(`${slug}/photo`, { method: "POST", body: fd }), temp.id);
      setText(""); setPreview(null);
    } catch (e: any) {
      setSendError(e.message); setMsgs((m) => m.filter((x) => x.id !== temp.id));
    } finally { setBusy(false); }
  };

  const pick = (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setSendError("فقط عکس می‌شود فرستاد."); return; }
    if (f.size > 10 * 1024 * 1024) { setSendError("حجم عکس حداکثر ۱۰ مگابایت است."); return; }
    setSendError(""); setPreview({ file: f, url: URL.createObjectURL(f) });
  };

  if (error) {
    return (
      <main className="min-h-dvh grid place-items-center p-4">
        <Card className="p-8 text-center max-w-sm"><MessageCircleOff className="size-10 text-muted mx-auto mb-3" /><h1 className="font-bold text-[18px]">{error}</h1>
          <p className="text-muted text-[14px] mt-1">لینک را دوباره از صفحهٔ فروشگاه بگیر.</p></Card>
      </main>
    );
  }
  if (!page || !ready) return <main className="min-h-dvh grid place-items-center"><Loader2 className="size-7 animate-spin text-primary" aria-label="در حال بارگذاری" /></main>;

  const head = (
    <div className="flex items-center gap-3 min-w-0">
      {page.logo_url
        ? <img src={mediaUrl(page.logo_url, 40)} alt="" className="size-10 rounded-full object-cover bg-subtle shrink-0" />
        : <span className="size-10 rounded-full bg-primary-soft text-primary grid place-items-center shrink-0"><Store className="size-5" /></span>}
      <div className="min-w-0">
        <h1 className="font-black text-[16px] leading-tight truncate">{page.name}</h1>
        <div className="text-[12px] text-muted">{page.assistant_on ? "معمولاً در چند ثانیه جواب می‌دهیم" : "پیامت را بگذار؛ به‌زودی جواب می‌دهیم"}</div>
      </div>
    </div>
  );

  if (!name) {
    return (
      <main className="min-h-dvh grid place-items-center p-4">
        <Card strong className="w-full max-w-sm p-6">
          {head}
          <p className="text-[14px] leading-7 mt-5 bg-subtle rounded-2xl p-3">{page.greeting}</p>
          <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); const n = draftName.trim().replace(/\s+/g, " ").slice(0, 80); if (n) { setName(n); remember(visitor, n); } }}>
            <label className="block">
              <span className="text-[13px] font-semibold mb-1.5 flex items-center gap-1.5"><UserRound className="size-4" />اسمت چیه؟</span>
              <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={80} placeholder="مثلاً سارا" autoFocus required />
            </label>
            <Button type="submit" className="w-full" disabled={!draftName.trim()}>شروع گفتگو</Button>
          </form>
          <Link href="/" className="flex items-center justify-center gap-1.5 text-[12px] text-muted mt-6">چت با <Logo className="text-[14px]" /></Link>
        </Card>
      </main>
    );
  }

  const lastMsg = msgs.length ? msgs[msgs.length - 1] : null;
  const choices = lastMsg && lastMsg.role !== "customer" && lastMsg.buttons?.length ? lastMsg.buttons : page.menu;

  return (
    <main className="h-dvh flex flex-col max-w-2xl mx-auto sm:py-4">
      <div className="flex flex-col flex-1 min-h-0 sm:glass-strong sm:rounded-card sm:border sm:border-edge overflow-hidden">
        <header className="px-4 h-16 flex items-center justify-between gap-3 border-b border-edge bg-raised shrink-0">
          {head}
          <button type="button" onClick={() => { if (confirm("با اسم دیگری ادامه می‌دهی؟")) { setName(""); setDraftName(name); } }} className="text-[12px] text-muted hover:text-fg shrink-0 cursor-pointer">{name}</button>
        </header>
        <div ref={list} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5" aria-live="polite">
          {msgs.length === 0 && <Bubble role="ai" text={page.greeting} />}
          {msgs.map((m) => <Bubble key={m.id} role={m.role} text={m.text} image={m.image_url} />)}
          {busy && <div className="flex justify-end"><span className="rounded-2xl bg-raised border border-edge px-4 py-2.5"><span className="flex gap-1">{[0, 1, 2].map((i) => <i key={i} className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />)}</span></span></div>}
        </div>
        {askPhone && (
          <form className="px-3 py-2.5 flex items-center gap-2 border-t border-edge bg-raised" onSubmit={(e) => { e.preventDefault(); const p = toLatin(phone).replace(/\D/g, ""); if (p.length >= 10) { send(p); setPhone(""); } }}>
            <Phone className="size-4 text-muted shrink-0" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" className="text-left tnum" placeholder="09…" autoFocus aria-label="شماره موبایل" />
            <Button type="submit" size="sm" disabled={toLatin(phone).replace(/\D/g, "").length < 10}>ارسال شماره</Button>
            <button type="button" onClick={() => setAskPhone(false)} aria-label="بستن" className="size-9 grid place-items-center text-muted cursor-pointer"><X className="size-4" /></button>
          </form>
        )}
        {!askPhone && !preview && choices.length > 0 && (
          <div className="px-3 py-2 flex flex-wrap gap-1.5 border-t border-edge bg-raised">
            {choices.map((row, i) => row.map((b) => (
              <button key={`${i}-${b}`} type="button" disabled={busy} onClick={() => send(b)}
                className="rounded-full border border-primary/30 text-primary text-[13px] font-bold px-3.5 py-1.5 hover:bg-primary-soft cursor-pointer disabled:opacity-50">{faDigits(b)}</button>
            )))}
          </div>
        )}
        {preview && (
          <div className="px-3 pt-2.5 flex items-center gap-3 border-t border-edge bg-raised">
            <img src={preview.url} alt="" className="size-16 rounded-xl object-cover" />
            <div className="flex-1 text-[13px] text-muted">عکس آمادهٔ ارسال است؛ اگر خواستی توضیح هم بنویس.</div>
            <button type="button" onClick={() => setPreview(null)} aria-label="حذف عکس" className="size-9 grid place-items-center text-muted cursor-pointer"><X className="size-4" /></button>
          </div>
        )}
        {notice && <div className="px-3 py-1.5 text-[12px] text-muted bg-subtle">{notice}</div>}
        {sendError && <div className="px-3 py-1.5 text-[12px] text-danger bg-danger/5">{sendError}</div>}
        <form className="p-2.5 flex items-center gap-2 border-t border-edge bg-raised pb-[max(.625rem,env(safe-area-inset-bottom))]" onSubmit={(e) => { e.preventDefault(); if (preview) sendPhoto(); else send(text); }}>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} aria-label="فرستادن عکس" title="فرستادن عکس (فیش، طرح یا عکس محصول)"
            className="size-11 rounded-control grid place-items-center text-muted hover:text-primary hover:bg-subtle cursor-pointer shrink-0 disabled:opacity-50"><ImagePlus className="size-5" /></button>
          <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder={preview ? "توضیح عکس (اختیاری)…" : "پیامت را بنویس…"} aria-label="پیام" className="flex-1" />
          <button type="submit" disabled={busy || (!preview && !text.trim())} aria-label="ارسال" className="size-11 rounded-control bg-primary text-primary-fg grid place-items-center cursor-pointer disabled:opacity-50 shrink-0">
            {busy ? <Loader2 className="size-[18px] animate-spin" /> : <Send className="size-[18px] -scale-x-100" />}
          </button>
        </form>
      </div>
    </main>
  );
}

function Bubble({ role, text, image }: { role: string; text: string; image?: string }) {
  const mine = role === "customer";
  const src = image ? mediaUrl(image) : "";
  return (
    <div className={cn("flex", mine ? "justify-start" : "justify-end")}>
      <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-7 whitespace-pre-wrap break-words",
        mine ? "bg-primary text-primary-fg rounded-ss-sm" : "bg-raised border border-edge rounded-se-sm")}>
        {src && <a href={src} target="_blank" rel="noreferrer"><img src={src} alt="" className="rounded-xl mb-1.5 max-h-72 object-cover" loading="lazy" /></a>}
        {text}
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<main className="min-h-dvh grid place-items-center"><Loader2 className="size-7 animate-spin text-primary" /></main>}><ChatPage /></Suspense>;
}
