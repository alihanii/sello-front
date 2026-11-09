"use client";

/**
 * Layout-true skeletons.
 *
 * Every block here copies the paddings, gaps, radii and grid columns of the real component it stands in for, so when data
 * arrives the content replaces the skeleton in place and nothing on the page jumps. Page-level skeletons (bottom of the file)
 * are used twice: by each route's loading.tsx (instant feedback while navigating) and by the page itself while its first
 * query is pending, so the two never drift apart.
 */
import { Card, Skeleton, cn } from "./primitives";

/** A line of text: height ≈ the line box of the font size it replaces. */
/**
 * A line of text. The outer box has the real line height of that font size (Vazirmatn ≈ 1.7×), the bar inside is about
 * the x-height, so a skeleton paragraph takes exactly the vertical space the text will take.
 */
export function SkLine({ className, style, size = 13 }: { className?: string; style?: React.CSSProperties; size?: number }) {
  return (
    <div aria-hidden className={cn("flex items-center", className)} style={{ height: Math.round(size * 1.7), ...style }}>
      <Skeleton className="w-full rounded-md" style={{ height: Math.round(size * 0.7) }} />
    </div>
  );
}

/** Same frame as <PageHeader>. */
export function PageHeaderSkeleton({ actions = 0, subtitle = true }: { actions?: number; subtitle?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 sm:mb-7" aria-hidden>
      <div className="min-w-0">
        <div className="h-[27.5px] sm:h-[37.5px] flex items-center"><Skeleton className="h-6 sm:h-8 w-40 sm:w-52 rounded-xl" /></div>
        {subtitle && <SkLine size={14} className="w-64 max-w-full mt-1" />}
      </div>
      {actions > 0 && (
        <div className="flex flex-wrap items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
          {Array.from({ length: actions }, (_, i) => <Skeleton key={i} className="h-11 w-28 rounded-full" />)}
        </div>
      )}
    </div>
  );
}

/** Same frame as <CardHeader>. */
export function CardHeaderSkeleton({ subtitle, action }: { subtitle?: boolean; action?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
      <div>
        <SkLine size={15} className="w-32" />
        {subtitle && <SkLine className="w-52 max-w-full mt-0.5" />}
      </div>
      {action && <Skeleton className="h-9 w-20 rounded-full" />}
    </div>
  );
}

/** A KPI card: icon + label, big number, optional hint. Matches the Stat cards on dashboards. */
export function StatSkeleton({ hint = true, compact }: { hint?: boolean; compact?: boolean }) {
  return (
    <Card className={compact ? "p-4" : "p-4 sm:p-5"}>
      <div className="flex items-center gap-2"><Skeleton className="size-4 rounded-md" /><SkLine className="w-20" size={compact ? 12 : 13} /></div>
      <Skeleton className={cn("rounded-lg w-16", compact ? "mt-1 h-[37px]" : "mt-2 h-[24px] sm:h-[30px]")} />
      {hint && <SkLine size={12} className="w-24 mt-2" />}
    </Card>
  );
}

export function StatGridSkeleton({ count = 4, className = "grid-cols-2 lg:grid-cols-4", hint, compact }: { count?: number; className?: string; hint?: boolean; compact?: boolean }) {
  return <div className={cn("grid gap-3 sm:gap-4", className)}>{Array.from({ length: count }, (_, i) => <StatSkeleton key={i} hint={hint} compact={compact} />)}</div>;
}

/** A card with a chart inside (CardHeader + plot area). */
export function ChartCardSkeleton({ className, plot = "h-56 sm:h-72" }: { className?: string; plot?: string }) {
  return (
    <Card className={className}>
      <CardHeaderSkeleton subtitle />
      <div className={cn("px-4 sm:px-5 pb-4 flex items-end gap-1.5", plot)}>
        {[40, 65, 30, 80, 55, 70, 45, 90, 60, 35, 75, 50, 85, 40, 65].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md rounded-b-none" style={{ height: `${h}%` }} />
        ))}
      </div>
    </Card>
  );
}

/** The filter bar card used above lists (selects/inputs in a glass strip). */
export function FilterBarSkeleton({ items = 3, search }: { items?: number; search?: boolean }) {
  return (
    <Card className="p-3 mb-4 flex flex-wrap gap-2 items-center">
      {search && <Skeleton className="h-11 flex-1 min-w-52 rounded-2xl" />}
      {Array.from({ length: items }, (_, i) => <Skeleton key={i} className="h-11 w-32 rounded-2xl" />)}
    </Card>
  );
}

/** Rows of a divided list: leading icon, a title line with a chip, a meta line. Matches activity/crawl/conversation rows. */
export function ListRowsSkeleton({ rows = 6, icon = 30, chip = true, trailing }: { rows?: number; icon?: number | false; chip?: boolean; trailing?: boolean }) {
  return (
    <ul className="divide-y divide-[var(--glass-edge)]" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-start gap-3 p-4">
          {icon !== false && <Skeleton className="rounded-lg shrink-0 mt-0.5" style={{ width: icon, height: icon }} />}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <SkLine size={15} style={{ width: `${45 + ((i * 17) % 30)}%` }} />
              {chip && <Skeleton className="h-6 w-16 rounded-full" />}
            </div>
            <SkLine size={12} className="w-1/3" />
          </div>
          {trailing && <Skeleton className="size-4 rounded mt-2" />}
        </li>
      ))}
    </ul>
  );
}

/** A table inside a strong card: header row + body rows. `first` renders the thumbnail+two-line product cell. */
export function TableSkeleton({ rows = 8, cols = 5, minWidth = 760, thumb, check }: { rows?: number; cols?: number; minWidth?: number; thumb?: boolean; check?: boolean }) {
  return (
    <div className="overflow-hidden" aria-hidden>
      <div style={{ minWidth } as any}>
        <div className="flex items-center gap-4 p-3 border-b border-edge">
          {check && <Skeleton className="size-4 rounded" />}
          {Array.from({ length: cols }, (_, c) => <SkLine key={c} size={12} className={c === 0 ? "w-24 flex-[2]" : "w-14 flex-1"} />)}
        </div>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex items-center gap-4 p-3 border-b border-edge last:border-0">
            {check && <Skeleton className="size-4 rounded" />}
            <div className="flex-[2] flex items-center gap-3 min-w-0">
              {thumb && <Skeleton className="size-11 rounded-xl shrink-0" />}
              <div className="flex-1 space-y-2"><SkLine size={15} style={{ width: `${55 + ((r * 13) % 35)}%` }} />{thumb && <SkLine size={12} className="w-16" />}</div>
            </div>
            {Array.from({ length: cols - 1 }, (_, c) => <div key={c} className="flex-1"><Skeleton className={cn("rounded-lg", thumb && c < 2 ? "h-9 w-24" : "h-4 w-3/4")} /></div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Square-image product cards (the products grid view). */
export function ProductCardsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="p-1.5">
          <Skeleton className="aspect-square rounded-control" />
          <div className="p-2 sm:p-2.5 space-y-2">
            <SkLine size={15} className="w-3/4" />
            <div className="flex justify-between"><SkLine className="w-16" /><Skeleton className="h-6 w-12 rounded-full" /></div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/** A small card with an icon, two lines and a row of buttons (channel cards, store cards…). */
export function EntityCardSkeleton({ buttons = 2, icon = 40, chip = true }: { buttons?: number; icon?: number; chip?: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="rounded-xl shrink-0" style={{ width: icon, height: icon }} />
        <div className="flex-1 space-y-2"><SkLine size={15} className="w-28" /><SkLine size={12} className="w-20" /></div>
        {chip && <Skeleton className="h-6 w-14 rounded-full" />}
      </div>
      <SkLine size={12} className="w-40 mt-4" />
      {buttons > 0 && <div className="flex gap-2 mt-4">{Array.from({ length: buttons }, (_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}</div>}
    </Card>
  );
}

/** Label + input pairs, the inside of a form card. */
export function FieldsSkeleton({ fields = 3, tall }: { fields?: number; tall?: number[] }) {
  return (
    <>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <SkLine className="w-24" />
          <Skeleton className={cn("rounded-2xl", tall?.includes(i) ? "h-28" : "h-11")} />
        </div>
      ))}
    </>
  );
}

export function FormCardSkeleton({ fields = 3, tall, className }: { fields?: number; tall?: number[]; className?: string }) {
  return <Card className={cn("p-5 space-y-4", className)}><FieldsSkeleton fields={fields} tall={tall} /></Card>;
}

/** Switch rows ("label … toggle"). */
export function ToggleRowsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <SkLine className="w-56 max-w-[70%]" />
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
      ))}
    </>
  );
}

/** A back link + title used at the top of detail pages. */
export function BackTitleSkeleton({ title = true }: { title?: boolean }) {
  return (
    <>
      <SkLine className="w-20 mb-3" />
      {title && <Skeleton className="h-7 w-44 rounded-xl mb-4" />}
    </>
  );
}

/** Tabs strip (segmented control). */
export function TabsSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("glass inline-flex max-w-full overflow-hidden rounded-xl p-1 gap-1", className)}>
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} className={cn("h-9 rounded-full shrink-0", i === 0 ? "w-20" : "w-24")} />)}
    </div>
  );
}

/* ───────────────────────────── Page-level skeletons ───────────────────────────── */

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری">
      <PageHeaderSkeleton actions={2} />
      <DashboardBodySkeleton />
    </div>
  );
}

export function DashboardBodySkeleton() {
  return (
    <>
      <StatGridSkeleton />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mt-4">
        <ChartCardSkeleton className="lg:col-span-2" />
        <div className="flex flex-col gap-4">
          <Card><CardHeaderSkeleton /><div className="px-5 pb-5 space-y-3"><SkLine className="w-4/5" /><SkLine className="w-3/5" /></div></Card>
          <Card className="p-5 space-y-3"><SkLine className="w-24" /><div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div></Card>
          <Card className="p-5 space-y-3"><SkLine className="w-24" /><SkLine size={12} className="w-40" /><Skeleton className="h-2 rounded-full" /></Card>
        </div>
      </div>
    </>
  );
}

export function ProductsSkeleton() {
  return (
    <div aria-busy="true">
      <PageHeaderSkeleton actions={4} />
      <FilterBarSkeleton search items={4} />
      <ProductsBodySkeleton />
    </div>
  );
}

/** The table on desktop, the card grid on phones (same switch the page makes). */
export function ProductsBodySkeleton({ view }: { view?: "table" | "grid" }) {
  const table = <Card strong className="overflow-x-auto"><TableSkeleton rows={8} cols={6} minWidth={900} thumb check /></Card>;
  const grid = <ProductCardsSkeleton />;
  if (view === "table") return table;
  if (view === "grid") return grid;
  return (
    <>
      <div className="hidden md:block">{table}</div>
      <div className="md:hidden">{grid}</div>
    </>
  );
}

export function ActivitySkeleton() {
  return (
    <div aria-busy="true">
      <PageHeaderSkeleton />
      <FilterBarSkeleton items={3} />
      <Card strong><ListRowsSkeleton rows={8} trailing /></Card>
    </div>
  );
}

export function OperationSkeleton() {
  return (
    <div aria-busy="true">
      <BackTitleSkeleton title={false} />
      <Card className="p-5 mb-4">
        <div className="flex flex-wrap items-start gap-4">
          <Skeleton className="size-11 rounded-xl" />
          <div className="flex-1 min-w-52 space-y-2.5">
            <div className="flex items-center gap-2"><Skeleton className="h-6 w-56 rounded-lg" /><Skeleton className="h-6 w-16 rounded-full" /></div>
            <SkLine size={12} className="w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </Card>
      <Card className="mb-4">
        <CardHeaderSkeleton subtitle />
        <div className="px-5 pb-5 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3"><Skeleton className="size-6 rounded-full shrink-0" /><SkLine size={15} className="flex-1 max-w-80" /><SkLine size={12} className="w-12" /></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/** Month view: 4 totals + the 7×6 grid. */
export function CalendarSkeleton({ header = true }: { header?: boolean }) {
  return (
    <div aria-busy="true">
      {header && (
        <>
          <PageHeaderSkeleton />
          <Card className="p-3 mb-4 flex flex-wrap items-center gap-2">
            <TabsSkeleton count={3} />
            <Skeleton className="h-9 w-56 rounded-control" />
            <div className="flex-1" />
            <Skeleton className="h-11 w-36 rounded-2xl" />
          </Card>
        </>
      )}
      <CalendarMonthSkeleton />
    </div>
  );
}

export function CalendarMonthSkeleton() {
  return (
    <>
      <StatGridSkeleton className="grid-cols-2 md:grid-cols-4" hint={false} compact />
      <Card strong className="p-2 sm:p-3 mt-4">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">{Array.from({ length: 7 }, (_, i) => <div key={i} className="py-1 flex justify-center"><SkLine className="w-4" /></div>)}</div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {Array.from({ length: 42 }, (_, i) => <Skeleton key={i} className="rounded-xl sm:rounded-2xl min-h-[58px] md:min-h-[112px]" />)}
        </div>
      </Card>
    </>
  );
}

export function ChannelsSkeleton() {
  return (
    <div aria-busy="true">
      <PageHeaderSkeleton />
      <ChannelsBodySkeleton />
    </div>
  );
}

export function ChannelsBodySkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => <EntityCardSkeleton key={i} buttons={3} />)}
      </div>
      <Skeleton className="h-5 w-28 rounded-md mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="p-5 flex flex-col">
            <Skeleton className="size-11 rounded-xl" />
            <SkLine size={15} className="w-24 mt-3" />
            <div className="flex gap-1 mt-2"><Skeleton className="h-6 w-14 rounded-full" /><Skeleton className="h-6 w-12 rounded-full" /></div>
            <Skeleton className="h-9 mt-4 rounded-control" />
          </Card>
        ))}
      </div>
    </>
  );
}

export function CrawlSkeleton() {
  return (
    <div aria-busy="true">
      <PageHeaderSkeleton actions={1} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card><CardHeaderSkeleton /><ListRowsSkeleton rows={2} icon={28} chip={false} /></Card>
          <Card><CardHeaderSkeleton subtitle /><ListRowsSkeleton rows={4} icon={false} /></Card>
        </div>
        <Card className="self-start"><CardHeaderSkeleton subtitle /><div className="px-5 pb-5 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="flex items-center gap-2"><Skeleton className="size-10 rounded-lg" /><div className="flex-1 space-y-1.5"><SkLine className="w-3/4" /><SkLine size={12} className="w-16" /></div></div>)}</div></Card>
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div aria-busy="true">
      <PageHeaderSkeleton actions={1} subtitle={false} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <FormCardSkeleton fields={3} tall={[2]} />
        <Card className="p-5 space-y-4"><ToggleRowsSkeleton rows={2} /></Card>
      </div>
    </div>
  );
}

/** The chat page: header + tab strip + the overview body (the default tab). */
export function ChatSkeleton() {
  return (
    <div aria-busy="true">
      <PageHeaderSkeleton actions={1} />
      <div className="mb-5"><TabsSkeleton count={6} className="max-w-full overflow-hidden" /></div>
      <ChatOverviewSkeleton />
    </div>
  );
}

export function ChatOverviewSkeleton() {
  return (
    <div className="space-y-4">
      <StatGridSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2"><CardHeaderSkeleton subtitle /><div className="px-5 pb-5 space-y-4">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="flex items-center gap-3"><Skeleton className="size-5 rounded-full" /><SkLine className="flex-1 max-w-72" /></div>)}</div></Card>
        <div className="flex flex-col gap-4">
          <Card className="p-5 space-y-3"><SkLine className="w-32" /><Skeleton className="h-2 rounded-full" /><SkLine size={12} className="w-full" /></Card>
          <Card><CardHeaderSkeleton action /><div className="px-5 pb-5"><div className="flex items-center gap-3"><Skeleton className="size-8 rounded-lg" /><div className="flex-1 space-y-1.5"><SkLine className="w-28" /><SkLine size={12} className="w-36" /></div></div></div></Card>
        </div>
      </div>
    </div>
  );
}

/** A settings-style tab body: two form cards side by side. */
export function TwoFormCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <Card><CardHeaderSkeleton subtitle /><div className="px-5 pb-5 space-y-4"><FieldsSkeleton fields={3} tall={[2]} /></div></Card>
      <Card><CardHeaderSkeleton subtitle /><div className="px-5 pb-5 space-y-4"><ToggleRowsSkeleton rows={3} /><FieldsSkeleton fields={1} /></div></Card>
    </div>
  );
}

/** Matches <ProductDetails>: one card of fields (photos, name, code, price/stock, description) + the save button. */
export function ProductFormSkeleton() {
  return (
    <div className="space-y-4 max-w-2xl" aria-busy="true">
      <Card className="p-5 space-y-4">
        <div className="space-y-2"><SkLine className="w-16" /><div className="flex gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="size-24 rounded-2xl" />)}</div></div>
        <FieldsSkeleton fields={1} />
        <div className="space-y-2"><SkLine className="w-20" /><Skeleton className="h-11 w-48 rounded-2xl" /></div>
        <div className="grid grid-cols-2 gap-3"><FieldsSkeleton fields={2} /></div>
        <div className="space-y-2"><SkLine className="w-20" /><Skeleton className="h-40 rounded-2xl" /></div>
      </Card>
      <Skeleton className="h-12 rounded-full" />
    </div>
  );
}

export function ProductEditSkeleton() {
  return (
    <div aria-busy="true">
      <BackTitleSkeleton />
      <ProductFormSkeleton />
    </div>
  );
}

export function ProductNewSkeleton() {
  return (
    <div aria-busy="true">
      <PageHeaderSkeleton subtitle={false} />
      <div className="mb-4"><TabsSkeleton count={2} /></div>
      <ProductFormSkeleton />
    </div>
  );
}

/* Pages outside the store shell (centered column, own logo). */

export function StoresSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8" aria-busy="true">
      <Skeleton className="h-9 w-28 rounded-full mb-8" />
      <PageHeaderSkeleton actions={1} />
      <StoreCardsSkeleton />
    </div>
  );
}

export function StoreCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[0, 1].map((i) => (
        <Card key={i} className="p-5 flex items-center gap-4">
          <Skeleton className="size-12 rounded-xl" />
          <div className="flex-1 space-y-2"><SkLine size={15} className="w-32" /><SkLine size={12} className="w-44" /></div>
        </Card>
      ))}
    </div>
  );
}

/** Matches <PlanCards>: one strong card, features on one side, duration options + buy button on the other. */
export function PlanCardsSkeleton() {
  return (
    <Card strong className="max-w-4xl mx-auto p-5 sm:p-8 grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-6 md:gap-10" aria-busy="true">
      <div>
        <Skeleton className="h-7 w-32 rounded-lg" />
        <SkLine className="w-56 max-w-full mt-2" />
        <div className="mt-5 space-y-3">{[0, 1, 2, 3, 4, 5].map((j) => <div key={j} className="flex items-center gap-2.5"><Skeleton className="size-5 rounded-full" /><SkLine style={{ width: `${50 + ((j * 23) % 40)}%` }} /></div>)}</div>
      </div>
      <div className="flex flex-col gap-3">
        <SkLine size={12} className="w-20" />
        <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[74px] rounded-2xl" />)}</div>
        <Skeleton className="h-12 rounded-full mt-2" />
      </div>
    </Card>
  );
}

export function BillingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8" aria-busy="true">
      <Skeleton className="h-9 w-24 rounded-full" />
      <PageHeaderSkeleton subtitle={false} />
      <Card className="p-6 mb-10"><Skeleton className="h-16 w-full" /></Card>
      <PlanCardsSkeleton />
    </div>
  );
}

/** Onboarding wizard: step dots + one card. */
export function WizardSkeleton() {
  return (
    <div className="max-w-xl mx-auto px-4 py-8" aria-busy="true">
      <Skeleton className="h-9 w-28 rounded-full mb-8" />
      <div className="flex gap-2 mb-6">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-2 flex-1 rounded-full" />)}</div>
      <FormCardSkeleton fields={2} />
    </div>
  );
}

/* Admin pages. */

export function AdminDashboardSkeleton() {
  return (
    <div aria-busy="true">
      <PageHeaderSkeleton actions={1} />
      <StatGridSkeleton count={8} />
      <Card className="mt-4"><CardHeaderSkeleton /><div className="px-5 pb-5 flex flex-wrap gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-36 rounded-2xl" />)}</div></Card>
    </div>
  );
}

export function AdminTableSkeleton({ filters = 0, search, cols = 6 }: { filters?: number; search?: boolean; cols?: number }) {
  return (
    <div aria-busy="true">
      <PageHeaderSkeleton />
      {search && <Skeleton className="h-11 max-w-md rounded-2xl mb-4" />}
      {filters > 0 && <FilterBarSkeleton items={filters} />}
      <Card strong className="overflow-x-auto"><TableSkeleton rows={10} cols={cols} /></Card>
    </div>
  );
}

export function AdminUsageSkeleton({ stats = 6, actions = 1 }: { stats?: number; actions?: number }) {
  return (
    <div aria-busy="true">
      <PageHeaderSkeleton actions={actions} />
      <StatGridSkeleton count={stats} className={stats === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"} compact={stats !== 4} />
      <ChartCardSkeleton className="mt-4" plot="h-64" />
      <Card strong className="mt-4 overflow-x-auto"><CardHeaderSkeleton /><TableSkeleton rows={6} cols={6} minWidth={860} /></Card>
    </div>
  );
}

/** Admin pages that are one divided list in a strong card (channels, audit log). */
export function AdminListSkeleton({ filters = 0, icon = 32 as number | false }: { filters?: number; icon?: number | false }) {
  return (
    <div aria-busy="true">
      <PageHeaderSkeleton />
      {filters > 0 && <FilterBarSkeleton items={filters} />}
      <Card strong><ListRowsSkeleton rows={8} icon={icon} /></Card>
    </div>
  );
}

/** A settings section card: header + fields (integrations). */
export function FormSectionSkeleton({ fields = 3 }: { fields?: number }) {
  return <Card aria-busy="true"><CardHeaderSkeleton subtitle action /><div className="px-5 pb-5 space-y-4"><FieldsSkeleton fields={fields} /></div></Card>;
}

/** AI keys: key cards grid + routing table. */
export function AiKeysSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">{[0, 1, 2].map((i) => <EntityCardSkeleton key={i} buttons={2} />)}</div>
      <Card strong><CardHeaderSkeleton subtitle /><TableSkeleton rows={5} cols={6} minWidth={860} /></Card>
    </>
  );
}

export function AdminDetailSkeleton() {
  return (
    <div aria-busy="true">
      <BackTitleSkeleton title={false} />
      <Card className="p-5 mb-4 flex items-center gap-4"><Skeleton className="size-12 rounded-full" /><div className="flex-1 space-y-2"><SkLine size={20} className="w-40" /><SkLine size={12} className="w-56" /></div><Skeleton className="h-9 w-28 rounded-full" /></Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">{[0, 1].map((i) => <Card key={i}><CardHeaderSkeleton subtitle action /><ListRowsSkeleton rows={2} icon={28} chip={false} /></Card>)}</div>
        <Card><CardHeaderSkeleton /><ListRowsSkeleton rows={3} icon={false} /></Card>
      </div>
    </div>
  );
}

export function AdminFormsSkeleton() {
  return (
    <div aria-busy="true">
      <PageHeaderSkeleton actions={1} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          <Card><CardHeaderSkeleton subtitle /><div className="px-5 pb-5 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div></Card>
          <Card><CardHeaderSkeleton subtitle /><div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3"><FieldsSkeleton fields={6} /></div></Card>
        </div>
        <PlanCardsSkeleton />
      </div>
    </div>
  );
}

/** Generic stacked cards, for admin pages that are a few independent cards (integrations, AI keys, requests). */
export function CardsStackSkeleton({ cards = 3, header = true, actions = 0 }: { cards?: number; header?: boolean; actions?: number }) {
  return (
    <div aria-busy="true">
      {header && <PageHeaderSkeleton actions={actions} />}
      <div className="space-y-4">
        {Array.from({ length: cards }, (_, i) => <Card key={i}><CardHeaderSkeleton subtitle action={i === 0} /><ListRowsSkeleton rows={2} icon={36} /></Card>)}
      </div>
    </div>
  );
}

/** Chat settings tabs: two form cards in a 2/3 column and a side card. */
export function SettingsColumnsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" aria-busy="true">
      <div className="lg:col-span-2 space-y-4">
        <FormCardSkeleton fields={3} tall={[2]} />
        <Card className="p-5 space-y-4"><ToggleRowsSkeleton rows={3} /></Card>
      </div>
      <Card className="self-start"><CardHeaderSkeleton subtitle /><div className="px-5 pb-5 space-y-3"><SkLine className="w-full" /><SkLine className="w-4/5" /><Skeleton className="h-11 rounded-full mt-2" /></div></Card>
    </div>
  );
}

/** Chat → usage: period select, six small stats, chart, log table. */
export function ChatUsageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex justify-end"><Skeleton className="h-11 w-28 rounded-2xl" /></div>
      <StatGridSkeleton count={6} className="grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" compact />
      <ChartCardSkeleton plot="h-64" />
      <Card strong><CardHeaderSkeleton /><TableSkeleton rows={5} cols={5} /></Card>
    </div>
  );
}

/** A single list card (FAQ list, conversation list, order list) with header. */
export function ListCardSkeleton({ rows = 4 }: { rows?: number }) {
  return <Card aria-busy="true"><CardHeaderSkeleton subtitle action /><ListRowsSkeleton rows={rows} icon={false} /></Card>;
}

export function AdminAiKeysPageSkeleton() {
  return <div aria-busy="true"><PageHeaderSkeleton actions={1} /><AiKeysSkeleton /></div>;
}

export function AdminIntegrationsSkeleton() {
  return <div aria-busy="true"><PageHeaderSkeleton /><div className="space-y-4"><FormSectionSkeleton fields={3} /><FormSectionSkeleton fields={2} /></div></div>;
}

/** Stands in for a short inline value (a count in a subtitle) so the line keeps its height while loading. */
export function InlineSkeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block align-middle h-3 w-16 rounded-md bg-subtle shimmer", className)} />;
}
