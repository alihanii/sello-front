import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Clarity } from "@/components/Clarity";

export const metadata: Metadata = {
  title: "Sello | ادمین هوشمند فروشگاه",
  description: "دستیار ۲۴ ساعته فروشگاه‌های آنلاین: کرال، ساخت محصول با AI و انتشار خودکار در کانال‌ها",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#173d35" },
    { media: "(prefers-color-scheme: dark)", color: "#173d35" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Estedad (variable, 100–900), self-hosted in /public/fonts. Persian subset is the one every page needs. */}
        <link rel="preload" href="/fonts/estedad-arabic-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('sello-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans">
        <div className="scene" aria-hidden>
          <span className="orb" />
          <span className="orb" />
        </div>
        <Providers>{children}</Providers>
        <Clarity />
      </body>
    </html>
  );
}
