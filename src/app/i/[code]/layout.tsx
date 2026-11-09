import type { Metadata } from "next";

export const metadata: Metadata = { title: "فاکتور و پرداخت", robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
