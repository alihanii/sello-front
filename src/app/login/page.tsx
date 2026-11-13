"use client";

import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, ensureToken, hasSession, setSession } from "@/lib/api";
import { faDigits } from "@/lib/format";
import { Logo, ThemeToggle } from "@/components/shell/AppShell";
import { Button, Field, Input, Spinner } from "@/components/ui/primitives";

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
          className="size-12 text-center text-[20px] font-bold rounded-xl bg-control border border-fg/20 hover:border-fg/30 outline-none transition focus:bg-glass-strong focus:border-primary focus:ring-4 focus:ring-primary/15 tnum"
        />
      ))}
    </div>
  );
}

function PasswordInput({ value, onChange, autoComplete, autoFocus }: { value: string; onChange: (v: string) => void; autoComplete: string; autoFocus?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input dir="ltr" type={show ? "text" : "password"} name={autoComplete === "new-password" ? "new-password" : "password"} autoComplete={autoComplete} autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)}
        className="text-left pr-11 border-fg/20! hover:border-fg/30! focus:border-primary!" />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
        className="absolute inset-y-0 right-0 w-11 grid place-items-center text-muted hover:text-fg cursor-pointer">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

type Step = "phone" | "password" | "code" | "setpw";

/** «۵۹ دقیقه و ۴۰ ثانیه» / «۳۸ ثانیه» */
function waitText(sec: number) {
  const m = Math.floor(sec / 60), r = sec % 60;
  return m > 0 ? `${faDigits(m)} دقیقه${r ? ` و ${faDigits(r)} ثانیه` : ""}` : `${faDigits(r)} ثانیه`;
}

/** Where to go after signing in: a path inside the app from ?next=, else the panel. */
function nextPath() {
  try {
    const n = new URLSearchParams(window.location.search).get("next") ?? "";
    return n.startsWith("/") && !n.startsWith("//") ? n : "/app";
  } catch {
    return "/app";
  }
}

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [step, setStep] = useState<Step>("phone");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  // The server says how long a blocked request must wait (a wrong code: 40 s; five wrong in a row: an hour; a locked
  // password). The reason and the seconds left are shown as a live countdown.
  const [cooldown, setCooldown] = useState(0);
  const [blockMsg, setBlockMsg] = useState("");
  const [devCode, setDevCode] = useState("");
  // Already signed in (e.g. «ورود» on the landing page): straight to the panel instead of asking again.
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!hasSession()) { setChecking(false); return; }
    ensureToken().then((t) => (t ? router.replace(nextPath()) : setChecking(false))).catch(() => setChecking(false));
  }, [router]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } catch (e: any) {
      if (e.retryAfter) {
        setBlockMsg(e.message);
        setCooldown(Math.ceil(e.retryAfter));
        if (step === "code") setCode("");
      } else {
        setBlockMsg("");
        toast.error(e.message);
      }
    } finally {
      setLoading(false);
    }
  };
  const sendCode = async () => {
    const r = await api("/auth/otp/send", { method: "POST", json: { phone } });
    setCode("");
    setCooldown(0);
    setBlockMsg("");
    setStep("code");
    setTimer(r.ttl);
    setDevCode(r.dev_code ?? "");
  };
  // Phone first. An account with a password gets the password step; a new number or an account without one gets a code.
  const start = () => run(async () => {
    const r = await api("/auth/lookup", { method: "POST", json: { phone } });
    setHasPassword(!!r.has_password);
    setForgot(false);
    if (r.method === "password") { setPassword(""); setStep("password"); } else await sendCode();
  });
  const signedIn = (r: any) => {
    setSession(r);
    if (!r.has_password || forgot) { setStep("setpw"); return; }
    router.replace(nextPath());
  };
  const verify = () => run(async () => signedIn(await api("/auth/otp/verify", { method: "POST", json: { phone, code } })));
  const loginPassword = () => run(async () => signedIn(await api("/auth/password/login", { method: "POST", json: { phone, password } })));
  const savePassword = () => run(async () => {
    await api("/auth/password", { method: "POST", json: { password: newPassword } });
    toast.success("رمز ذخیره شد؛ دفعهٔ بعد با همین رمز وارد شو.");
    router.replace(nextPath());
  });
  const changePhone = () => { setStep("phone"); setCode(""); setPassword(""); setCooldown(0); setBlockMsg(""); };
  const block = cooldown > 0 && blockMsg ? (
    <p role="alert" className="text-[13px] text-center text-danger bg-danger/10 rounded-lg py-2 px-3 leading-6">
      {blockMsg} بعد از <b className="tnum">{waitText(cooldown)}</b> دوباره تلاش کن.
    </p>
  ) : null;

  if (checking) {
    return <div className="min-h-dvh grid place-items-center"><Spinner className="size-6 text-primary" /></div>;
  }

  return (
    <div className="relative min-h-dvh flex flex-col overflow-hidden">
      {/* Soft brand glow behind the form; decoration only. */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[560px] rounded-full bg-primary/10 blur-3xl" />
      <header className="relative flex items-center justify-between h-16 px-4 sm:px-6">
        <Link href="/" aria-label="صفحهٔ اصلی foroshify"><Logo /></Link>
        <ThemeToggle />
      </header>
      <main className="relative flex-1 grid place-items-center px-4 py-10">
        <div className="w-full max-w-[360px]">
          {step === "phone" && (
            <form onSubmit={(e) => { e.preventDefault(); start(); }}>
              <div className="text-center mb-8">
                <h1 className="text-[26px] font-black tracking-tight">ورود یا ثبت‌نام</h1>
                <p className="text-muted text-[15px] mt-2">شمارهٔ موبایلت را وارد کن.</p>
              </div>
              <div className="space-y-4">
                <Field label="شمارهٔ موبایل">
                  <Input dir="ltr" type="tel" inputMode="tel" name="username" autoComplete="username" autoFocus placeholder="09xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} className="text-left tnum border-fg/20! hover:border-fg/30! focus:border-primary!" />
                </Field>
                {block}
                <Button type="submit" className="w-full" size="lg" loading={loading} disabled={phone.length < 10}>ادامه</Button>
              </div>
            </form>
          )}
          {step === "password" && (
            <form onSubmit={(e) => { e.preventDefault(); loginPassword(); }}>
              <div className="text-center mb-8">
                <h1 className="text-[26px] font-black tracking-tight">رمز عبور</h1>
                <p className="text-muted text-[15px] mt-2">رمز حساب <span className="tnum font-semibold text-fg" dir="ltr">{faDigits(phone)}</span> را وارد کن.</p>
                <button type="button" onClick={changePhone} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-primary cursor-pointer hover:underline">
                  <ArrowRight className="size-4" /> تغییر شماره
                </button>
              </div>
              {/* The phone as the username, so password managers fill and save the pair. */}
              <input type="text" name="username" autoComplete="username" value={phone} readOnly className="sr-only" tabIndex={-1} aria-hidden />
              <div className="space-y-4">
                <Field label="رمز عبور">
                  <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" autoFocus />
                </Field>
                {block}
                <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!password}>ورود</Button>
                <Button type="button" variant="secondary" className="w-full" size="lg" disabled={loading} onClick={() => { setForgot(false); run(sendCode); }}>ورود با کد پیامکی</Button>
                <button type="button" disabled={loading} className="block mx-auto text-[14px] font-semibold text-primary cursor-pointer hover:underline disabled:opacity-50" onClick={() => { setForgot(true); run(sendCode); }}>فراموشی رمز عبور</button>
              </div>
            </form>
          )}
          {step === "code" && (
            <form onSubmit={(e) => { e.preventDefault(); verify(); }}>
              <div className="text-center mb-8">
                <h1 className="text-[26px] font-black tracking-tight">{forgot ? "بازیابی رمز عبور" : "کد تأیید"}</h1>
                <p className="text-muted text-[15px] mt-2">کد ۶ رقمی به <span className="tnum font-semibold text-fg" dir="ltr">{faDigits(phone)}</span> ارسال شد.</p>
                <button type="button" onClick={changePhone} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-primary cursor-pointer hover:underline">
                  <ArrowRight className="size-4" /> تغییر شماره
                </button>
              </div>
              <div className="space-y-4">
                <OtpInput value={code} onChange={setCode} />
                {devCode && (
                  <p className="text-[12px] text-center text-ai bg-ai/10 rounded-lg py-1.5">حالت توسعه: کد <b className="tnum">{faDigits(devCode)}</b></p>
                )}
                {block}
                <Button type="submit" className="w-full" size="lg" loading={loading} disabled={code.length !== 6 || cooldown > 0}>
                  {cooldown > 0 ? <span className="tnum">صبر کن: {waitText(cooldown)}</span> : forgot ? "تأیید و ادامه" : "ورود"}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-4 text-[13px] text-muted mt-6">
                {timer > 0 ? <span className="tnum">ارسال دوباره تا {faDigits(timer)} ثانیه</span> : (
                  <button type="button" className="text-primary font-semibold cursor-pointer hover:underline" onClick={() => run(sendCode)}>ارسال دوبارهٔ کد</button>
                )}
                {hasPassword && (
                  <button type="button" className="text-primary font-semibold cursor-pointer hover:underline" onClick={() => { setForgot(false); setPassword(""); setStep("password"); }}>ورود با رمز عبور</button>
                )}
              </div>
            </form>
          )}
          {step === "setpw" && (
            <form onSubmit={(e) => { e.preventDefault(); savePassword(); }}>
              <div className="text-center mb-8">
                <h1 className="text-[26px] font-black tracking-tight">{forgot ? "رمز عبور جدید" : "یک رمز بگذار"}</h1>
                <p className="text-muted text-[15px] mt-2">دفعهٔ بعد با شماره و همین رمز وارد می‌شوی و منتظر پیامک نمی‌مانی. ورود با کد هم همیشه هست.</p>
              </div>
              <input type="text" name="username" autoComplete="username" value={phone} readOnly className="sr-only" tabIndex={-1} aria-hidden />
              <div className="space-y-4">
                <Field label={forgot ? "رمز عبور جدید" : "رمز عبور"} hint="دست‌کم ۸ نویسه">
                  <PasswordInput value={newPassword} onChange={setNewPassword} autoComplete="new-password" autoFocus />
                </Field>
                <Button type="submit" className="w-full" size="lg" loading={loading} disabled={newPassword.length < 8}>{forgot ? "ذخیرهٔ رمز و ورود به داشبورد" : "ذخیرهٔ رمز و ورود"}</Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => router.replace(nextPath())}>فعلاً نه</Button>
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
