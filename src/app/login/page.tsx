"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, setToken } from "@/lib/api";
import { faDigits } from "@/lib/format";
import { Logo, ThemeToggle } from "@/components/shell/AppShell";
import { Button, Card, Field, Input } from "@/components/ui/primitives";

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
    <div className="min-h-dvh grid place-items-center p-4">
      <div className="absolute top-4 start-4"><ThemeToggle /></div>
      <Card strong className="w-full max-w-[420px] p-8">
        <Link href="/" className="inline-block mb-8"><Logo /></Link>
        {step === "phone" ? (
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="space-y-5">
            <div>
              <h1 className="text-[22px] font-extrabold">ورود یا ثبت‌نام</h1>
              <p className="text-muted text-[14px]">شمارهٔ موبایلت را وارد کن تا کد تأیید بفرستیم.</p>
            </div>
            <Field label="شمارهٔ موبایل">
              <Input dir="ltr" inputMode="tel" autoFocus placeholder="09xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} className="text-left tnum" />
            </Field>
            <Button type="submit" className="w-full" size="lg" loading={loading} disabled={phone.length < 10}>دریافت کد تأیید</Button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="space-y-5">
            <button type="button" onClick={() => setStep("phone")} className="text-[13px] text-muted flex items-center gap-1 cursor-pointer hover:text-fg">
              <ArrowRight className="size-4" /> تغییر شماره
            </button>
            <div>
              <h1 className="text-[22px] font-extrabold">کد تأیید</h1>
              <p className="text-muted text-[14px]">کد ۶ رقمی ارسال‌شده به <span className="tnum font-semibold">{faDigits(phone)}</span> را وارد کن.</p>
            </div>
            <OtpInput value={code} onChange={setCode} />
            {devCode && (
              <p className="text-[12px] text-center text-ai bg-ai/10 rounded-lg py-1.5">حالت توسعه: کد <b className="tnum">{faDigits(devCode)}</b></p>
            )}
            <Button type="submit" className="w-full" size="lg" loading={loading} disabled={code.length !== 6}>ورود</Button>
            <div className="text-center text-[13px] text-muted">
              {timer > 0 ? <span className="tnum">ارسال دوباره تا {faDigits(timer)} ثانیه</span> : (
                <button type="button" className="text-primary font-semibold cursor-pointer" onClick={send}>ارسال دوبارهٔ کد</button>
              )}
            </div>
          </form>
        )}
        <p className="mt-8 flex items-center gap-1.5 text-[12px] text-muted"><ShieldCheck className="size-4" /> اطلاعات حساب‌های متصل رمزنگاری‌شده نگهداری می‌شود.</p>
      </Card>
    </div>
  );
}
