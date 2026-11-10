/* Server-safe brand mark, so static pages (landing) can show it without the app shell bundle. */

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-black text-[21px] leading-none tracking-tight align-middle ${className ?? ""}`}>
      {/* foroshify mark: an emerald price tag on a gold rounded square (same drawing as /icon.svg). */}
      <svg viewBox="0 0 32 32" className="size-9 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8.2" className="fill-accent" />
        <path d="M9.05 10.15Q9.05 9.05 10.15 9.05L17.04 9.05Q18.54 9.05 19.6 10.11L23.6 14.12Q25.29 15.82 23.6 17.52L17.52 23.6Q15.82 25.29 14.12 23.6L10.11 19.6Q9.05 18.54 9.05 17.04Z" fill="none" strokeWidth="2.09" strokeLinejoin="round" className="stroke-accent-fg" />
        <circle cx="13.35" cy="13.21" r="1.7" className="fill-accent-fg" />
      </svg>
      {!compact && <span dir="ltr" className="block leading-none pt-[0.08em]">foroshify</span>}
    </span>
  );
}
