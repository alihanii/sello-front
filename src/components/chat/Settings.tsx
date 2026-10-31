"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Clock, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, mediaUrl } from "@/lib/api";
import { useStoreId } from "@/lib/hooks";
import { TONES, WEEK, useAgent, useSaveAgent } from "@/lib/chat";
import { Button, Card, CardHeader, Dialog, EmptyState, Field, Input, Select, Skeleton, Switch, Textarea, cn } from "@/components/ui/primitives";

/** Local copy of the agent settings; saved with one button so half-typed text is never sent. */
function useDraft() {
  const sid = useStoreId();
  const { data } = useAgent(sid);
  const save = useSaveAgent(sid);
  const [draft, setDraft] = useState<any>(null);
  useEffect(() => { if (data) setDraft(structuredClone(data)); }, [data]);
  const set = (patch: any) => setDraft((d: any) => ({ ...d, ...patch }));
  const dirty = !!draft && !!data && JSON.stringify(draft) !== JSON.stringify(data);
  return { draft, set, save, dirty, data };
}

function SaveBar({ dirty, loading, onSave }: { dirty: boolean; loading: boolean; onSave: () => void }) {
  return (
    <div className="sticky bottom-24 lg:bottom-4 z-10 flex justify-end mt-5">
      <Button size="lg" icon={<Save className="size-4" />} disabled={!dirty} loading={loading} onClick={onSave}
        className={cn(dirty && "shadow-[0_10px_30px_-10px_var(--primary)]")}>{dirty ? "ذخیرهٔ تغییرات" : "ذخیره شده"}</Button>
    </div>
  );
}

function Row({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div><div className="font-bold text-[14px]">{title}</div>{text && <div className="text-[13px] text-muted mt-0.5">{text}</div>}</div>
      {children}
    </div>
  );
}

export function AssistantSettings() {
  const { draft, set, save, dirty } = useDraft();
  if (!draft) return <Skeleton className="h-96" />;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-5 space-y-4">
          <Field label="نام دستیار" hint="مثلاً «سارا از بوتیک گل‌ریز». خالی بماند، «دستیار [نام فروشگاه]» است.">
            <Input value={draft.assistant_name} maxLength={60} onChange={(e) => set({ assistant_name: e.target.value })} />
          </Field>
          <div>
            <div className="text-[13px] font-semibold mb-2">لحن</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TONES.map((t) => (
                <button key={t.value} type="button" onClick={() => set({ tone: t.value })}
                  className={cn("text-start p-3 rounded-2xl border transition cursor-pointer", draft.tone === t.value ? "border-primary bg-primary-soft" : "border-edge hover:bg-subtle")}>
                  <div className="font-bold text-[14px]">{t.label}</div>
                  <div className="text-[12px] text-muted mt-1">{t.sample}</div>
                </button>
              ))}
            </div>
          </div>
          <Field label="توضیح سبک و نکات فروشگاه" hint={`${draft.custom_instructions.length}/۵۰۰ — مثل «مشتری را خانم/آقا خطاب نکن» یا «همهٔ لباس‌ها نخی هستند». این متن موضوع پاسخ‌ها را گسترش نمی‌دهد.`}>
            <Textarea maxLength={500} value={draft.custom_instructions} onChange={(e) => set({ custom_instructions: e.target.value })} />
          </Field>
        </Card>
        <Card className="p-5 space-y-4">
          <Field label="پیام اولیهٔ خودکار" hint="اولین پیام هر مشتری جدید؛ بدون هزینهٔ AI. {store} با نام فروشگاه جایگزین می‌شود.">
            <Textarea maxLength={1000} placeholder={draft.defaults.welcome_message} value={draft.welcome_message} onChange={(e) => set({ welcome_message: e.target.value })} />
          </Field>
          <Field label="پاسخ به سؤال‌های خارج از موضوع" hint="وقتی مشتری چیزی غیر از محصول و سفارش بپرسد، همین متن فرستاده می‌شود.">
            <Textarea className="!min-h-16" maxLength={500} placeholder={draft.defaults.off_topic_message} value={draft.off_topic_message} onChange={(e) => set({ off_topic_message: e.target.value })} />
          </Field>
        </Card>
        <Card className="px-5 py-2 divide-y divide-[var(--line)]">
          <Row title="دسترسی به محصولات فروشگاه" text="دستیار عنوان، قیمت، موجودی و ویژگی‌های محصولات همین فروشگاه را می‌بیند و فقط چند محصول مرتبط با هر سؤال را می‌خواند.">
            <Switch checked={draft.catalog_enabled} onChange={(v) => set({ catalog_enabled: v })} label="دسترسی به محصولات" />
          </Row>
          <Row title="سکوت دستیار بعد از پیام ادمین" text="وقتی خودت در گفتگو جواب بدهی یا دستیار گفتگو را به تو بسپارد، تا این مدت ساکت می‌ماند.">
            <Select className="w-36" value={draft.handoff_minutes} onChange={(e) => set({ handoff_minutes: Number(e.target.value) })}>
              {[[15, "۱۵ دقیقه"], [30, "۳۰ دقیقه"], [60, "۱ ساعت"], [180, "۳ ساعت"], [720, "۱۲ ساعت"], [1440, "۲۴ ساعت"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Row>
        </Card>
      </div>
      <Card className="p-5 h-fit lg:sticky lg:top-24">
        <CardHeader title="پیش‌نمایش" />
        <div className="rounded-2xl bg-subtle p-4 space-y-3 text-[14px]">
          <div className="max-w-[85%] ms-auto rounded-2xl rounded-se-sm bg-ai/12 p-3 whitespace-pre-line">{(draft.welcome_message || draft.defaults.welcome_message)}</div>
          <div className="max-w-[80%] rounded-2xl rounded-ss-sm bg-glass-strong p-3">یه شعر برام بگو</div>
          <div className="max-w-[85%] ms-auto rounded-2xl rounded-se-sm bg-ai/12 p-3">{draft.off_topic_message || draft.defaults.off_topic_message}</div>
        </div>
        <p className="text-[12px] text-muted mt-3">لحن «{TONES.find((t) => t.value === draft.tone)?.label}» در پاسخ‌های AI اعمال می‌شود. برای دیدن پاسخ واقعی از تب «تست چت» استفاده کن.</p>
      </Card>
      <div className="lg:col-span-3"><SaveBar dirty={dirty} loading={save.isPending} onSave={() => save.mutate(draft)} /></div>
    </div>
  );
}

// ---------- knowledge ----------

function References() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const { data: refs } = useQuery({ queryKey: ["chat-refs", sid], queryFn: () => api<any[]>(`/stores/${sid}/chat/references`) });
  const [edit, setEdit] = useState<any>(null);
  const remove = useMutation({ mutationFn: (id: number) => api(`/chat/references/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-refs", sid] }) });
  return (
    <Card>
      <CardHeader title="رفرنس‌ها" subtitle="جدول سایزبندی، راهنمای نگهداری، کاتالوگ… دستیار وقتی لازم باشد عکس یا متنش را برای مشتری می‌فرستد."
        action={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEdit({ title: "", keywords: "", text: "", image_url: "" })}>افزودن</Button>} />
      <div className="px-5 pb-5">
        {!refs ? <Skeleton className="h-24" /> : refs.length === 0 ? <p className="text-[13px] text-muted">هنوز رفرنسی نداری.</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {refs.map((r) => (
              <div key={r.id} className="flex gap-3 rounded-2xl bg-subtle p-3">
                {r.image_url ? <img src={mediaUrl(r.image_url)} alt="" className="size-16 rounded-xl object-cover shrink-0" /> : <div className="size-16 rounded-xl bg-glass grid place-items-center shrink-0"><BookOpen className="size-5 text-muted" /></div>}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14px] truncate">{r.title}</div>
                  <div className="text-[12px] text-muted line-clamp-2">{r.keywords || r.text}</div>
                  <div className="flex gap-1 mt-1">
                    <Button size="sm" variant="ghost" onClick={() => setEdit(r)}>ویرایش</Button>
                    <Button size="sm" variant="ghost" aria-label="حذف" onClick={() => confirm("این رفرنس حذف شود؟") && remove.mutate(r.id)}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {edit && <RefDialog value={edit} onClose={() => setEdit(null)} />}
    </Card>
  );
}

function RefDialog({ value, onClose }: { value: any; onClose: () => void }) {
  const sid = useStoreId();
  const qc = useQueryClient();
  const [r, setR] = useState(value);
  const file = useRef<HTMLInputElement>(null);
  const upload = useMutation({
    mutationFn: async (f: File) => { const fd = new FormData(); fd.append("files", f); return api(`/stores/${sid}/uploads`, { method: "POST", body: fd }); },
    onSuccess: (res) => setR((x: any) => ({ ...x, image_url: res.urls[0] })),
    onError: (e: any) => toast.error(e.message),
  });
  const save = useMutation({
    mutationFn: () => api(r.id ? `/chat/references/${r.id}` : `/stores/${sid}/chat/references`, { method: r.id ? "PUT" : "POST", json: { title: r.title, keywords: r.keywords, text: r.text, image_url: r.image_url } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["chat-refs", sid] }); onClose(); toast.success("ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open onClose={onClose} title={r.id ? "ویرایش رفرنس" : "رفرنس جدید"}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <Field label="عنوان"><Input required maxLength={160} placeholder="جدول سایزبندی مانتو" value={r.title} onChange={(e) => setR({ ...r, title: e.target.value })} /></Field>
        <Field label="کلمات کلیدی" hint="کمک می‌کند دستیار بفهمد کی این را بفرستد؛ مثلاً «سایز، قد، اندازه»."><Input maxLength={300} value={r.keywords} onChange={(e) => setR({ ...r, keywords: e.target.value })} /></Field>
        <Field label="متن (اختیاری)"><Textarea maxLength={1500} value={r.text} onChange={(e) => setR({ ...r, text: e.target.value })} /></Field>
        <div>
          <div className="text-[13px] font-semibold mb-1.5">عکس (اختیاری)</div>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])} />
          {r.image_url ? (
            <div className="flex items-center gap-3"><img src={mediaUrl(r.image_url)} alt="" className="h-24 rounded-xl" /><Button type="button" size="sm" variant="ghost" onClick={() => setR({ ...r, image_url: "" })}>حذف عکس</Button></div>
          ) : <Button type="button" variant="secondary" icon={<ImagePlus className="size-4" />} loading={upload.isPending} onClick={() => file.current?.click()}>انتخاب عکس</Button>}
        </div>
        <Button type="submit" className="w-full" loading={save.isPending}>ذخیره</Button>
      </form>
    </Dialog>
  );
}

function Hours({ draft, set }: { draft: any; set: (p: any) => void }) {
  const bh = draft.business_hours;
  const setBh = (p: any) => set({ business_hours: { ...bh, ...p } });
  const setDay = (k: string, v: string[][]) => setBh({ days: { ...bh.days, [k]: v } });
  return (
    <Card>
      <CardHeader title="ساعت کاری" subtitle="به وقت تهران" action={<Switch checked={bh.enabled} onChange={(v) => setBh({ enabled: v })} label="ساعت کاری" />} />
      {bh.enabled && (
        <div className="px-5 pb-5 space-y-2">
          {WEEK.map(([k, label]) => {
            const r = bh.days[k]?.[0];
            return (
              <div key={k} className="flex items-center gap-3 text-[14px]">
                <span className="w-20 font-semibold">{label}</span>
                <Switch checked={!!r} onChange={(on) => setDay(k, on ? [["09:00", "21:00"]] : [])} label={label} />
                {r ? <>
                  <Input type="time" dir="ltr" className="w-28" value={r[0]} onChange={(e) => setDay(k, [[e.target.value, r[1]]])} />
                  <span className="text-muted">تا</span>
                  <Input type="time" dir="ltr" className="w-28" value={r[1]} onChange={(e) => setDay(k, [[r[0], e.target.value]])} />
                </> : <span className="text-muted text-[13px]">تعطیل</span>}
              </div>
            );
          })}
          <div className="pt-3 space-y-3">
            <Field label="خارج از ساعت کاری">
              <Select value={bh.away_mode} onChange={(e) => setBh({ away_mode: e.target.value })}>
                <option value="ai">دستیار جواب بدهد و بگوید سفارش در ساعت کاری بررسی می‌شود</option>
                <option value="message">فقط پیام غیبت بفرستد (بدون هزینهٔ AI)</option>
              </Select>
            </Field>
            {bh.away_mode === "message" && (
              <Field label="پیام غیبت" hint="حداکثر هر ۶ ساعت یک‌بار برای هر مشتری فرستاده می‌شود.">
                <Textarea className="!min-h-16" maxLength={500} placeholder={draft.defaults.away_message} value={bh.away_message} onChange={(e) => setBh({ away_message: e.target.value })} />
              </Field>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export function KnowledgeSettings() {
  const { draft, set, save, dirty } = useDraft();
  if (!draft) return <Skeleton className="h-96" />;
  const faqs: any[] = draft.faqs;
  const setFaq = (i: number, p: any) => set({ faqs: faqs.map((f, j) => (j === i ? { ...f, ...p } : f)) });
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="سؤالات متداول" subtitle="اگر سؤال مشتری با یکی از این‌ها یکی باشد، همین جواب بدون هزینهٔ AI فرستاده می‌شود؛ بقیه هم مبنای جواب‌های دستیار است."
          action={<Button size="sm" icon={<Plus className="size-4" />} disabled={faqs.length >= 40} onClick={() => set({ faqs: [...faqs, { q: "", a: "" }] })}>سؤال جدید</Button>} />
        <div className="px-5 pb-5 space-y-3">
          {faqs.length === 0 && <EmptyState icon={<BookOpen className="size-7" />} title="سؤال متداولی نداری" text="مثل: هزینهٔ ارسال چقدر است؟ چند روزه می‌رسد؟ امکان مرجوعی هست؟" />}
          {faqs.map((f, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto] gap-2 items-start rounded-2xl bg-subtle p-3">
              <Input placeholder="سؤال" maxLength={300} value={f.q} onChange={(e) => setFaq(i, { q: e.target.value })} />
              <Textarea className="!min-h-11" placeholder="جواب" maxLength={1000} value={f.a} onChange={(e) => setFaq(i, { a: e.target.value })} />
              <Button variant="ghost" aria-label="حذف" onClick={() => set({ faqs: faqs.filter((_, j) => j !== i) })}><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <Field label="قوانین و توضیحات فروشگاه" hint={`${draft.rules.length}/۳۰۰۰ — شرایط ارسال، زمان آماده‌سازی، مرجوعی، ضمانت، روش‌های پرداخت…`}>
          <Textarea className="min-h-40" maxLength={3000} value={draft.rules} onChange={(e) => set({ rules: e.target.value })} />
        </Field>
      </Card>
      <Hours draft={draft} set={set} />
      <SaveBar dirty={dirty} loading={save.isPending} onSave={() => save.mutate(draft)} />
      <References />
    </div>
  );
}

// ---------- orders & payment ----------

export function OrderSettings() {
  const { draft, set, save, dirty } = useDraft();
  if (!draft) return <Skeleton className="h-96" />;
  const pay = draft.payment;
  const setPay = (p: any) => set({ payment: { ...pay, ...p } });
  const req = draft.required_fields;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card className="px-5 py-2">
          <Row title="سفارش‌گیری با AI" text="دستیار اقلام و اطلاعات مشتری را جمع می‌کند، خلاصه و جمع سفارش را از قیمت‌های فروشگاه می‌سازد و بعد از تأیید مشتری، اطلاعات پرداخت را می‌فرستد.">
            <Switch checked={draft.orders_enabled} onChange={(v) => set({ orders_enabled: v })} label="سفارش‌گیری" />
          </Row>
        </Card>
        <Card className={cn("p-5 space-y-4", !draft.orders_enabled && "opacity-60")}>
          <h3 className="font-extrabold text-[15px]">اطلاعات پرداخت</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="شماره کارت"><Input dir="ltr" className="text-left tnum" placeholder="6037-…" value={pay.card_number ?? ""} onChange={(e) => setPay({ card_number: e.target.value })} /></Field>
            <Field label="به نام"><Input value={pay.holder ?? ""} onChange={(e) => setPay({ holder: e.target.value })} /></Field>
            <Field label="شماره شبا"><Input dir="ltr" className="text-left tnum" placeholder="IR…" value={pay.sheba ?? ""} onChange={(e) => setPay({ sheba: e.target.value })} /></Field>
            <Field label="لینک پرداخت / درگاه" hint="مثلاً لینک پرداخت زرین‌پال یا صفحهٔ پرداخت سایتت"><Input dir="ltr" className="text-left" placeholder="https://…" value={pay.link ?? ""} onChange={(e) => setPay({ link: e.target.value })} /></Field>
          </div>
          <Field label="توضیح پرداخت (اختیاری)"><Textarea className="!min-h-16" maxLength={500} placeholder="مثلاً: ارسال رایگان برای خرید بالای ۲ میلیون" value={pay.note ?? ""} onChange={(e) => setPay({ note: e.target.value })} /></Field>
          <Row title="دریافت فیش یا کد پیگیری" text="بعد از پرداخت، دستیار عکس فیش یا کد پیگیری را می‌گیرد و در «سفارش‌های AI» برای تأیید تو ذخیره می‌کند.">
            <Switch checked={pay.require_receipt !== false} onChange={(v) => setPay({ require_receipt: v })} label="دریافت فیش" />
          </Row>
        </Card>
        <Card className={cn("p-5", !draft.orders_enabled && "opacity-60")}>
          <h3 className="font-extrabold text-[15px] mb-2">اطلاعاتی که از مشتری گرفته می‌شود</h3>
          {[["name", "نام و نام خانوادگی"], ["phone", "شمارهٔ موبایل"], ["address", "آدرس کامل (برای محصول فیزیکی)"]].map(([k, l]) => (
            <Row key={k} title={l}><Switch checked={req[k] !== false} onChange={(v) => set({ required_fields: { ...req, [k]: v } })} label={l} /></Row>
          ))}
        </Card>
      </div>
      <Card className="p-5 h-fit lg:sticky lg:top-24">
        <CardHeader title="پیامی که مشتری می‌بیند" />
        <div className="rounded-2xl bg-subtle p-4 text-[14px]">
          <div className="max-w-[92%] ms-auto rounded-2xl rounded-se-sm bg-ai/12 p-3 whitespace-pre-line leading-7">
            {["✅ سفارش #۱۲ ثبت شد.", "مبلغ قابل پرداخت: ۱٬۲۵۰٬۰۰۰ تومان", pay.card_number && `💳 شماره کارت: \u2066${pay.card_number}\u2069`, pay.holder && `به نام: ${pay.holder}`,
              pay.sheba && `شبا: \u2066${pay.sheba}\u2069`, pay.link && `🔗 لینک پرداخت: \u2066${pay.link}\u2069`, pay.note,
              pay.require_receipt !== false ? "بعد از پرداخت، عکس فیش یا کد پیگیری رو همین‌جا بفرست 🙏" : "همکارم برای هماهنگی نهایی پیام می‌ده 🙏"].filter(Boolean).join("\n")}
          </div>
        </div>
        <p className="text-[12px] text-muted mt-3 flex gap-1.5"><Clock className="size-4 shrink-0" />مبلغ را خود Sello از قیمت محصولات حساب می‌کند، نه AI.</p>
      </Card>
      <div className="lg:col-span-3"><SaveBar dirty={dirty} loading={save.isPending} onSave={() => save.mutate(draft)} /></div>
    </div>
  );
}

