import { ArrowLeft, Check, Clock3, History, MessageSquareText, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shell/Brand";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { ThemeSwitch } from "./ThemeSwitch";
import "./landing.css";

/* Static page, no app-shell bundle. Hero text is never animated (it is the LCP element);
   only the chat demo plays once, and rows reveal with a CSS scroll timeline where supported. */

const S = (v: Record<string, string | number>) => v as React.CSSProperties;

export default function Landing() {
  return (
    <div className="ld">
      <div className="sticky top-0 z-30 px-4 pt-3">
        <header className="ld-header max-w-6xl mx-auto rounded-2xl h-14 ps-3 pe-2 flex items-center justify-between">
          <Link prefetch={false} href="/" aria-label="Sello"><Logo /></Link>
          <nav className="flex items-center gap-1">
            <a href="#what" className="hidden md:inline-flex h-10 items-center px-3 rounded-[10px] text-[14px] font-semibold text-muted hover:text-fg">چی کار می‌کنه</a>
            <a href="#chat" className="hidden md:inline-flex h-10 items-center px-3 rounded-[10px] text-[14px] font-semibold text-muted hover:text-fg">دستیار چت</a>
            <Link prefetch={false} href="/pricing" className="inline-flex h-10 items-center px-3 rounded-[10px] text-[14px] font-semibold text-muted hover:text-fg">پلن‌ها</Link>
            <ThemeSwitch />
            <Link prefetch={false} href="/login" className="ld-btn ld-btn-primary ld-btn-sm">ورود</Link>
          </nav>
        </header>
      </div>

      <main className="max-w-6xl mx-auto px-4">
        <Hero />
        <What />
        <ChatBot />
        <Start />
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted border-t border-line">
        <Logo compact />
        <span>ادمین ۲۴ ساعتهٔ فروشگاه‌های تلگرام، بله، اینستاگرام و دیجی‌کالا</span>
        <span dir="ltr">© Sello</span>
      </footer>
    </div>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section className="grid lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-10 items-center pt-12 sm:pt-20 pb-20 sm:pb-24">
      <div>
        <h1 className="text-[38px] leading-[1.3] sm:text-[54px] sm:leading-[1.22] font-black tracking-tight text-balance">
          یه ادمین ۲۴ ساعته،
          <span className="block text-primary">که خودت تربیتش می‌کنی.</span>
        </h1>
        <p className="text-muted text-[17px] sm:text-[19px] leading-[1.9] mt-6 max-w-[33rem]">
          سلو جواب مشتری‌هات رو می‌ده، سفارش می‌گیره، محصول می‌سازه و توی همهٔ کانال‌هات منتشر می‌کنه. تو فقط از یه جا فروشت رو می‌بینی.
        </p>
        <div className="flex flex-wrap gap-3 mt-9">
          <Link prefetch={false} href="/login" className="ld-btn ld-btn-primary">
            شروع رایگان <ArrowLeft className="ld-arrow size-4" aria-hidden />
          </Link>
          <a href="#what" className="ld-btn ld-btn-quiet">ببین چی کار می‌کنه</a>
        </div>
        <div className="flex items-center gap-3 mt-10">
          <div className="flex gap-1.5">
            {["telegram", "bale", "instagram", "digikala"].map((p) => <PlatformIcon key={p} platform={p} size={30} />)}
          </div>
          <span className="text-[13px] text-muted">تلگرام، بله، اینستاگرام و دیجی‌کالا</span>
        </div>
      </div>
      <ChatDemo />
    </section>
  );
}

/** One authored moment: a question turned into an order. Pure CSS, and the final frame is the default state. */
function ChatDemo() {
  return (
    <div className="relative mx-auto w-full max-w-[400px]" role="img" aria-label="نمونهٔ گفتگوی دستیار سلو با مشتری که به سفارش می‌رسد">
      <div className="ld-msg absolute -top-12 end-0 z-10 ld-float rounded-[10px] px-3 py-2 flex items-center gap-2 text-[12.5px] font-bold" style={S({ "--d": "200ms" })}>
        <span className="flex -space-x-1.5 space-x-reverse" aria-hidden>
          <i className="size-5 rounded-full bg-[#f59e0b] ring-2 ring-[var(--raised-solid)]" />
          <i className="size-5 rounded-full bg-[#3b82f6] ring-2 ring-[var(--raised-solid)]" />
          <i className="size-5 rounded-full bg-[#ec4899] ring-2 ring-[var(--raised-solid)]" />
        </span>
        <span className="tnum">۳۸ گفتگوی هم‌زمان</span>
      </div>

      <div className="ld-phone rounded-[18px] p-3 sm:p-4">
        <div className="flex items-center gap-3 px-1.5 pb-3 border-b border-line">
          <span className="size-10 rounded-full bg-[#111827] text-white grid place-items-center font-black text-[14px]" aria-hidden>م</span>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-[14px]">مریم · فروشگاه هودی</div>
            <div className="text-[12px] text-muted">پیوی تلگرام</div>
          </div>
          <PlatformIcon platform="telegram" size={24} />
        </div>

        <div className="flex flex-col gap-2.5 pt-4 pb-1 text-[13.5px] leading-[1.8]">
          <div className="ld-msg ld-msg-in self-start max-w-[80%] rounded-[12px] rounded-se-[4px] bg-subtle px-3.5 py-2" style={S({ "--d": "500ms" })}>
            سلام، این هودی مشکی سایز L داری؟
            <span className="block text-[10.5px] text-muted text-end tnum">۰۳:۱۲</span>
          </div>

          <div className="relative self-end w-[84%]">
            <div className="ld-typing absolute end-0 top-0 flex gap-1 rounded-[12px] bg-primary-soft px-3.5 py-3" aria-hidden><i /><i /><i /></div>
            <div className="ld-msg ld-msg-out rounded-[12px] rounded-ss-[4px] bg-primary-soft p-2" style={S({ "--d": "1900ms" })}>
              <div className="flex gap-3 items-center rounded-[8px] bg-[var(--raised-solid)] p-2">
                <ProductThumb />
                <div className="min-w-0">
                  <div className="font-bold text-[13px]">هودی مشکی قلب هندسی</div>
                  <div className="text-[12px] text-muted">کد H12 · سایز L موجوده</div>
                  <div className="font-extrabold text-[13px] text-[var(--primary-hover)] tnum">۸۵۰٬۰۰۰ تومان</div>
                </div>
              </div>
              <p className="px-1.5 pt-1.5">سلام عزیزم، آره داریم 🌱 برات کنار بذارم؟</p>
            </div>
          </div>

          <div className="ld-msg ld-msg-in self-start rounded-[12px] rounded-se-[4px] bg-subtle px-3.5 py-2" style={S({ "--d": "2900ms" })}>
            آره، یکی بفرست
          </div>

          <div className="ld-msg ld-msg-out self-end w-[84%] rounded-[12px] rounded-ss-[4px] bg-primary-soft px-3.5 py-2.5" style={S({ "--d": "3700ms" })}>
            <div className="font-bold mb-1">خلاصهٔ سفارشت</div>
            <Row a="هودی H12 · L × ۱" b="۸۵۰٬۰۰۰" />
            <Row a="ارسال" b="۹۰٬۰۰۰" muted />
            <div className="flex justify-between font-extrabold border-t border-line mt-1.5 pt-1.5"><span>جمع</span><span className="tnum">۹۴۰٬۰۰۰ تومان</span></div>
          </div>
        </div>
      </div>

      <div className="ld-msg absolute -bottom-5 start-3 sm:-start-6 ld-float rounded-[10px] px-4 py-2.5 flex items-center gap-2.5 text-[13px] font-bold" style={S({ "--d": "4500ms" })}>
        <span className="size-5 rounded-full bg-primary text-primary-fg grid place-items-center" aria-hidden><Check className="size-3" strokeWidth={3} /></span>
        سفارش ثبت شد، منتظر تأیید توئه
      </div>
    </div>
  );
}

function Row({ a, b, muted }: { a: string; b: string; muted?: boolean }) {
  return <div className={`flex justify-between text-[12.5px] ${muted ? "text-muted" : ""}`}><span>{a}</span><span className="tnum">{b}</span></div>;
}

function ProductThumb({ size = "size-14" }: { size?: string }) {
  return (
    <div className={`${size} shrink-0 rounded-[8px] bg-[#111827] grid place-items-center`} aria-hidden>
      <svg viewBox="0 0 40 40" className="size-[65%]"><path d="M14 8l-7 5 3 6 3-2v15h14V17l3 2 3-6-7-5c-1 2.5-3 4-6 4s-5-1.5-6-4z" fill="#374151" /><path d="M20 19l3.5 3.5L20 26l-3.5-3.5z" fill="#34d399" /></svg>
    </div>
  );
}

/* ---------------- What Sello does: the seven ---------------- */

const SEVEN: { title: string; text: string; visual: React.ReactNode }[] = [
  {
    title: "فروشت رو از یه جا مدیریت کن",
    text: "تلگرام، بله، اینستاگرام و دیجی‌کالا کنار هم. محصول، گفتگو و سفارش همه یه جاست؛ دیگه لازم نیست بین ده تا اپ بچرخی.",
    visual: <VisHub />,
  },
  {
    title: "ادمینی که هیچ‌وقت نمی‌خوابه",
    text: "ساعت ۳ صبح هم جواب می‌ده. نه مرخصی می‌خواد، نه دیر جواب می‌ده، نه حواسش پرت می‌شه.",
    visual: <VisNight />,
  },
  {
    title: "خودت تربیتش می‌کنی",
    text: "لحنش، سؤال‌های پرتکرار، قوانین فروشگاه، جدول سایز و ساعت کاری رو یادش می‌دی؛ همون‌جوری جواب می‌ده که خودت می‌دادی.",
    visual: <VisTrain />,
  },
  {
    title: "سفارش‌گیر حرفه‌ای",
    text: "رنگ و سایز و آدرس رو می‌پرسه، جمع رو از روی قیمت واقعی حساب می‌کنه، فیش رو می‌گیره و می‌ذاره جلوت که فقط تأیید کنی.",
    visual: <VisOrder />,
  },
  {
    title: "با صد نفر هم‌زمان حرف می‌زنه",
    text: "یه مشتری باشه یا صد تا، فرقی نداره. هیچ‌کس توی صف نمی‌مونه و هیچ پیامی بی‌جواب نمی‌مونه.",
    visual: <VisMany />,
  },
  {
    title: "محصول رو خودش می‌سازه",
    text: "یه عکس با گوشی و یه خط توضیح کافیه. عنوان، توضیحات، ویژگی‌ها و عکس تمیز رو سلو آماده می‌کنه.",
    visual: <VisMake />,
  },
  {
    title: "یه بار بساز، همه‌جا منتشر کن",
    text: "با یه کلیک توی همهٔ کانال‌هات می‌ره، هر کدوم با شکل خودش. هر اتفاقی هم بیفته، مرحله‌به‌مرحله می‌بینی.",
    visual: <VisPublish />,
  },
];

function What() {
  return (
    <section id="what" className="py-16 sm:py-24 scroll-mt-20" aria-labelledby="what-title">
      <div className="max-w-2xl">
        <h2 id="what-title" className="text-[30px] sm:text-[42px] font-black tracking-tight leading-[1.3] text-balance">
          سلو قرار نیست برات فروشگاه بسازه.<br className="hidden sm:block" />
          <span className="text-primary"> قراره فروشگاهت رو بچرخونه.</span>
        </h2>
        <p className="text-muted text-[17px] mt-4 leading-[1.9]">هفت کاری که از روزی که وصلش کنی، به‌جات انجام می‌ده:</p>
      </div>

      <ol className="mt-10 sm:mt-14 border-t border-line">
        {SEVEN.map((it, i) => (
          <li key={it.title} className="ld-reveal grid grid-cols-[2.75rem_1fr] sm:grid-cols-[4rem_1fr] md:grid-cols-[4rem_1fr_minmax(0,17rem)] gap-x-4 sm:gap-x-6 gap-y-5 py-8 sm:py-10 border-b border-line items-center">
            <span className="ld-numeral self-start text-[36px] sm:text-[52px] font-black" aria-hidden>{(i + 1).toLocaleString("fa-IR")}</span>
            <div>
              <h3 className="text-[20px] sm:text-[24px] font-black tracking-tight leading-[1.5]">{it.title}</h3>
              <p className="text-[16px] sm:text-[17px] leading-[1.9] mt-1.5 text-muted max-w-[36rem]">{it.text}</p>
            </div>
            <div className="col-start-2 md:col-start-3" aria-hidden>{it.visual}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* Small static illustrations: plain HTML, no images, revealed with their row. */
function VisBox({ children }: { children: React.ReactNode }) {
  return <div className="ld-vis rounded-[12px] p-3.5 text-[12.5px]">{children}</div>;
}
function VisHub() {
  return (
    <VisBox>
      <div className="flex items-center justify-between gap-2">
        <div className="grid grid-cols-2 gap-1.5">
          {["telegram", "bale", "instagram", "digikala"].map((p) => <PlatformIcon key={p} platform={p} size={26} />)}
        </div>
        <div className="flex-1 border-t border-dashed border-[var(--primary)] opacity-60" />
        <Logo compact className="[&_svg]:size-10" />
      </div>
    </VisBox>
  );
}
function VisNight() {
  return (
    <VisBox>
      <div className="flex items-center gap-2 text-muted"><Clock3 className="size-4" /><span className="tnum font-bold">۰۳:۱۲ بامداد</span></div>
      <div className="mt-2 rounded-[8px] bg-primary-soft px-2.5 py-1.5">سلام عزیزم، آره موجوده 🌱</div>
      <div className="mt-1.5 text-[11.5px] text-primary font-bold">جواب در ۲ ثانیه</div>
    </VisBox>
  );
}
function VisTrain() {
  return (
    <VisBox>
      <div className="flex flex-wrap gap-1.5">
        {["لحن: خودمونی", "جدول سایز", "ارسال رایگان بالای ۲ میلیون", "ساعت کاری ۱۰ تا ۲۲", "تخفیف نده"].map((c) => (
          <span key={c} className="rounded-[6px] bg-subtle px-2 py-1 font-semibold">{c}</span>
        ))}
      </div>
    </VisBox>
  );
}
function VisOrder() {
  return (
    <VisBox>
      <Row a="هودی H12 · L" b="۸۵۰٬۰۰۰" />
      <Row a="ارسال" b="۹۰٬۰۰۰" muted />
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-line">
        <span className="font-bold">فیش دریافت شد</span>
        <span className="rounded-[6px] bg-primary text-primary-fg px-2 py-0.5 font-bold">تأیید</span>
      </div>
    </VisBox>
  );
}
function VisMany() {
  const colors = ["#f59e0b", "#3b82f6", "#ec4899", "#10b981", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316"];
  return (
    <VisBox>
      <div className="flex -space-x-2 space-x-reverse">
        {colors.map((c) => <i key={c} className="size-7 rounded-full ring-2 ring-[var(--raised-solid)]" style={{ background: c }} />)}
        <span className="size-7 rounded-full ring-2 ring-[var(--raised-solid)] bg-subtle grid place-items-center text-[10px] font-bold tnum">+۹۲</span>
      </div>
      <div className="mt-2.5 font-bold">۱۰۰ گفتگو، همه در حال جواب گرفتن</div>
    </VisBox>
  );
}
function VisMake() {
  return (
    <VisBox>
      <div className="flex items-center gap-2.5">
        <div className="size-12 shrink-0 rounded-[8px] bg-[repeating-linear-gradient(45deg,#d6d3d1_0_6px,#e7e5e4_6px_12px)] grid place-items-center">
          <span className="size-6 rounded-[4px] bg-[#1f2937] rotate-12" />
        </div>
        <ArrowLeft className="size-4 text-primary shrink-0" />
        <div className="flex items-center gap-2 min-w-0">
          <ProductThumb size="size-12" />
          <div className="min-w-0 leading-[1.6]">
            <div className="font-bold truncate">هودی قلب هندسی</div>
            <div className="text-muted truncate">پنبه · مشکی · L, XL</div>
          </div>
        </div>
      </div>
    </VisBox>
  );
}
function VisPublish() {
  return (
    <VisBox>
      {[["telegram", "تلگرام"], ["bale", "بله"], ["digikala", "دیجی‌کالا"]].map(([p, l]) => (
        <div key={p} className="flex items-center gap-2 py-0.5">
          <PlatformIcon platform={p} size={20} />
          <span className="flex-1 font-semibold">{l}</span>
          <span className="text-primary font-bold flex items-center gap-1"><Check className="size-3.5" strokeWidth={3} />منتشر شد</span>
        </div>
      ))}
    </VisBox>
  );
}

/* ---------------- Chatbot spotlight ---------------- */

const CHAT_POINTS = [
  { icon: UserRound, title: "از پیوی خودت جواب می‌ده", text: "وصلش کن به حساب تلگرامت؛ به اسم خودت و توی پیوی خودت با مشتری حرف می‌زنه. مشتری فکر می‌کنه داره با خودت چت می‌کنه." },
  { icon: MessageSquareText, title: "تلگرام و بله", text: "یا روی ربات اختصاصی فروشگاهت توی تلگرام و بله، یا مستقیم توی پیوی تلگرام. هر جا مشتری‌هات هستن." },
  { icon: History, title: "گزارش دقیق از هر گفتگو", text: "تاریخچهٔ کامل هر چت، سفارش‌هایی که گرفته، فیش‌ها و حتی هزینهٔ هر پیام رو می‌بینی." },
  { icon: ShieldCheck, title: "حرف بی‌ربط نمی‌زنه", text: "فقط دربارهٔ محصول و فروش حرف می‌زنه، قیمت رو از دیتابیس می‌خونه و هر وقت مشتری آدم بخواد، گفتگو رو می‌ده دست تو." },
];

function ChatBot() {
  return (
    <section id="chat" className="py-16 sm:py-24 scroll-mt-20" aria-labelledby="chat-title">
      <div className="ld-panel rounded-[20px] p-6 sm:p-10 lg:p-14 grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-14 items-center">
        <div>
          <div className="flex gap-1.5 mb-6"><PlatformIcon platform="telegram" size={36} /><PlatformIcon platform="bale" size={36} /></div>
          <h2 id="chat-title" className="text-[30px] sm:text-[40px] font-black tracking-tight leading-[1.3] text-balance">
            دستیار چتی که مشتری نمی‌فهمه رباته.
          </h2>
          <p className="text-muted text-[17px] mt-4 leading-[1.9] max-w-[30rem]">
            مثل بهترین ادمینی که داشتی حرف می‌زنه، با لحن خودت. محصول رو با عکس معرفی می‌کنه، سؤال‌ها رو جواب می‌ده و سفارش رو تا آخر می‌بره.
          </p>
          <Link prefetch={false} href="/login" className="ld-btn ld-btn-primary mt-8">
            دستیارت رو راه بنداز <ArrowLeft className="ld-arrow size-4" aria-hidden />
          </Link>
        </div>
        <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
          {CHAT_POINTS.map((p) => (
            <li key={p.title} className="ld-reveal">
              <span className="size-10 rounded-[10px] bg-primary-soft text-primary grid place-items-center"><p.icon className="size-5" aria-hidden /></span>
              <h3 className="font-extrabold text-[17px] mt-3">{p.title}</h3>
              <p className="text-muted text-[15px] leading-[1.85] mt-1">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- Start ---------------- */

const STEPS = [
  { title: "کانالت رو وصل کن", text: "تلگرام، بله، اینستاگرام یا دیجی‌کالا. محصول‌هات خودشون میان توی سلو." },
  { title: "به ادمینت یاد بده", text: "لحن، سؤال‌های پرتکرار، قوانین و اطلاعات پرداخت. چند دقیقه بیشتر نیست." },
  { title: "بسپارش به سلو", text: "از اینجا به بعد جواب می‌ده و سفارش می‌گیره؛ تو فقط تأیید می‌کنی." },
];

function Start() {
  return (
    <section className="pb-20 sm:pb-28" aria-labelledby="start-title">
      <div className="rounded-[20px] bg-ink text-ink-fg p-7 sm:p-12 lg:p-14 grid lg:grid-cols-[1fr_1.4fr] gap-10 items-center">
        <div>
          <h2 id="start-title" className="text-[30px] sm:text-[40px] font-black tracking-tight leading-[1.3]">سه قدم، و تمام.</h2>
          <p className="opacity-75 text-[17px] mt-3 leading-[1.9]">از امروز یه نفر دیگه هم توی فروشگاهت کار می‌کنه.</p>
          <Link prefetch={false} href="/login" className="ld-btn mt-8 bg-[var(--primary)] text-[var(--primary-fg)]">
            شروع رایگان <ArrowLeft className="ld-arrow size-4" aria-hidden />
          </Link>
        </div>
        <ol className="grid sm:grid-cols-3 gap-7 sm:gap-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex sm:block gap-4">
              <span className="size-10 shrink-0 rounded-[10px] border border-current/25 grid place-items-center font-black tnum">{(i + 1).toLocaleString("fa-IR")}</span>
              <div className="sm:mt-4">
                <h3 className="font-extrabold text-[17px]">{s.title}</h3>
                <p className="opacity-75 text-[15px] leading-[1.85] mt-1">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
