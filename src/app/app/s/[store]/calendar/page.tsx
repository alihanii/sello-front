"use client";

import { useQuery } from "@tanstack/react-query";
import {
  addDays, addMonths, endOfMonth, endOfYear, format as jf, isSameDay, isSameMonth, startOfMonth, startOfWeek, startOfYear,
} from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";
import { AlertTriangle, ChevronLeft, ChevronRight, CircleOff, Clock } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { faDigits, faNum } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { OP_TYPES } from "@/lib/meta";
import { StatusChip } from "@/components/ui/status";
import { Button, Card, Chip, PageHeader, Select, Sheet, Tabs, cn } from "@/components/ui/primitives";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const jfa = (d: Date, f: string) => faDigits(jf(d, f, { locale: faIR }));
const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const LANES = [
  { type: "crawl", label: "کرال", color: "var(--crawl)" },
  { type: "reference", label: "ساخت با AI", color: "var(--ai)" },
  { type: "publish", label: "انتشار", color: "var(--success)" },
  { type: "connect", label: "اتصال/سلامت", color: "var(--primary)" },
];

function useCalendar(sid: number, start: Date, end: Date) {
  return useQuery({
    queryKey: ["calendar", sid, iso(start), iso(end)],
    queryFn: () => api(`/stores/${sid}/calendar?start=${iso(start)}&end=${iso(end)}`),
  });
}

function heat(n: number) {
  return n <= 0 ? 0 : n < 3 ? 1 : n < 8 ? 2 : n < 20 ? 3 : n < 50 ? 4 : 5;
}

function DayTimeline({ sid, day }: { sid: number; day: Date }) {
  const { data } = useQuery({ queryKey: ["calendar", sid, "day", iso(day)], queryFn: () => api(`/stores/${sid}/calendar/day/${iso(day)}`) });
  const ops = data?.operations ?? [];
  const pos = (d: string) => { const t = new Date(d.endsWith("Z") ? d : d + "Z"); return ((t.getHours() * 60 + t.getMinutes()) / 1440) * 100; };
  return (
    <Card className="p-5 overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="flex text-[11px] text-muted ps-28 mb-2" dir="ltr">
          {Array.from({ length: 13 }, (_, i) => <span key={i} className="flex-1 text-left tnum">{faDigits(String(i * 2).padStart(2, "0"))}:۰۰</span>)}
        </div>
        {LANES.map((lane) => {
          const items = ops.filter((o: any) => (lane.type === "connect" ? ["connect", "health_check"].includes(o.type) : o.type === lane.type));
          return (
            <div key={lane.type} className="flex items-center h-12 border-t border-edge">
              <span className="w-28 text-[13px] font-semibold shrink-0">{lane.label}</span>
              <div className="relative flex-1 h-full" dir="ltr">
                {items.map((o: any) => (
                  <Link key={o.id} href={`/app/s/${sid}/activity/${o.id}`} title={`${o.title_fa} (${jfa(new Date(o.created_at + "Z"), "HH:mm")})`}
                    className="absolute top-2.5 h-7 min-w-2.5 rounded-md ring-2 ring-[var(--glass-strong)] hover:scale-110 transition"
                    style={{ left: `${pos(o.created_at)}%`, background: o.status === "failed" ? "var(--danger)" : o.status === "partial" ? "var(--warning)" : lane.color }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {ops.length === 0 && <p className="text-muted text-[14px] mt-3">در این روز فعالیتی ثبت نشده.</p>}
    </Card>
  );
}

export default function CalendarPage() {
  const sid = useStoreId();
  const [view, setView] = useState<"month" | "year" | "day">("month");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);
  const [filter, setFilter] = useState("all");

  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 6 });
  const cells = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart.getTime()]); // eslint-disable-line
  const range = view === "year" ? [startOfYear(cursor), endOfYear(cursor)] : [cells[0], cells[41]];
  const { data } = useCalendar(sid, range[0], range[1]);
  const today = new Date();

  const stats = (d: Date) => data?.days?.[iso(d)] ?? {};
  const flags = (d: Date): string[] => data?.flags?.[iso(d)] ?? [];
  const monthTotals = useMemo(() => {
    const t = { crawl_item: 0, product_created: 0, publish_ok: 0, publish_failed: 0 };
    cells.filter((d) => isSameMonth(d, cursor)).forEach((d) => { const s = stats(d); for (const k in t) (t as any)[k] += s[k] ?? 0; });
    return t;
  }, [data, cells]); // eslint-disable-line

  const shift = (n: number) => setCursor(view === "year" ? addMonths(cursor, 12 * n) : view === "day" ? addDays(cursor, n) : addMonths(cursor, n));
  const title = view === "year" ? jfa(cursor, "yyyy") : view === "day" ? jfa(cursor, "EEEE d MMMM yyyy") : jfa(cursor, "MMMM yyyy");

  return (
    <>
      <PageHeader title="تقویم" subtitle="هر روز چقدر کرال شد، چه دیتایی آمد، چه منتشر شد و کجا خطا بود." />
      <Card className="p-3 mb-4 flex flex-wrap items-center gap-2">
        <Tabs value={view} onChange={setView} items={[{ value: "month", label: "ماه" }, { value: "year", label: "سال" }, { value: "day", label: "روز" }]} />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => shift(-1)} aria-label="قبلی"><ChevronRight className="size-4" /></Button>
          <span className="font-bold text-[15px] min-w-36 text-center">{title}</span>
          <Button variant="ghost" size="sm" onClick={() => shift(1)} aria-label="بعدی"><ChevronLeft className="size-4" /></Button>
          <Button variant="secondary" size="sm" onClick={() => setCursor(new Date())}>امروز</Button>
        </div>
        <div className="flex-1" />
        {view === "month" && (
          <Select className="w-auto" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="نوع رویداد">
            <option value="all">همهٔ رویدادها</option><option value="crawl">فقط کرال و دیتا</option><option value="publish">فقط انتشار</option><option value="errors">فقط خطاها</option>
          </Select>
        )}
      </Card>

      {view === "month" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[["دیتای کرال‌شده", monthTotals.crawl_item, "crawl"], ["محصول جدید", monthTotals.product_created, "ai"],
              ["انتشار موفق", monthTotals.publish_ok, "success"], ["انتشار ناموفق", monthTotals.publish_failed, "danger"]].map(([l, v, t]) => (
              <Card key={l as string} className="p-4"><div className="text-[12px] text-muted">{l} این ماه</div>
                <div className={cn("text-[22px] font-black tnum", t === "danger" && (v as number) > 0 && "text-danger")}>{faNum(v as number)}</div></Card>
            ))}
          </div>
          <Card strong className="p-2 sm:p-3">
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">{WEEKDAYS.map((w) => <div key={w} className="text-center text-[12px] font-bold text-muted py-1">{w}</div>)}</div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {cells.map((d) => {
                const s = stats(d), f = flags(d), inMonth = isSameMonth(d, cursor), isToday = isSameDay(d, today);
                const future = d > today;
                const show = (k: string) => filter === "all" || (filter === "crawl" && k === "crawl") || (filter === "publish" && k === "publish") || (filter === "errors" && k === "err");
                return (
                  <button key={iso(d)} onClick={() => setSelected(d)}
                    className={cn("min-w-0 overflow-hidden text-start rounded-xl sm:rounded-2xl p-1.5 sm:p-2 min-h-[58px] md:min-h-[112px] transition cursor-pointer border border-transparent hover:border-primary/40 flex flex-col gap-1",
                      inMonth ? "bg-subtle/70" : "opacity-40", isToday && "ring-2 ring-primary")}
                    aria-label={`${jfa(d, "d MMMM")}: ${faNum(s.crawl_item ?? 0)} دیتا، ${faNum(s.publish_ok ?? 0)} انتشار`}>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-[13px] font-bold tnum", isToday && "text-primary")}>{jfa(d, "d")}</span>
                      {f.includes("no_crawl") && show("err") && <CircleOff className="size-3.5 text-warning" aria-label="کرال انجام نشد" />}
                      {f.includes("errors") && show("err") && <AlertTriangle className="size-3.5 text-danger" aria-label="خطا" />}
                    </div>
                    <div className="md:hidden flex flex-wrap gap-0.5 mt-auto" aria-hidden>
                      {show("crawl") && s.crawl_item ? <span className="size-1.5 rounded-full bg-crawl" /> : null}
                      {show("publish") && s.publish_ok ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                      {s.publish_failed && (show("publish") || show("err")) ? <span className="size-1.5 rounded-full bg-danger" /> : null}
                    </div>
                    <div className="hidden md:flex flex-col gap-1">
                    {show("crawl") && (s.crawl_run || s.crawl_item) ? (
                      <span className="text-[11px] rounded-md px-1.5 py-0.5 bg-crawl/12 text-crawl tnum truncate">{faNum(s.crawl_item ?? 0)} دیتا{f.includes("no_data") ? " (خالی)" : ""}</span>
                    ) : null}
                    {show("crawl") && s.product_created ? <span className="text-[11px] rounded-md px-1.5 py-0.5 bg-subtle text-fg tnum truncate">{faNum(s.product_created)} محصول</span> : null}
                    {show("publish") && s.publish_ok ? <span className="text-[11px] rounded-md px-1.5 py-0.5 bg-primary/12 text-primary tnum truncate">{faNum(s.publish_ok)} انتشار</span> : null}
                    {(show("publish") || show("err")) && s.publish_failed ? <span className="text-[11px] rounded-md px-1.5 py-0.5 bg-danger/12 text-danger tnum truncate">{faNum(s.publish_failed)} ناموفق</span> : null}
                    </div>
                    {future && isSameDay(d, addDays(today, 1)) && data?.upcoming?.length ? <span className="text-[10px] text-muted hidden md:flex items-center gap-0.5 mt-auto"><Clock className="size-3" />{faNum(data.upcoming.length)} برنامه</span> : null}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 text-[12px] text-muted mt-3 px-1">
              <span className="flex items-center gap-1"><span className="size-2.5 rounded bg-crawl" />دیتای کرال</span>
              <span className="hidden md:flex items-center gap-1"><span className="size-2.5 rounded bg-neutral/40" />محصول جدید</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded bg-primary" />انتشار موفق</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded bg-danger" />ناموفق</span>
              <span className="flex items-center gap-1"><CircleOff className="size-3 text-warning" />کرال زمان‌بندی‌شده اجرا نشد</span>
            </div>
          </Card>
        </>
      )}

      {view === "year" && (
        <Card strong className="p-5 overflow-x-auto">
          <div className="text-[13px] text-muted mb-3">شدت رنگ = تعداد آیتم‌های دیتای کرال‌شده در هر روز. میانگین ۷ روز اخیر: <b className="tnum">{faNum(data?.avg_items_7d ?? 0)}</b></div>
          <div className="flex gap-4 flex-wrap">
            {Array.from({ length: 12 }, (_, m) => {
              const ms = addMonths(startOfYear(cursor), m);
              const start = startOfWeek(ms, { weekStartsOn: 6 });
              const days = Array.from({ length: 42 }, (_, i) => addDays(start, i)).filter((d) => d <= endOfMonth(ms) || isSameMonth(d, ms));
              return (
                <div key={m}>
                  <div className="text-[12px] font-bold mb-1">{jfa(ms, "MMMM")}</div>
                  <div className="grid grid-cols-7 gap-[3px]">
                    {days.map((d) => {
                      const n = stats(d).crawl_item ?? 0;
                      return <button key={iso(d)} onClick={() => setSelected(d)} title={`${jfa(d, "d MMMM")}: ${faNum(n)} دیتا`}
                        className={cn("size-3.5 rounded-[4px] cursor-pointer", !isSameMonth(d, ms) && "invisible")} style={{ background: `var(--heat-${heat(n)})` }} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted mt-4">
            کم {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="size-3 rounded-[3px]" style={{ background: `var(--heat-${i})` }} />)} زیاد
            <span className="ms-3">(۰، ۱–۲، ۳–۷، ۸–۱۹، ۲۰–۴۹، ۵۰+ آیتم)</span>
          </div>
        </Card>
      )}

      {view === "day" && <DayTimeline sid={sid} day={cursor} />}

      {data?.upcoming?.length > 0 && view !== "year" && (
        <Card className="p-5 mt-4">
          <div className="font-bold text-[14px] mb-2 flex items-center gap-2"><Clock className="size-4" />برنامه‌های آینده</div>
          <div className="flex flex-wrap gap-2">
            {data.upcoming.map((u: any, i: number) => <Chip key={i} className="whitespace-normal! max-w-full" tone={u.type === "crawl" ? "crawl" : "success"}>{u.title_fa}{u.hour != null && ` · ساعت ${faDigits(u.hour)}`}</Chip>)}
          </div>
        </Card>
      )}

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected ? jfa(selected, "EEEE d MMMM yyyy") : ""}>
        {selected && <DayDetail sid={sid} day={selected} onTimeline={() => { setCursor(selected); setView("day"); setSelected(null); }} />}
      </Sheet>
    </>
  );
}

function DayDetail({ sid, day, onTimeline }: { sid: number; day: Date; onTimeline: () => void }) {
  const { data } = useQuery({ queryKey: ["calendar", sid, "day", iso(day)], queryFn: () => api(`/stores/${sid}/calendar/day/${iso(day)}`) });
  if (!data) return null;
  const s = data.stats;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[["اجرای کرال", s.crawl_run], ["دیتای ورودی", s.crawl_item], ["محصول جدید", s.product_created], ["انتشار موفق", s.publish_ok], ["انتشار ناموفق", s.publish_failed], ["کرال ناموفق", s.crawl_failed]]
          .map(([l, v]) => <div key={l} className="rounded-xl bg-subtle p-3"><div className="text-[12px] text-muted">{l}</div><div className="text-[18px] font-black tnum">{faNum(v ?? 0)}</div></div>)}
      </div>
      <Button variant="secondary" size="sm" className="w-full" onClick={onTimeline}>نمایش تایم‌لاین ساعتی این روز</Button>
      <div>
        <div className="font-bold text-[14px] mb-2">عملیات‌های این روز</div>
        {data.operations.length === 0 ? <p className="text-muted text-[13px]">چیزی ثبت نشده.</p> : (
          <ul className="space-y-1">
            {data.operations.map((o: any) => (
              <li key={o.id}>
                <Link href={`/app/s/${sid}/activity/${o.id}`} className="flex items-center gap-2 p-2 rounded-xl hover:bg-subtle text-[13px]">
                  <span className="tnum text-muted w-11">{faDigits(jf(new Date(o.created_at + "Z"), "HH:mm"))}</span>
                  <span className="flex-1 truncate">{o.title_fa}</span>
                  <StatusChip status={o.status} kind="op" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-muted mt-2">انواع: {Object.values(OP_TYPES).join("، ")}</p>
      </div>
    </div>
  );
}
