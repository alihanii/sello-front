import { ArrowLeft, Check, History, MessageSquareText, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shell/Brand";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { ThemeSwitch } from "./ThemeSwitch";
import "./landing.css";

/* Static page, no app-shell bundle. Hero text is never animated (it is the LCP element);
   only the chat demo plays once, and rows reveal with a CSS scroll timeline where supported. */


export default function Landing() {
  return (
    <div className="ld">
      <div className="sticky top-0 z-30 px-4 pt-3">
        <header className="ld-header max-w-6xl mx-auto rounded-2xl h-14 ps-3 pe-2 flex items-center justify-between">
          <Link prefetch={false} href="/" aria-label="Sello" className="flex items-center h-full"><Logo /></Link>
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
          محصول، موجودی، انتشار، گفتگو با مشتری و سفارش؛ سلو همهٔ کارهای فروشگاهت رو از یه پنل می‌چرخونه. تو فقط تصمیم می‌گیری.
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
        alt="پنل سلو: محصول‌ها، موجودی، چت هوشمند با مشتری و انتشار در تلگرام، بله و اینستاگرام"
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
    <div className="relative mx-auto w-full max-w-[380px]" role="img" aria-label="نمونهٔ گفتگوی دستیار سلو با مشتری که به سفارش می‌رسد">
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

/* ---------------- What Sello does: the seven ---------------- */

const SEVEN: { title: string; text: string; visual: React.ReactNode }[] = [
  {
    title: "کل فروشگاهت توی یه پنل",
    text: "تلگرام، بله، اینستاگرام و دیجی‌کالا کنار هم: محصول، موجودی، انتشار، گفتگو و سفارش. چند تا فروشگاه هم داشته باشی، همه از همین‌جا.",
    visual: <VisHub />,
  },
  {
    title: "یه ادمین کامل که با AI با مشتری‌هات حرف می‌زنه",
    text: "لحن، سؤال‌های پرتکرار، قوانین و جدول سایز رو یادش می‌دی؛ بعد ۲۴ ساعته و با صد نفر هم‌زمان همون‌جوری جواب می‌ده که خودت می‌دادی.",
    visual: <VisTrain />,
  },
  {
    title: "برات سفارش می‌گیره",
    text: "رنگ و سایز و آدرس رو می‌پرسه، جمع رو از قیمت واقعی حساب می‌کنه، فیش رو می‌گیره و می‌ذاره جلوت که فقط تأیید کنی.",
    visual: <VisOrder />,
  },
  {
    title: "محصول‌هات خودشون میان",
    text: "پیج اینستاگرام، کانال تلگرام و بله یا پنل دیجی‌کالات رو بده؛ سلو پست‌ها رو کرال می‌کنه و با AI ازشون محصول کامل با قیمت و ویژگی درمیاره.",
    visual: <VisCrawl />,
  },
  {
    title: "عکس و اطلاعات محصول با AI",
    text: "یه عکس با گوشی و یه خط توضیح کافیه. عکس تمیز با زمینهٔ سفید، عنوان، توضیحات، دسته و ویژگی‌ها رو سلو می‌سازه.",
    visual: <VisMake />,
  },
  {
    title: "موجودی و انبار همیشه درسته",
    text: "موجودی هر محصول یه جاست. با هر سفارش خودش کم می‌شه، کم‌موجودها رو نشونت می‌ده و از اکسل هم یه‌جا آپدیت می‌شه.",
    visual: <VisStock />,
  },
  {
    title: "یه بار بساز، همه‌جا منتشر کن",
    text: "با یه کلیک توی همهٔ کانال‌هات می‌ره، هر کدوم با شکل خودش. هر اتفاقی بیفته رو مرحله‌به‌مرحله و توی تقویم می‌بینی.",
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
        <p className="text-muted text-[17px] mt-4 leading-[1.9]">از روزی که وصلش کنی، این هفت کار با سلوئه:</p>
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
function VisCrawl() {
  return (
    <VisBox>
      <div className="flex items-center gap-2">
        <PlatformIcon platform="instagram" size={24} />
        <span className="font-bold">۲۵ پست آخر پیج</span>
        <ArrowLeft className="size-3.5 text-primary" />
        <span className="rounded-[5px] bg-ai/8 text-ai px-1.5 py-px font-bold text-[11px]">AI</span>
      </div>
      <div className="mt-2.5 space-y-1">
        <Row a="هودی قلب هندسی · H12" b="۸۵۰٬۰۰۰" />
        <Row a="تیشرت مینیمال · T07" b="۴۲۰٬۰۰۰" />
        <Row a="۱۰ محصول دیگه…" b="" muted />
      </div>
    </VisBox>
  );
}
function VisStock() {
  return (
    <VisBox>
      {[["هودی H12", "۴", ""], ["سویشرت S03", "۲", "low"], ["ماگ M21", "۳۰", ""]].map(([n, q, low]) => (
        <div key={n} className="flex items-center justify-between py-0.5">
          <span className="font-semibold">{n}</span>
          <span className={`tnum font-extrabold ${low ? "text-warning" : ""}`}>{q} عدد{low ? " · کم‌موجود" : ""}</span>
        </div>
      ))}
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
            یکی از کارهای سلو
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

/* ---------------- Start ---------------- */

const STEPS = [
  { title: "کانالت رو وصل کن", text: "تلگرام، بله، اینستاگرام یا دیجی‌کالا. محصول‌هات خودشون میان توی سلو." },
  { title: "تنظیمش کن", text: "انتشار، موجودی و دستیار چت رو هر جور خواستی روشن کن و به ادمینت یاد بده." },
  { title: "بسپارش به سلو", text: "از اینجا به بعد سلو فروشگاهت رو می‌چرخونه؛ تو فقط تأیید می‌کنی." },
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
