/** Iranian mobile numbers: 09 + 9 digits (11 digits in all). Persian and Arabic digits are accepted and become Latin. */

const FA = "۰۱۲۳۴۵۶۷۸۹";
const AR = "٠١٢٣٤٥٦٧٨٩";

export function latinDigits(v: string): string {
  return (v ?? "").replace(/[۰-۹]/g, (d) => String(FA.indexOf(d))).replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
}

export const PHONE_LENGTH = 11;

/** What the phone box keeps while typing: Latin digits only, at most 11 (spaces, dashes and +98 pastes are tidied). */
export function cleanPhone(v: string): string {
  let d = latinDigits(v).replace(/\D/g, "");
  if (d.startsWith("0098")) d = "0" + d.slice(4);
  else if (d.startsWith("98") && d.length > 10) d = "0" + d.slice(2);
  return d.slice(0, PHONE_LENGTH);
}

export const isMobile = (v: string) => /^09\d{9}$/.test(cleanPhone(v));

/** Why a number is not a valid mobile number (Persian), or null when it is. An empty value is a problem only if `required`. */
export function mobileProblem(v: string, required = true): string | null {
  const d = cleanPhone(v);
  if (!d) return required ? "شمارهٔ موبایل را وارد کن." : null;
  if (!d.startsWith("09")) return "شمارهٔ موبایل باید با ۰۹ شروع شود.";
  if (d.length < PHONE_LENGTH) return `شمارهٔ موبایل باید ۱۱ رقم باشد؛ ${(PHONE_LENGTH - d.length).toLocaleString("fa-IR")} رقم دیگر مانده.`;
  return null;
}

/** The message to show under the box while typing: a wrong start shows at once; a too-short number only after the box was left. */
export function shownProblem(v: string, touched: boolean, required = true): string | undefined {
  const d = cleanPhone(v);
  const wrongStart = (d.length === 1 && d !== "0") || (d.length >= 2 && !d.startsWith("09"));
  if (!touched && !wrongStart) return undefined;
  return mobileProblem(v, required) ?? undefined;
}
