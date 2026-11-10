import type { MetadataRoute } from "next";

// Signed-in panels have nothing for a crawler (they only render after login), so don't crawl them at all.
// /login and /i/ (customers' invoice links) stay crawlable on purpose: they carry noindex, and a crawler
// has to fetch a page to see its noindex. Blocking them here could leave a shared invoice link listed by URL.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/app/", "/admin/"] },
  };
}
