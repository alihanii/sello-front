/* Server-safe brand mark, so static pages (landing) can show it without the app shell bundle. */

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-black text-[21px] leading-none tracking-tight align-middle ${className ?? ""}`}>
      {/* Price-tag mark: a seller's tag, not a robot. */}
      <svg viewBox="0 0 32 32" className="size-9 shrink-0" aria-hidden>
        <rect x="1" y="1" width="30" height="30" rx="8" className="fill-accent" />
        <path d="M10 9.5h7.6c.5 0 1 .2 1.4.6l4.4 4.4c.8.8.8 2 0 2.8l-6.2 6.2c-.8.8-2 .8-2.8 0l-4.4-4.4c-.4-.4-.6-.9-.6-1.4V10c0-.3.2-.5.6-.5Z" fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-accent-fg" />
        <circle cx="13.6" cy="13.4" r="1.6" className="fill-accent-fg" />
      </svg>
      {!compact && <span dir="ltr" className="block leading-none pt-[0.08em]">Sello</span>}
    </span>
  );
}
