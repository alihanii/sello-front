import { StoreLayout } from "@/components/shell/StoreLayout";

// The store area is rendered entirely in the browser (see AuthGuard), so the server output of a store route depends on
// nothing but the URL. Rendering it once per store and caching it (instead of on every request) keeps navigation light.
export function generateStaticParams() {
  return [];
}
export const dynamicParams = true;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StoreLayout>{children}</StoreLayout>;
}
