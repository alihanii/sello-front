// Shared field styling for inputs, textareas and the dropdown trigger.

// Callers that pass their own width (w-auto, w-40…) opt out of the full-width default.
export const widthCls = (className?: string) => (/(^|\s)w-/.test(className ?? "") ? "" : "w-full");
export const fieldCls =
  "rounded-2xl bg-glass border border-[var(--glass-border)] backdrop-blur-md px-4 text-[15px] sm:text-[14px] outline-none transition focus:bg-glass-strong focus:border-primary focus:ring-4 focus:ring-primary/15 placeholder:text-muted/80";
