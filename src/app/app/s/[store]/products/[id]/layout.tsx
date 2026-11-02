// Client-rendered detail page: its server output depends only on the URL, so render once per id and reuse it.
export function generateStaticParams() {
  return [];
}
export const dynamicParams = true;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
