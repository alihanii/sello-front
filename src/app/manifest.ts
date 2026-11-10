import type { MetadataRoute } from "next";

// Installable panel (Add to Home Screen): foroshify's gold tag on the emerald brand color.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "foroshify | ادمین هوشمند فروشگاه",
    short_name: "foroshify",
    description: "دستیار ۲۴ ساعته فروشگاه‌های آنلاین: کرال، ساخت محصول با AI و انتشار خودکار در کانال‌ها",
    lang: "fa",
    dir: "rtl",
    start_url: "/app",
    display: "standalone",
    background_color: "#173d35",
    theme_color: "#173d35",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
