import { format as jFormat, formatDistanceToNowStrict } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";

const FA = "۰۱۲۳۴۵۶۷۸۹";
export const faDigits = (v: string | number) => String(v).replace(/\d/g, (d) => FA[+d]);
export const faNum = (n: number | null | undefined) =>
  n == null ? "—" : faDigits(new Intl.NumberFormat("en-US").format(n)).replace(/,/g, "٬");
export const toman = (n: number | null | undefined) => (n ? `${faNum(n)} تومان` : "—");

/** A server time as a Date. Times with no zone are UTC; "…Z", "+03:30" and "-05:00" are kept as sent. */
export const asDate = (d: string | Date) => (typeof d === "string" ? new Date(/(Z|[+-]\d\d:?\d\d)$/i.test(d) ? d : d + "Z") : d);
const valid = (d?: string | Date | null): d is string | Date => !!d && !Number.isNaN(asDate(d).getTime());

export const jDate = (d?: string | Date | null, f = "d MMMM yyyy") => (valid(d) ? faDigits(jFormat(asDate(d), f, { locale: faIR })) : "—");
/** «۱۴:۰۵» for a server time; "—" when it is missing or unreadable (never throws). */
export const jTime = (d?: string | Date | null) => jDate(d, "HH:mm");
export const jDateTime = (d?: string | Date | null) => jDate(d, "d MMMM، HH:mm");
export const ago = (d?: string | Date | null) =>
  valid(d) ? faDigits(formatDistanceToNowStrict(asDate(d), { locale: faIR, addSuffix: true })) : "—";
export const ms = (v: number) => (v < 1000 ? `${faNum(v)} میلی‌ثانیه` : `${faDigits((v / 1000).toFixed(1))} ثانیه`);
