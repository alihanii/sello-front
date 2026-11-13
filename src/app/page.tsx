import { ArrowLeft, Check, Clock, Crown, History, Layers, MessageSquareText, ReceiptText, RefreshCw, Send, ShieldCheck, Sparkles, TicketPercent, TrendingUp, UserRound } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shell/Brand";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { SessionNav } from "./SessionNav";
import { ThemeSwitch } from "./ThemeSwitch";
import "./landing.css";

/* Static page, no app-shell bundle. Hero text is never animated (it is the LCP element);
   only the chat demo plays once, and rows reveal with a CSS scroll timeline where supported. */


export default function Landing() {
  return (
    <div className="ld">
      <div className="sticky top-0 z-30 px-4 pt-3">
        <header className="ld-header max-w-6xl mx-auto rounded-2xl h-14 ps-3 pe-2 flex items-center justify-between">
          <Link prefetch={false} href="/" aria-label="فروشیفای" className="flex items-center h-full"><Logo /></Link>
          <nav className="flex items-center gap-1">
            <a href="#what" className="hidden md:inline-flex h-10 items-center px-3 rounded-[10px] text-[14px] font-semibold text-muted hover:text-fg">چی کار می‌کنه</a>
            <a href="#chat" className="hidden md:inline-flex h-10 items-center px-3 rounded-[10px] text-[14px] font-semibold text-muted hover:text-fg">دستیار چت</a>
            <ThemeSwitch />
            <SessionNav />
          </nav>
        </header>
      </div>

      <main className="max-w-6xl mx-auto px-4">
        <Hero />
        <What />
        <ChatBot />
        <Why />
        <Start />
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted border-t border-line">
        <Logo compact />
        <span>ادمین ۲۴ ساعتهٔ فروشگاه‌های تلگرام، بله، اینستاگرام و دیجی‌کالا</span>
        <span>© فروشیفای</span>
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
          مدیریت فروش چندکاناله
          <span className="block text-primary">با دستیار هوشمند</span>
        </h1>
        <p className="text-muted text-[17px] sm:text-[19px] leading-[1.9] mt-6 max-w-[33rem]">
          از محصول و انبار تا انتشار چندکاناله، فاکتور، باشگاه مشتری و گزارش مالی؛ همه‌چی توی یه پنل. ادمین AI هم با مشتری‌هات چت می‌کنه و سفارش می‌گیره — بدون هزینهٔ ادمین پرخرج.
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
      <HeroArt />
    </section>
  );
}

/** Hero visual: one static illustration (likely the LCP on desktop), so it is never animated.
    AVIF with WebP fallback, two widths, fixed aspect ratio (no CLS), fetched with high priority. */
function HeroArt() {
  return (
    <picture className="ld-hero-art block mx-auto w-full max-w-[560px] lg:max-w-none">
      <source type="image/avif" srcSet="/landing/hero-480.avif 480w, /landing/hero-752.avif 752w" sizes="(min-width: 1024px) 560px, 92vw" />
      <img
        src="/landing/hero-752.webp"
        srcSet="/landing/hero-480.webp 480w, /landing/hero-752.webp 752w"
        sizes="(min-width: 1024px) 560px, 92vw"
        width={752}
        height={519}
        alt="پنل فروشیفای: محصول‌ها، موجودی، چت هوشمند با مشتری و انتشار در تلگرام، بله و اینستاگرام"
        fetchPriority="high"
        decoding="async"
        className="w-full h-auto select-none"
        draggable={false}
      />
    </picture>
  );
}

/** A chat that becomes an order; messages appear as they scroll into view (CSS scroll timeline). */
function ChatDemo() {
  return (
    <div className="relative mx-auto w-full max-w-[380px]" role="img" aria-label="نمونهٔ گفتگوی دستیار فروشیفای با مشتری که به سفارش می‌رسد">
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
          <div className="ld-seq ld-msg-in self-start max-w-[80%] rounded-[12px] rounded-se-[4px] bg-subtle px-3.5 py-2">
            سلام، این هودی مشکی سایز L داری؟
            <span className="block text-[10.5px] text-muted text-end tnum">۰۳:۱۲</span>
          </div>

          <div className="relative self-end w-[84%]">
            <div className="ld-seq ld-msg-out rounded-[12px] rounded-ss-[4px] bg-primary-soft p-2">
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

          <div className="ld-seq ld-msg-in self-start rounded-[12px] rounded-se-[4px] bg-subtle px-3.5 py-2">
            آره، یکی بفرست
          </div>

          <div className="ld-seq ld-msg-out self-end w-[84%] rounded-[12px] rounded-ss-[4px] bg-primary-soft px-3.5 py-2.5">
            <div className="font-bold mb-1">خلاصهٔ سفارشت</div>
            <Row a="هودی H12 · L × ۱" b="۸۵۰٬۰۰۰" />
            <Row a="ارسال" b="۹۰٬۰۰۰" muted />
            <div className="flex justify-between font-extrabold border-t border-line mt-1.5 pt-1.5"><span>جمع</span><span className="tnum">۹۴۰٬۰۰۰ تومان</span></div>
          </div>
        </div>
      </div>

      <div className="ld-seq absolute -bottom-5 start-3 sm:-start-6 ld-float rounded-[10px] px-4 py-2.5 flex items-center gap-2.5 text-[13px] font-bold">
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

/* ---------------- What Froshify does: the steps ---------------- */

/* Seller journey: channels → AI chat → catalog → AI create → stock → invoice → retain → report. */
const STEPS_ALL: { title: string; text: string; visual: React.ReactNode }[] = [
  {
    title: "مدیریت فروش چند کاناله از یک‌جا",
    text: "تلگرام، بله، اینستاگرام و دیجی‌کالا توی یه پنل. یه بار می‌سازی، با یه کلیک همه‌جا منتشر می‌شه.",
    visual: <VisHub />,
  },
  {
    title: "ادمین AI برای چت و سفارش‌گیری",
    text: "مشتری هر جا پیام بده، ادمین AI جواب می‌ده و سفارش رو ثبت می‌کنه؛ تو فقط تأیید می‌کنی.",
    visual: <VisChat />,
  },
  {
    title: "مدیریت محصولات",
    text: "قیمت، تنوع، دسته و وضعیت همه رو توی یه جدول می‌بینی؛ با ویرایش گروهی ده‌ها محصول رو یه‌جا عوض می‌کنی.",
    visual: <VisProducts />,
  },
  {
    title: "ساخت محصول با AI",
    text: "یه عکس و یه خط توضیح کافیه. فروشیفای عکس تمیز، عنوان، توضیحات و ویژگی‌ها رو برات می‌سازه.",
    visual: <VisMake />,
  },
  {
    title: "انبارداری و سینک موجودی لحظه‌ای",
    text: "یه انبار برای همهٔ کانال‌ها. هر سفارش، موجودی همه‌جا همون لحظه کم می‌شه؛ کم‌موجودها رو زود بهت خبر می‌ده.",
    visual: <VisStock />,
  },
  {
    title: "فاکتورساز",
    text: "فاکتور بساز، لینک رو بفرست. مشتری از همون لینک سفارش می‌ده و مستقیم میاد توی پنلت.",
    visual: <VisInvoice />,
  },
  {
    title: "باشگاه مشتریان و پروموشن",
    text: "خریدارها توی باشگاهت می‌مونن. کد تخفیف، پیشنهاد ویژه و پیامک تبلیغاتی رو با یه کلیک روشن کن تا دوباره بخرن.",
    visual: <VisClub />,
  },
  {
    title: "گزارش مالی دقیق",
    text: "فروش، سود و سفارش‌ها به تفکیک روز و کانال — ببین پولت از کجا میاد.",
    visual: <VisFinance />,
  },
];

function What() {
  return (
    <section id="what" className="py-16 sm:py-24 scroll-mt-20" aria-labelledby="what-title">
      <div className="max-w-2xl md:mx-auto md:text-center">
        <h2 id="what-title" className="pt-5 text-[30px] sm:text-[42px] font-black tracking-tight leading-[1.3] text-balance">
          فروشت با{" "}
          <span className="relative inline-block align-baseline px-0.5">
            <span className="absolute left-0 bottom-full -mb-1 inline-flex items-center gap-0.5 rounded-md bg-accent text-accent-fg px-1.5 py-0.5 text-[10px] sm:text-[11px] font-black tracking-wide leading-none -rotate-12 origin-bottom-left" dir="ltr" aria-hidden>
              <Sparkles className="size-2.5" />
              AI
            </span>
            فروشیفای
          </span>{" "}
          بیشتر می‌شه.<br className="hidden sm:block" />
          <span className="text-primary">از یه پنل، همه‌جا.</span>
        </h2>
        <p className="text-muted text-[17px] mt-4 leading-[1.9]">از روزی که وصلش کنی، این هشت کار با فروشیفایه:</p>
      </div>

      {/* A timeline: the rail fills as you scroll, each step's node lights up and its illustration plays as it arrives. */}
      <ol className="ld-steps relative mt-12 sm:mt-16">
        <span className="ld-rail" aria-hidden><span className="ld-rail-fill" /></span>
        {STEPS_ALL.map((it, i) => (
          <li key={it.title} className={`ld-step ${i % 2 ? "ld-step-alt" : ""}`}>
            <span className="ld-node tnum" aria-hidden>{(i + 1).toLocaleString("fa-IR")}</span>
            <div className="ld-step-text">
              <h3 className="text-[21px] sm:text-[26px] font-black tracking-tight leading-[1.5] text-balance">{it.title}</h3>
              <p className="text-[16px] sm:text-[17px] leading-[1.95] mt-2 text-muted max-w-[34rem]">{it.text}</p>
            </div>
            <div className="ld-step-vis" aria-hidden>
              <span className="ld-ghost tnum">{(i + 1).toLocaleString("fa-IR")}</span>
              {it.visual}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* Small illustrations: plain HTML, no images. Each part carries --i, its place in the step's entrance. */
function VisBox({ children }: { children: React.ReactNode }) {
  return <div className="ld-vis relative rounded-[14px] p-4 text-[12.5px] w-full max-w-[22rem]">{children}</div>;
}
const I = (i: number) => ({ "--i": i }) as React.CSSProperties;

function VisHub() {
  return (
    <VisBox>
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-2">
          {["telegram", "bale", "instagram", "digikala"].map((p, i) => (
            <div key={p} className="ld-in flex items-center gap-2" style={I(i)}>
              <PlatformIcon platform={p} size={28} />
              <span className="ld-wire" style={I(i)}><span className="ld-spark" /></span>
            </div>
          ))}
        </div>
        <div className="ld-pop flex-1 grid place-items-center" style={I(4)}>
          <span className="ld-hub"><Logo compact className="[&_svg]:size-12" /></span>
          <span className="mt-2 font-bold">یه پنل</span>
        </div>
      </div>
    </VisBox>
  );
}

function VisChat() {
  return (
    <VisBox>
      <div className="ld-in flex items-center gap-1.5 pb-2.5 mb-2.5 border-b border-line" style={I(0)}>
        <PlatformIcon platform="telegram" size={20} />
        <PlatformIcon platform="bale" size={20} />
        <span className="ms-1 font-bold">یه ادمین، همه‌جا</span>
        <span className="ms-auto flex items-center gap-1 text-primary font-bold"><span className="size-1.5 rounded-full bg-success" />آنلاین</span>
      </div>
      <div className="flex flex-col gap-2 leading-[1.8]">
        <div className="ld-pop ld-msg-in self-start rounded-[10px] rounded-se-[3px] bg-subtle px-3 py-1.5" style={I(0)}>هودی مشکی L دارین؟</div>
        <div className="ld-pop ld-msg-out self-end rounded-[10px] rounded-ss-[3px] bg-primary-soft px-3 py-1.5 max-w-[85%]" style={I(1)}>
          سلام! آره، ۴ تا مونده 🌱 <span className="tnum font-bold">۸۵۰٬۰۰۰</span> تومن
        </div>
        <div className="ld-pop ld-msg-in self-start rounded-[10px] rounded-se-[3px] bg-subtle px-3 py-1.5" style={I(2)}>یکی بفرست</div>
        <div className="ld-pop ld-msg-out self-end flex items-center gap-1.5 rounded-[10px] rounded-ss-[3px] bg-primary-soft px-3 py-1.5" style={I(3)}>
          <span className="ld-typing" aria-hidden><i /><i /><i /></span>
        </div>
        <div className="ld-pop flex items-center justify-between mt-1 pt-2.5 border-t border-line" style={I(4)}>
          <span className="font-bold flex items-center gap-1.5"><Check className="size-3.5 text-primary" strokeWidth={3} />سفارش و فیش رسید</span>
          <span className="rounded-[6px] bg-accent text-accent-fg px-2.5 py-0.5 font-extrabold">تأیید</span>
        </div>
      </div>
    </VisBox>
  );
}

function VisStock() {
  return (
    <VisBox>
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-[13px]">هودی H12 · L</span>
        <span className="ld-pop flex items-center gap-1 text-primary font-bold" style={I(3)}><RefreshCw className="ld-spin size-3.5" />سینک شد</span>
      </div>
      <div className="ld-in mt-2 rounded-[8px] bg-subtle px-2.5 py-1.5 flex items-center gap-2" style={I(0)}>
        <PlatformIcon platform="bale" size={18} />
        <span className="font-semibold">یه سفارش از بله اومد</span>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {["telegram", "instagram", "digikala"].map((p, i) => (
          <div key={p} className="ld-in rounded-[8px] border border-line py-2 grid justify-items-center gap-1" style={I(i + 1)}>
            <PlatformIcon platform={p} size={20} />
            <span className="ld-flip tnum font-black text-[15px]" style={I(i + 2)}><b>۵</b><b>۴</b></span>
          </div>
        ))}
      </div>
      <div className="ld-pop mt-2.5 flex items-center justify-between" style={I(5)}>
        <span className="font-semibold">سویشرت S03</span>
        <span className="tnum font-extrabold text-warning">۲ عدد، کم‌موجود</span>
      </div>
    </VisBox>
  );
}

function VisClub() {
  return (
    <VisBox>
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-[13px] flex items-center gap-1.5"><Crown className="size-4 text-accent" />باشگاه مشتریان</span>
        <span className="tnum text-muted font-semibold">۱٬۲۴۸ عضو</span>
      </div>
      <div className="mt-2.5 space-y-1.5">
        {[["مریم ر.", "طلایی", "۹ خرید"], ["علی ک.", "نقره‌ای", "۴ خرید"]].map(([n, t, c], i) => (
          <div key={n} className="ld-in flex items-center gap-2" style={I(i)}>
            <span className="size-7 rounded-full bg-primary-soft text-primary grid place-items-center font-black">{n[0]}</span>
            <span className="flex-1 font-semibold">{n}</span>
            <span className={`rounded-[5px] px-1.5 py-px font-bold text-[11px] ${t === "طلایی" ? "bg-accent-soft text-[var(--accent-hover)]" : "bg-subtle"}`}>{t}</span>
            <span className="tnum text-muted">{c}</span>
          </div>
        ))}
      </div>
      <div className="ld-pop ld-ticket mt-3 rounded-[10px] px-3 py-2.5 flex items-center gap-3" style={I(2)}>
        <TicketPercent className="size-5 shrink-0" />
        <div className="flex-1 min-w-0 leading-[1.6]">
          <div className="font-extrabold">جشنوارهٔ یلدا، ۲۰٪ تخفیف</div>
          <div className="opacity-80 font-mono text-[11px]" dir="ltr">YALDA20</div>
        </div>
        <span className="ld-switch" style={I(3)}><i /></span>
      </div>
    </VisBox>
  );
}

function VisProducts() {
  return (
    <VisBox>
      <div className="flex items-center justify-between pb-2 border-b border-line">
        <span className="font-extrabold text-[13px]">محصولات</span>
        <span className="ld-pop rounded-[6px] bg-primary text-primary-fg px-2 py-0.5 font-bold text-[11px]" style={I(4)}>ویرایش گروهی ۳ محصول</span>
      </div>
      {[["هودی قلب هندسی", "۸۵۰٬۰۰۰", "#111827", "فعال"], ["تیشرت مینیمال", "۴۲۰٬۰۰۰", "#e7e5de", "فعال"], ["ماگ سرامیکی", "۱۹۰٬۰۰۰", "#c6a66b", "پیش‌نویس"]].map(([n, p, c, s], i) => (
        <div key={n} className="ld-in flex items-center gap-2.5 py-1.5" style={I(i + 1)}>
          <span className="ld-check" style={I(i + 4)}><Check className="size-2.5" strokeWidth={4} /></span>
          <span className="size-8 rounded-[6px] shrink-0 border border-line" style={{ background: c }} />
          <span className="flex-1 min-w-0 truncate font-semibold">{n}</span>
          <span className="tnum font-bold">{p}</span>
          <span className={`size-1.5 rounded-full ${s === "فعال" ? "bg-success" : "bg-neutral"}`} title={s} />
        </div>
      ))}
    </VisBox>
  );
}

const BARS = [38, 52, 44, 66, 58, 82, 100];
function VisFinance() {
  return (
    <VisBox>
      <div className="flex items-start justify-between">
        <div className="leading-[1.5]">
          <div className="text-muted font-semibold">فروش این هفته</div>
          <div className="tnum font-black text-[19px]">۴۸٬۶۰۰٬۰۰۰ <span className="text-[12px] font-bold text-muted">تومان</span></div>
        </div>
        <span className="ld-pop rounded-[6px] bg-primary-soft text-primary px-2 py-0.5 font-extrabold tnum flex items-center gap-1" style={I(7)}><TrendingUp className="size-3.5" />۱۸٪+</span>
      </div>
      <div className="mt-3 h-24 flex items-end gap-1.5">
        {BARS.map((h, i) => (
          <span key={i} className={`ld-bar flex-1 rounded-t-[4px] ${i === BARS.length - 1 ? "bg-accent" : "bg-[var(--heat-3)]"}`} style={{ ...I(i), height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px]">
        {[["سود", "۱۴٫۲م"], ["سفارش", "۵۷"], ["میانگین", "۸۵۲ه"]].map(([k, v], i) => (
          <div key={k} className="ld-in rounded-[6px] bg-subtle px-2 py-1 flex justify-between" style={I(i + 3)}><span className="text-muted">{k}</span><span className="tnum font-extrabold">{v}</span></div>
        ))}
      </div>
    </VisBox>
  );
}

function VisMake() {
  return (
    <VisBox>
      <div className="flex items-center gap-2.5">
        <div className="ld-in size-14 shrink-0 rounded-[8px] bg-[repeating-linear-gradient(45deg,#d6d3d1_0_6px,#e7e5e4_6px_12px)] grid place-items-center" style={I(0)}>
          <span className="size-7 rounded-[4px] bg-[#1f2937] rotate-12" />
        </div>
        <span className="ld-pop shrink-0 rounded-[6px] bg-accent-soft text-[var(--accent-hover)] px-1.5 py-0.5 font-black text-[11px] flex items-center gap-1" style={I(1)}><Sparkles className="size-3" />AI</span>
        <div className="ld-pop ld-shine relative overflow-hidden flex items-center gap-2 min-w-0 flex-1 rounded-[8px] border border-line p-1.5" style={I(2)}>
          <ProductThumb size="size-12" />
          <div className="min-w-0 leading-[1.6]">
            <div className="font-bold truncate">هودی قلب هندسی</div>
            <div className="text-muted truncate">پنبه · مشکی · L, XL</div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["عنوان", "توضیحات", "دسته: پوشاک", "ویژگی‌ها", "زمینهٔ سفید"].map((c, i) => (
          <span key={c} className="ld-pop rounded-[6px] bg-subtle px-2 py-1 font-semibold flex items-center gap-1" style={I(i + 3)}><Check className="size-3 text-primary" strokeWidth={3} />{c}</span>
        ))}
      </div>
    </VisBox>
  );
}

function VisInvoice() {
  return (
    <VisBox>
      <div className="flex items-center justify-between pb-2 border-b border-dashed border-line">
        <span className="font-extrabold text-[13px] flex items-center gap-1.5"><ReceiptText className="size-4 text-primary" />فاکتور برای مریم ر.</span>
        <span className="tnum text-muted font-semibold">شمارهٔ ۱۰۴۲</span>
      </div>
      <div className="mt-2 space-y-1">
        <div className="ld-in" style={I(0)}><Row a="۱ هودی H12، سایز L" b="۸۵۰٬۰۰۰" /></div>
        <div className="ld-in" style={I(1)}><Row a="۲ تیشرت T07، سایز M" b="۸۴۰٬۰۰۰" /></div>
        <div className="ld-in" style={I(2)}><Row a="تخفیف باشگاه" b="−۱۶۹٬۰۰۰" muted /></div>
        <div className="ld-in" style={I(3)}><Row a="ارسال" b="۹۰٬۰۰۰" muted /></div>
      </div>
      <div className="ld-pop flex justify-between font-extrabold border-t border-line mt-2 pt-2 text-[13px]" style={I(4)}><span>جمع</span><span className="tnum">۱٬۶۱۱٬۰۰۰ تومان</span></div>
      <div className="ld-pop mt-3 flex flex-wrap items-center gap-2 whitespace-nowrap" style={I(5)}>
        <span className="flex-1 rounded-[6px] bg-accent text-accent-fg px-2.5 py-1.5 font-extrabold flex items-center justify-center gap-1.5"><Send className="size-3.5" />ارسال لینک فاکتور</span>
        <span className="ld-pop rounded-[6px] bg-primary-soft text-primary px-2 py-1.5 font-bold flex items-center gap-1" style={I(7)}><Check className="size-3.5" strokeWidth={3} />سفارش ثبت شد</span>
      </div>
    </VisBox>
  );
}

/* ---------------- Chatbot spotlight ---------------- */

const CHAT_POINTS = [
  { icon: UserRound, title: "از پیوی خودت جواب می‌ده", text: "به اسم خودت توی پیوی تلگرامت با مشتری حرف می‌زنه؛ مشتری فکر می‌کنه داره با خودت چت می‌کنه." },
  { icon: MessageSquareText, title: "تلگرام و بله", text: "روی ربات فروشگاهت توی تلگرام و بله، یا مستقیم توی پیوی تلگرام." },
  { icon: History, title: "گزارش دقیق از هر گفتگو", text: "تاریخچهٔ کامل هر چت، سفارش‌ها، فیش‌ها و هزینهٔ هر پیام." },
  { icon: ShieldCheck, title: "حرف بی‌ربط نمی‌زنه", text: "فقط دربارهٔ فروش حرف می‌زنه و هر وقت مشتری آدم بخواد، گفتگو رو می‌ده دست تو." },
];

function ChatBot() {
  return (
    <section id="chat" className="py-16 sm:py-20 scroll-mt-20" aria-labelledby="chat-title">
      <div className="ld-panel rounded-[20px] p-6 sm:p-10 lg:p-12 grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-bold text-muted mb-4">
            <PlatformIcon platform="telegram" size={24} /><PlatformIcon platform="bale" size={24} />
            یکی از کارهای فروشیفای
          </div>
          <h2 id="chat-title" className="text-[26px] sm:text-[34px] font-black tracking-tight leading-[1.35] text-balance">
            و یه دستیار چت که مشتری نمی‌فهمه رباته.
          </h2>
          <ul className="mt-7 grid sm:grid-cols-2 gap-x-7 gap-y-6">
            {CHAT_POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="size-9 shrink-0 rounded-[9px] bg-primary-soft text-primary grid place-items-center"><p.icon className="size-[18px]" aria-hidden /></span>
                <div>
                  <h3 className="font-extrabold text-[16px]">{p.title}</h3>
                  <p className="text-muted text-[15px] leading-[1.8] mt-0.5">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <ChatDemo />
      </div>
    </section>
  );
}

/* ---------------- Why Froshify ---------------- */

const WHY = [
  { icon: TrendingUp, title: "توی چند پلتفرم بفروش", text: "هر پلتفرم یه دسته مشتری تازه‌ست. با فروشیفای تلگرام، بله، اینستاگرام و دیجی‌کالا رو هم‌زمان داری، بدون این که کارت چند برابر بشه." },
  { icon: Layers, title: "کارت یکدسته می‌شه", text: "یه پنل، یه انبار، یه لیست محصول و سفارش. هر چیزی رو یه بار وارد می‌کنی و همه‌جا درست و هماهنگ می‌مونه." },
  { icon: Clock, title: "کارهای تکراری خودکار", text: "انتشار، موجودی، جواب مشتری و سفارش خودکار انجام می‌شن؛ وقت تو می‌مونه برای این که فروشگاهت رو بزرگ‌تر کنی." },
];

function Why() {
  return (
    <section id="why" className="py-16 sm:py-20 scroll-mt-20" aria-labelledby="why-title">
      <div className="max-w-2xl">
        <h2 id="why-title" className="text-[30px] sm:text-[42px] font-black tracking-tight leading-[1.3] text-balance">
          چرا فروشیفای؟<br className="hidden sm:block" />
          <span className="text-primary"> چون خودکاره، و خودکار یعنی فروش بیشتر.</span>
        </h2>
        <p className="text-muted text-[17px] mt-4 leading-[1.9]">یکی از مطمئن‌ترین راه‌های افزایش فروش اینه که هم‌زمان توی چند پلتفرم بفروشی. بدون اتوماسیون این یعنی چند برابر کار؛ با فروشیفای یعنی همون کار همیشگی.</p>
      </div>
      <ul className="mt-10 grid sm:grid-cols-3 gap-4 sm:gap-5">
        {WHY.map((w) => (
          <li key={w.title} className="ld-vis rounded-[16px] p-6">
            <span className="size-10 rounded-[10px] bg-primary-soft text-primary grid place-items-center"><w.icon className="size-5" aria-hidden /></span>
            <h3 className="font-extrabold text-[18px] mt-4">{w.title}</h3>
            <p className="text-muted text-[15px] leading-[1.85] mt-1.5">{w.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- Start ---------------- */

const STEPS = [
  { title: "کانالت رو وصل کن", text: "تلگرام، بله، اینستاگرام یا دیجی‌کالا. محصول‌هات خودشون میان توی فروشیفای." },
  { title: "تنظیمش کن", text: "انتشار، موجودی و دستیار چت رو هر جور خواستی روشن کن و به ادمینت یاد بده." },
  { title: "بسپارش به فروشیفای", text: "از اینجا به بعد فروشیفای فروشگاهت رو می‌چرخونه؛ تو فقط تأیید می‌کنی." },
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
        <p className="lg:col-span-2 border-t border-current/15 pt-7 flex items-center gap-3 text-[17px] sm:text-[19px] font-extrabold">
          <ShieldCheck className="size-6 shrink-0 text-[var(--primary)]" aria-hidden />
          یه هفته با ما کار کن؛ دوست نداشتی، اشتراکت رو لغو کن.
        </p>
      </div>
    </section>
  );
}
