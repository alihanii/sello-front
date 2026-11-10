import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Clarity } from "@/components/Clarity";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || "https://foroshify.ir";
const DESCRIPTION = "دستیار ۲۴ ساعته فروشگاه‌های آنلاین: کرال، ساخت محصول با AI و انتشار خودکار در کانال‌ها";

// Icons (favicon.ico, icon.svg, apple-icon.png), the Open Graph image and manifest.ts live in src/app as file
// conventions; Next adds their <link>/<meta> tags itself. metadataBase makes the og:image URL absolute.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "foroshify | ادمین هوشمند فروشگاه",
  description: DESCRIPTION,
  applicationName: "foroshify",
  appleWebApp: { title: "foroshify" },
  openGraph: { type: "website", siteName: "foroshify", locale: "fa_IR", title: "foroshify | ادمین هوشمند فروشگاه", description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: "foroshify | ادمین هوشمند فروشگاه", description: DESCRIPTION },
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
