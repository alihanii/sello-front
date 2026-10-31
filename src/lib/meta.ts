export const PLATFORMS: Record<string, { label: string; color: string }> = {
  telegram: { label: "تلگرام", color: "#2AABEE" },
  bale: { label: "بله", color: "#16A085" },
  digikala: { label: "دیجی‌کالا", color: "#EF394E" },
  instagram: { label: "اینستاگرام", color: "#E1306C" },
};

export const SOURCES: Record<string, { label: string; tone: string }> = {
  manual: { label: "دستی", tone: "neutral" },
  crawl: { label: "کرال", tone: "crawl" },
  ai: { label: "AI", tone: "ai" },
};

export const LISTING_STATUS: Record<string, { label: string; tone: string }> = {
  not_published: { label: "منتشرنشده", tone: "neutral" },
  queued: { label: "در صف", tone: "warning" },
  publishing: { label: "در حال انتشار", tone: "primary" },
  published: { label: "منتشرشده", tone: "success" },
  failed: { label: "ناموفق", tone: "danger" },
  out_of_sync: { label: "نیاز به به‌روزرسانی", tone: "warning" },
  removed: { label: "حذف‌شده", tone: "neutral" },
};

export const OP_STATUS: Record<string, { label: string; tone: string }> = {
  queued: { label: "در صف", tone: "warning" },
  running: { label: "در حال انجام", tone: "primary" },
  succeeded: { label: "موفق", tone: "success" },
  failed: { label: "ناموفق", tone: "danger" },
  partial: { label: "نیمه‌موفق", tone: "warning" },
};

export const OP_TYPES: Record<string, string> = {
  connect: "اتصال کانال",
  health_check: "بررسی سلامت",
  publish: "انتشار",
  crawl: "کرال",
  ai_product: "ساخت با AI",
  image_clean: "ساخت/تمیز کردن عکس با AI",
};
