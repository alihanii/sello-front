"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, setToken } from "@/lib/api";
import { faDigits } from "@/lib/format";
import { Logo, ThemeToggle } from "@/components/shell/AppShell";
import { Button, Field, Input } from "@/components/ui/primitives";

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");
  const set = (i: number, ch: string) => {
    const next = digits.map((d, j) => (j === i ? ch : d)).join("").replace(/ /g, "");
    onChange(next.slice(0, 6));
  };
  return (
    <div className="flex gap-2 justify-center" dir="ltr">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`رقم ${i + 1}`}
          value={d.trim()}
          maxLength={6}
          onChange={(e) => {
            const v = e.target.value.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/\D/g, "");
            if (v.length > 1) { onChange(v.slice(0, 6)); refs.current[Math.min(v.length, 5)]?.focus(); return; }
            set(i, v);
            if (v && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => { if (e.key === "Backspace" && !d.trim() && i > 0) refs.current[i - 1]?.focus(); }}
          className="size-12 text-center text-[20px] font-bold rounded-xl bg-glass-strong border border-edge outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 tnum"
        />
      ))}
    </div>
  );
}

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [devCode, setDevCode] = useState("");

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const send = async () => {
    setLoading(true);
    try {
      const r = await api("/auth/otp/send", { method: "POST", json: { phone } });
      setStep("code");
      setTimer(r.ttl);
      setDevCode(r.dev_code ?? "");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };
  const verify = async () => {
    setLoading(true);
    try {
      const r = await api("/auth/otp/verify", { method: "POST", json: { phone, code } });
      setToken(r.access_token);
      router.replace("/app");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col overflow-hidden">
      {/* Soft brand glow behind the form; decoration only. */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[560px] rounded-full bg-primary/10 blur-3xl" />
      <header className="relative flex items-center justify-between h-16 px-4 sm:px-6">
        <Link href="/" aria-label="صفحهٔ اصلی Sello"><Logo /></Link>
        <ThemeToggle />
      </header>
      <main className="relative flex-1 grid place-items-center px-4 py-10">
        <div className="w-full max-w-[360px]">
          {step === "phone" ? (
            <form onSubmit={(e) => { e.preventDefault(); send(); }}>
              <div className="text-center mb-8">
                <h1 className="text-[26px] font-black tracking-tight">ورود یا ثبت‌نام</h1>
                <p className="text-muted text-[15px] mt-2">شمارهٔ موبایلت را وارد کن تا کد تأیید بفرستیم.</p>
              </div>
              <div className="space-y-4">
                <Field label="شمارهٔ موبایل">
                  <Input dir="ltr" inputMode="tel" autoFocus placeholder="09xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} className="text-left tnum" />
                </Field>
                <Button type="submit" className="w-full" size="lg" loading={loading} disabled={phone.length < 10}>دریافت کد تأیید</Button>
              </div>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); verify(); }}>
              <div className="text-center mb-8">
                <h1 className="text-[26px] font-black tracking-tight">کد تأیید</h1>
                <p className="text-muted text-[15px] mt-2">کد ۶ رقمی به <span className="tnum font-semibold text-fg" dir="ltr">{faDigits(phone)}</span> ارسال شد.</p>
                <button type="button" onClick={() => { setStep("phone"); setCode(""); }} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-primary cursor-pointer hover:underline">
                  <ArrowRight className="size-4" /> تغییر شماره
                </button>
              </div>
              <div className="space-y-4">
                <OtpInput value={code} onChange={setCode} />
                {devCode && (
                  <p className="text-[12px] text-center text-ai bg-ai/10 rounded-lg py-1.5">حالت توسعه: کد <b className="tnum">{faDigits(devCode)}</b></p>
                )}
                <Button type="submit" className="w-full" size="lg" loading={loading} disabled={code.length !== 6}>ورود</Button>
              </div>
              <div className="text-center text-[13px] text-muted mt-6">
                {timer > 0 ? <span className="tnum">ارسال دوباره تا {faDigits(timer)} ثانیه</span> : (
                  <button type="button" className="text-primary font-semibold cursor-pointer hover:underline" onClick={send}>ارسال دوبارهٔ کد</button>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
      <footer className="relative px-4 pb-6 flex items-center justify-center gap-1.5 text-[12px] text-muted text-center">
        <ShieldCheck className="size-4 shrink-0" aria-hidden /> اطلاعات حساب‌های متصل رمزنگاری‌شده نگهداری می‌شود.
      </footer>
    </div>
  );
}
