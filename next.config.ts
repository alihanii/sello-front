import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Docker image runs the self-contained server in .next/standalone.
  output: "standalone",
  experimental: {
    // Signed-in pages are client components that fetch their own data, so the server payload of a route never changes:
    // keep it in the client router cache instead of asking the server again on every visit.
    staleTimes: { dynamic: 300, static: 1800 },
  },
};

export default nextConfig;
