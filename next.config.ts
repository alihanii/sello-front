import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Docker image runs the self-contained server in .next/standalone.
  output: "standalone",
  // Private pages (signed-in panels, login, customers' invoice links) must never show up in search results.
  // The pages also carry a robots meta tag; the header covers responses that have no HTML.
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return ["/app", "/app/:path*", "/admin", "/admin/:path*", "/login", "/i/:path*"].map((source) => ({ source, headers: noindex }));
  },
  experimental: {
    // Signed-in pages are client components that fetch their own data, so the server payload of a route never changes:
    // keep it in the client router cache instead of asking the server again on every visit.
    staleTimes: { dynamic: 300, static: 1800 },
  },
};

export default nextConfig;
