import { ArrowLeft, Bot, CalendarDays, Globe, Layers, ScrollText, Sparkles } from "lucide-react";
import Link from "next/link";
import { Logo, ThemeToggle } from "@/components/shell/AppShell";
import { PlatformIcon } from "@/components/ui/status";
import { Button, Card } from "@/components/ui/primitives";

const FEATURES = [
  { icon: Layers, title: "چند فروشگاه، یک پنل", text: "هر فروشگاه کانال‌ها، محصولات و تنظیمات خودش را دارد." },
  { icon: Globe, title: "کرال خودکار محصولات", text: "پست‌های کانال یا لیست محصولات دیجی‌کالا خودشان محصول می‌شوند." },
  { icon: Sparkles, title: "ساخت محصول با AI", text: "از عکس، لینک یا سبک کانال خودت، محصول کامل بساز." },
  { icon: Bot, title: "انتشار خودکار", text: "قانون بگذار، Sello خودش در کانال‌ها منتشر می‌کند." },
  { icon: ScrollText, title: "لاگ مرحله‌به‌مرحله", text: "ببین هر انتشار چه شد، و اگر نشد دقیقاً چرا." },
  { icon: CalendarDays, title: "تقویم فعالیت", text: "هر روز چقدر دیتا آمد، چه منتشر شد، کجا خطا بود." },
];

export default function Landing() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="glass rounded-2xl h-14 px-4 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-1">
          <Link href="/pricing"><Button variant="ghost" size="sm">پلن‌ها</Button></Link>
          <ThemeToggle />
          <Link href="/login"><Button size="sm">ورود / ثبت‌نام</Button></Link>
        </nav>
      </header>

      <section className="text-center pt-20 pb-16">
        <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-semibold text-ai">
          <Sparkles className="size-4" /> ادمین ۲۴ ساعتهٔ فروشگاه آنلاین تو
        </span>
        <h1 className="text-[36px] md:text-[52px] font-black leading-[1.3] mt-6 max-w-3xl mx-auto">
          محصول بساز، منتشر کن، پیگیری کن؛ <span className="text-primary">بدون ادمین</span>
        </h1>
        <p className="text-muted text-[17px] mt-5 max-w-2xl mx-auto">
          Sello محصولاتت را از کانال‌ها کرال می‌کند، با هوش مصنوعی کامل‌شان می‌کند و در تلگرام، بله، اینستاگرام و دیجی‌کالا منتشر می‌کند.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link href="/login"><Button size="lg" icon={<ArrowLeft className="size-4 order-last" />}>شروع رایگان</Button></Link>
          <Link href="/pricing"><Button size="lg" variant="secondary">مشاهدهٔ پلن‌ها</Button></Link>
        </div>
        <div className="flex justify-center gap-3 mt-10">
          {["telegram", "bale", "instagram", "digikala"].map((p) => <PlatformIcon key={p} platform={p} size={40} />)}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
        {FEATURES.map((f) => (
          <Card key={f.title} className="p-6 hover:-translate-y-0.5 transition">
            <span className="size-11 rounded-xl bg-primary/12 text-primary grid place-items-center mb-4"><f.icon className="size-5" /></span>
            <h3 className="font-bold text-[16px]">{f.title}</h3>
            <p className="text-muted text-[14px] mt-1">{f.text}</p>
          </Card>
        ))}
      </section>

      <Card strong className="p-10 text-center mb-10">
        <h2 className="text-[26px] font-black">در کمتر از ۵ دقیقه اولین محصولت را منتشر کن</h2>
        <p className="text-muted mt-2">فروشگاه بساز، کانالت را وصل کن، یک عکس بده؛ بقیه‌اش با Sello.</p>
        <Link href="/login"><Button size="lg" className="mt-6">ساخت حساب</Button></Link>
      </Card>
      <footer className="text-center text-muted text-[13px] pb-6" dir="ltr">© Sello</footer>
    </div>
  );
}
