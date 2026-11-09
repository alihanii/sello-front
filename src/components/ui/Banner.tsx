import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "./primitives";

const shell = "fade-in flex flex-wrap items-center gap-3 rounded-2xl border border-ai/25 bg-ai/8 px-4 py-3";

/** Warm notice strip (AI setup, store setup steps). With href the whole strip is a link and gets a chevron. */
export function Banner({ icon: Icon, href, action, className, children }: {
  icon: any; href?: string; action?: React.ReactNode; className?: string; children: React.ReactNode;
}) {
  const body = (
    <>
      <Icon className="size-5 text-ai shrink-0" aria-hidden />
      <p className="flex-1 min-w-48 text-[13px] leading-6">{children}</p>
      {action}
      {href && <ChevronLeft className="size-5 text-ai shrink-0" aria-hidden />}
    </>
  );
  return href
    ? <Link href={href} className={cn(shell, "hover:bg-ai/12 transition", className)}>{body}</Link>
    : <div className={cn(shell, className)}>{body}</div>;
}
