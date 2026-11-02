import {
  ArrowLeft, BellRing, CalendarDays, FileSpreadsheet, Globe, Layers, MessageSquareText,
  ReceiptText, ScrollText, Send, ShieldCheck, Sparkles, Store, UserRound,
} from "lucide-react";
import Link from "next/link";
import { Logo, ThemeToggle } from "@/components/shell/AppShell";
import { PlatformIcon } from "@/components/ui/status";
import "./landing.css";

/* Copy comes from the product doc and specs: what is built is stated as built, what is in
   test or planned says so. */

const PRINCIPLES = [
  {
    title: "یک عکس کافی است",
    text: "یک عکس معمولی با گوشی و یک خط توضیح بده. عنوان، توضیحات، دسته، ویژگی‌ها و عکس تمیز با زمینهٔ سفید را سلو می‌سازد.",
    example: "چیزی که در عکس نیست، مثل برند یا قیمت، را از خودش نمی‌سازد.",
  },
  {
    title: "یک بار بساز، همه‌جا بفروش",
    text: "هر محصول یک بار در هاب ساخته می‌شود و با شکل مخصوص هر کانال در تلگرام، بله و دیجی‌کالا منتشر می‌شود.",
    example: "تلگرام آلبوم و کپشن می‌گیرد، دیجی‌کالا دسته و ویژگی‌های اجباری.",
  },
  {
    title: "همیشه بیدار",
    text: "دستیار فروش در تلگرام و بله ۲۴ ساعته جواب می‌دهد: محصول را معرفی می‌کند، سؤال متداول را جواب می‌دهد و سفارش می‌گیرد.",
    example: "پیامی که ساعت ۲ بامداد می‌رسد، همان لحظه جواب می‌گیرد.",
  },
  {
    title: "هیچ کاری بی‌صدا انجام نمی‌شود",
    text: "هر انتشار، کرال و ساخت با AI وضعیت و لاگ مرحله‌به‌مرحله دارد. اگر چیزی نشد، دلیلش را به فارسی می‌بینی.",
    example: "تقویم نشان می‌دهد هر روز چه آمد، چه منتشر شد و کجا خطا بود.",
  },
  {
    title: "عددها از دیتابیس، نه از حدس",
    text: "قیمت، موجودی و جمع سفارش را کد سلو حساب می‌کند، نه مدل هوش مصنوعی. دستیار فقط دربارهٔ فروش و محصول حرف می‌زند.",
    example: "اگر مدل اشتباه کند، عدد اشتباه به مشتری نمی‌رسد.",
  },
  {
    title: "تصمیم آخر با توست",
    text: "محصولی که AI می‌سازد اول پیش‌نویس است. فیش و سفارش را تو تأیید می‌کنی و با تأیید، موجودی کم می‌شود.",
    example: "هر وقت خودت در گفتگو جواب بدهی، دستیار کنار می‌رود.",
  },
  {
    title: "کم‌خرج و ساخته برای ایران",
    text: "فارسی و تقویم شمسی، بله هم‌سطح تلگرام، ورود با موبایل و درگاه بانکی ایرانی. هر پیام مشتری حداکثر یک بار به مدل می‌رود.",
    example: "هزینه و توکن هر پیام را در تب «مصرف» می‌بینی.",
  },
];

const STAGES = [
  { title: "ورود محصول", text: "دستی، اکسل یا کرال از کانال‌ها", status: "done" },
  { title: "ساخت محتوا با AI", text: "از یک عکس خام تا محصول کامل", status: "done" },
  { title: "انتشار چندکاناله", text: "تلگرام، بله و دیجی‌کالا با لاگ", status: "done" },
  { title: "گفتگو با مشتری", text: "دستیار ۲۴ ساعتهٔ تلگرام و بله", status: "test" },
  { title: "سفارش و پرداخت", text: "سفارش در چت، فیش، تأیید تو", status: "test" },
  { title: "ارسال", text: "وصل شدن سفارش به پست و پیگیری", status: "soon" },
] as const;

const STATUS = {
  done: { label: "آماده", cls: "bg-primary text-primary-fg" },
  test: { label: "در حال تست", cls: "bg-warning/15 text-warning" },
  soon: { label: "به‌زودی", cls: "bg-subtle text-muted" },
};

const TOOLKIT = [
  {
    title: "محصول",
    items: [
      { icon: Layers, text: "هاب محصول: منبع هر کالا (دستی، کرال، AI) و اینکه کجا منتشر شده" },
      { icon: Sparkles, text: "ساخت محصول با AI از یک عکس و یک خط توضیح" },
      { icon: Globe, text: "کرال از کانال تلگرام و بله، دیجی‌کالا و پیج اینستاگرام" },
      { icon: FileSpreadsheet, text: "ورود گروهی از اکسل با پیش‌نمایش ردیف‌ها" },
    ],
  },
  {
    title: "انتشار و پیگیری",
    items: [
      { icon: Send, text: "انتشار با یک کلیک در یک یا چند کانال" },
      { icon: ScrollText, text: "لاگ مرحله‌به‌مرحلهٔ هر انتشار با دلیل خطا" },
      { icon: CalendarDays, text: "تقویم شمسی: کرال، محصول جدید و انتشار هر روز" },
      { icon: BellRing, text: "اعلان پایان کارها و سفارش‌های تازه" },
    ],
  },
  {
    title: "فروش در چت",
    items: [
      { icon: MessageSquareText, text: "دستیار فروش با لحن خودت، روی ربات یا پیوی تلگرام" },
      { icon: ReceiptText, text: "سفارش، اطلاعات پرداخت و ذخیرهٔ فیش در همان گفتگو" },
      { icon: UserRound, text: "تحویل گفتگو به تو وقتی مشتری آدم بخواهد" },
      { icon: ShieldCheck, text: "سؤال متداول، قوانین و ساعت کاری فروشگاه" },
    ],
  },
];

const STEPS = [
  { title: "فروشگاهت را بساز", text: "فقط یک اسم. بعداً هر چند فروشگاه که بخواهی اضافه می‌کنی." },
  { title: "کانالت را وصل کن", text: "تلگرام، بله، دیجی‌کالا یا پیج اینستاگرام؛ برای شروع یکی کافی است." },
  { title: "یک عکس بده", text: "محصول ساخته می‌شود و با یک کلیک در کانالت منتشر می‌شود." },
];

export default function Landing() {
  return (
    <div className="ld">
      <div className="sticky top-0 z-30 px-4 pt-4">
        <header className="glass max-w-6xl mx-auto rounded-full h-14 ps-3 pe-2 sm:px-4 flex items-center justify-between">
          <Link href="/" aria-label="Sello"><Logo /></Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#principles" className="hidden md:inline-flex h-9 items-center px-3 rounded-full text-[14px] font-semibold text-muted hover:text-fg">اصول</a>
            <a href="#toolkit" className="hidden md:inline-flex h-9 items-center px-3 rounded-full text-[14px] font-semibold text-muted hover:text-fg">امکانات</a>
            <Link href="/pricing" className="inline-flex h-9 items-center px-3 rounded-full text-[14px] font-semibold text-muted hover:text-fg">پلن‌ها</Link>
            <ThemeToggle />
            <Link href="/login" className="ld-btn ld-btn-primary !h-9 !px-4 !text-[13px]">ورود</Link>
          </nav>
        </header>
      </div>

      <main className="max-w-6xl mx-auto px-4">
        <Hero />
        <Cycle />
        <Principles />
        <Toolkit />
        <Start />
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-10 flex items-center justify-between gap-4 text-[13px] text-muted border-t border-line mt-6">
        <Logo compact />
        <span>ادمین ۲۴ ساعتهٔ فروشگاه‌های تلگرام، بله، اینستاگرام و دیجی‌کالا</span>
        <span dir="ltr">© Sello</span>
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <section className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-10 items-center pt-14 sm:pt-20 lg:pt-24 pb-20">
      <div>
        <h1 className="text-[40px] leading-[1.25] sm:text-[56px] sm:leading-[1.2] font-black tracking-tight text-balance">
          <span className="ld-rise block" style={{ "--i": 0 } as React.CSSProperties}>ادمینی که</span>
          <span className="ld-rise block text-primary" style={{ "--i": 1 } as React.CSSProperties}>هیچ‌وقت نمی‌خوابد.</span>
        </h1>
        <p className="ld-rise text-muted text-[17px] sm:text-[19px] leading-[1.9] mt-6 max-w-[34rem]" style={{ "--i": 2 } as React.CSSProperties}>
          سلو از یک عکس محصول می‌سازد، در کانال‌هایت منتشر می‌کند و در تلگرام و بله به‌جای تو با مشتری حرف می‌زند و سفارش می‌گیرد.
          تو فقط تأیید می‌کنی.
        </p>
        <div className="ld-rise flex flex-wrap gap-3 mt-9" style={{ "--i": 3 } as React.CSSProperties}>
          <Link href="/login" className="ld-btn ld-btn-primary">
            شروع رایگان <ArrowLeft className="ld-arrow size-4" aria-hidden />
          </Link>
          <a href="#principles" className="ld-btn ld-btn-quiet">سلو چطور کار می‌کند؟</a>
        </div>
        <div className="ld-rise flex items-center gap-3 mt-10" style={{ "--i": 4 } as React.CSSProperties}>
          <div className="flex gap-1.5">
            {["telegram", "bale", "instagram", "digikala"].map((p) => (
              <PlatformIcon key={p} platform={p} size={32} />
            ))}
          </div>
          <span className="text-[13px] text-muted">تلگرام، بله، اینستاگرام و دیجی‌کالا</span>
        </div>
      </div>
      <ChatDemo />
    </section>
  );
}

/** The hero's one authored moment: a customer question answered from the catalogue and turned into an order. Pure CSS; the final frame is the default state. */
function ChatDemo() {
  return (
    <div className="ld-rise relative mx-auto w-full max-w-[400px]" style={{ "--i": 2 } as React.CSSProperties} aria-label="نمونهٔ گفتگوی دستیار فروش با مشتری" role="img">
      <div className="ld-phone rounded-[32px] p-3 sm:p-4">
        <div className="flex items-center gap-3 px-2 pb-3 border-b border-line">
          <span className="size-10 rounded-full bg-primary text-primary-fg grid place-items-center" aria-hidden><Store className="size-[18px]" /></span>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-[14px]">فروشگاه هودی</div>
            <div className="text-[12px] text-primary font-semibold">دستیار فروش · آنلاین</div>
          </div>
          <PlatformIcon platform="telegram" size={26} />
        </div>

        <div className="flex flex-col gap-2.5 pt-4 pb-1 text-[13.5px] leading-[1.8]">
          <div className="ld-msg ld-msg-in self-start max-w-[80%] rounded-2xl rounded-se-md bg-subtle px-3.5 py-2" style={{ "--d": "400ms" } as React.CSSProperties}>
            سلام، این هودی مشکی سایز L داری؟
            <span className="block text-[10.5px] text-muted text-end tnum">۰۲:۱۴</span>
          </div>

          <div className="relative self-end w-[84%]">
            <div className="ld-typing absolute end-0 top-0 flex gap-1 rounded-2xl bg-primary-soft px-3.5 py-3" aria-hidden>
              <i /><i /><i />
            </div>
            <div className="ld-msg ld-msg-out rounded-2xl rounded-ss-md bg-primary-soft p-2" style={{ "--d": "1900ms" } as React.CSSProperties}>
              <div className="flex gap-3 items-center rounded-xl bg-[var(--raised)] p-2">
                <div className="size-14 shrink-0 rounded-lg bg-[#111827] grid place-items-center" aria-hidden>
                  <svg viewBox="0 0 40 40" className="size-9"><path d="M14 8l-7 5 3 6 3-2v15h14V17l3 2 3-6-7-5c-1 2.5-3 4-6 4s-5-1.5-6-4z" fill="#374151" /><path d="M20 19l3.5 3.5L20 26l-3.5-3.5z" fill="#34d399" /></svg>
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[13px]">هودی مشکی قلب هندسی</div>
                  <div className="text-[12px] text-muted">کد H12 · سایز L موجود</div>
                  <div className="font-extrabold text-[13px] text-primary tnum">۸۵۰٬۰۰۰ تومان</div>
                </div>
              </div>
              <p className="px-1.5 pt-1.5">بله داریم. سایز L رو برات کنار بذارم؟</p>
            </div>
          </div>

          <div className="ld-msg ld-msg-in self-start rounded-2xl rounded-se-md bg-subtle px-3.5 py-2" style={{ "--d": "2900ms" } as React.CSSProperties}>
            آره، یکی می‌خوام
          </div>

          <div className="ld-msg ld-msg-out self-end w-[84%] rounded-2xl rounded-ss-md bg-primary-soft px-3.5 py-2.5" style={{ "--d": "3700ms" } as React.CSSProperties}>
            <div className="font-bold mb-1">خلاصهٔ سفارش</div>
            <div className="flex justify-between text-[12.5px]"><span>هودی H12 · L × ۱</span><span className="tnum">۸۵۰٬۰۰۰</span></div>
            <div className="flex justify-between text-[12.5px] text-muted"><span>ارسال</span><span className="tnum">۹۰٬۰۰۰</span></div>
            <div className="flex justify-between font-extrabold border-t border-line mt-1.5 pt-1.5"><span>جمع</span><span className="tnum">۹۴۰٬۰۰۰ تومان</span></div>
          </div>
        </div>
      </div>
      <div className="ld-msg absolute -bottom-5 start-4 sm:-start-6 glass-strong rounded-2xl px-4 py-2.5 flex items-center gap-2.5 text-[13px] font-bold" style={{ "--d": "4500ms" } as React.CSSProperties}>
        <span className="size-2 rounded-full bg-primary" aria-hidden />
        سفارش جدید منتظر تأیید توست
      </div>
    </div>
  );
}

function Cycle() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="cycle-title">
      <div className="max-w-2xl">
        <h2 id="cycle-title" className="text-[28px] sm:text-[36px] font-black tracking-tight leading-[1.35]">از عکس خام تا سفارش، یک مسیر</h2>
        <p className="text-muted text-[16px] mt-3 leading-[1.9]">
          کار فروش در شبکه‌های اجتماعی شش قدم دارد. سلو هر قدم را خودش انجام می‌دهد و خروجی‌اش را به قدم بعد می‌دهد؛ تو فقط جاهای حساس را تأیید می‌کنی.
        </p>
      </div>
      <ol className="mt-12 grid gap-y-8 sm:grid-cols-3 lg:grid-cols-6 relative">
        <span aria-hidden className="hidden lg:block absolute top-[11px] start-0 end-0 h-px bg-line" />
        {STAGES.map((s, i) => (
          <li key={s.title} className="relative flex lg:block gap-4 lg:pe-4">
            <span
              aria-hidden
              className={`ld-stage-dot relative z-10 mt-0.5 lg:mt-0 size-[23px] shrink-0 rounded-full grid place-items-center text-[11px] font-black tnum ${
                s.status === "done" ? "bg-primary text-primary-fg" : s.status === "test" ? "bg-warning text-white" : "bg-[var(--raised)] text-muted border border-line"
              }`}
            >
              {(i + 1).toLocaleString("fa-IR")}
            </span>
            <div className="lg:mt-4">
              <h3 className="font-extrabold text-[16px]">{s.title}</h3>
              <p className="text-muted text-[14px] leading-[1.8] mt-0.5">{s.text}</p>
              <span className={`inline-block mt-2 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${STATUS[s.status].cls}`}>{STATUS[s.status].label}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Principles() {
  return (
    <section id="principles" className="py-16 sm:py-24 scroll-mt-24 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-16" aria-labelledby="principles-title">
      <div className="lg:sticky lg:top-28 self-start">
        <h2 id="principles-title" className="text-[28px] sm:text-[40px] font-black tracking-tight leading-[1.3] text-balance">
          هفت اصلی که سلو<br className="hidden sm:block" /> با آن ساخته شده
        </h2>
        <p className="text-muted text-[16px] mt-4 leading-[1.9] max-w-md">
          هر چیزی که در سلو می‌بینی از این هفت قول می‌آید. اگر جایی یکی از آن‌ها رعایت نشده باشد، یعنی باگ است.
        </p>
        <Link href="/login" className="ld-btn ld-btn-primary mt-8 hidden lg:inline-flex">
          امتحانش کن <ArrowLeft className="ld-arrow size-4" aria-hidden />
        </Link>
      </div>

      <ol className="border-t border-line">
        {PRINCIPLES.map((p, i) => (
          <li key={p.title} className="ld-reveal grid grid-cols-[3.25rem_1fr] sm:grid-cols-[4.5rem_1fr] gap-x-4 py-7 sm:py-8 border-b border-line">
            <span className="ld-numeral text-[40px] sm:text-[56px] font-black" aria-hidden>
              {(i + 1).toLocaleString("fa-IR")}
            </span>
            <div>
              <h3 className="text-[19px] sm:text-[22px] font-black tracking-tight leading-[1.5]">{p.title}</h3>
              <p className="text-[15px] sm:text-[16px] leading-[1.9] mt-1.5 max-w-[38rem]">{p.text}</p>
              <p className="text-[14px] text-muted leading-[1.8] mt-2 flex gap-2">
                <span className="text-primary font-bold shrink-0">یعنی:</span>
                <span>{p.example}</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Toolkit() {
  return (
    <section id="toolkit" className="py-16 sm:py-20 scroll-mt-24" aria-labelledby="toolkit-title">
      <div className="max-w-2xl">
        <h2 id="toolkit-title" className="text-[28px] sm:text-[36px] font-black tracking-tight leading-[1.35]">در پنل سلو چه داری؟</h2>
        <p className="text-muted text-[16px] mt-3 leading-[1.9]">یک حساب، هر چند فروشگاه، و برای هر فروشگاه کانال‌ها و دستیار جدا.</p>
      </div>
      <div className="ld-surface mt-10 rounded-[28px] grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-line overflow-hidden">
        {TOOLKIT.map((g) => (
          <div key={g.title} className="p-6 sm:p-7">
            <h3 className="font-black text-[18px]">{g.title}</h3>
            <ul className="mt-5 space-y-4">
              {g.items.map((it) => (
                <li key={it.text} className="flex gap-3 text-[14.5px] leading-[1.8]">
                  <span className="size-8 shrink-0 rounded-[10px] bg-primary-soft text-primary grid place-items-center mt-0.5">
                    <it.icon className="size-4" aria-hidden />
                  </span>
                  <span>{it.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Start() {
  return (
    <section className="py-16 sm:py-24" aria-labelledby="start-title">
      <div className="rounded-[32px] bg-ink text-ink-fg p-8 sm:p-12 lg:p-14 grid lg:grid-cols-[1fr_1.3fr] gap-10 items-center">
        <div>
          <h2 id="start-title" className="text-[28px] sm:text-[38px] font-black tracking-tight leading-[1.35]">سه قدم تا اولین انتشار</h2>
          <p className="opacity-70 text-[16px] mt-3 leading-[1.9]">در کمتر از ۵ دقیقه، بدون تنظیمات پیچیده.</p>
          <Link href="/login" className="ld-btn mt-8 bg-[var(--primary)] text-[var(--primary-fg)]">
            ساخت حساب رایگان <ArrowLeft className="ld-arrow size-4" aria-hidden />
          </Link>
        </div>
        <ol className="grid sm:grid-cols-3 gap-6 sm:gap-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex sm:block gap-4">
              <span className="size-10 shrink-0 rounded-full border border-current/25 grid place-items-center font-black tnum">
                {(i + 1).toLocaleString("fa-IR")}
              </span>
              <div className="sm:mt-4">
                <h3 className="font-extrabold text-[16px]">{s.title}</h3>
                <p className="opacity-70 text-[14px] leading-[1.8] mt-1">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
