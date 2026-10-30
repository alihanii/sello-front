import { format as jFormat, formatDistanceToNowStrict } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";

const FA = "۰۱۲۳۴۵۶۷۸۹";
export const faDigits = (v: string | number) => String(v).replace(/\d/g, (d) => FA[+d]);
export const faNum = (n: number | null | undefined) =>
  n == null ? "—" : faDigits(new Intl.NumberFormat("en-US").format(n)).replace(/,/g, "٬");
export const toman = (n: number | null | undefined) => (n ? `${faNum(n)} تومان` : "—");

const asDate = (d: string | Date) => (typeof d === "string" ? new Date(d.endsWith("Z") || d.includes("+") ? d : d + "Z") : d);

export const jDate = (d?: string | Date | null, f = "d MMMM yyyy") => (d ? faDigits(jFormat(asDate(d), f, { locale: faIR })) : "—");
export const jDateTime = (d?: string | Date | null) => jDate(d, "d MMMM، HH:mm");
export const ago = (d?: string | Date | null) =>
  d ? faDigits(formatDistanceToNowStrict(asDate(d), { locale: faIR, addSuffix: true })) : "—";
export const ms = (v: number) => (v < 1000 ? `${faNum(v)} میلی‌ثانیه` : `${faDigits((v / 1000).toFixed(1))} ثانیه`);
