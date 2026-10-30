"use client";

import clsx from "clsx";
import { Loader2, X } from "lucide-react";
import { forwardRef, useEffect } from "react";

export const cn = clsx;

const TONES: Record<string, string> = {
  neutral: "bg-subtle text-muted",
  primary: "bg-primary/12 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/14 text-warning",
  danger: "bg-danger/12 text-danger",
  ai: "bg-ai/12 text-ai",
  crawl: "bg-crawl/12 text-crawl",
};

export function Card({ className, strong, ...p }: React.HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return <div className={cn(strong ? "glass-strong" : "glass", "rounded-[24px]", className)} {...p} />;
}

export function CardHeader({ title, action, subtitle }: { title: React.ReactNode; action?: React.ReactNode; subtitle?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
      <div className="min-w-0">
        <h3 className="text-[15px] font-extrabold tracking-tight">{title}</h3>
        {subtitle && <p className="text-[13px] text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "ai";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "primary", size = "md", loading, icon, className, children, disabled, ...p }, ref,
) {
  const v = {
    primary: "bg-primary text-primary-fg shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_6px_18px_-8px_color-mix(in_oklab,var(--primary)_70%,transparent)] hover:bg-primary-hover",
    secondary: "glass text-fg hover:bg-glass-strong",
    ghost: "text-fg hover:bg-subtle",
    danger: "bg-danger/12 text-danger hover:bg-danger/20",
    ai: "glass text-fg hover:bg-glass-strong [&>svg]:text-primary",
  }[variant];
  const s = { sm: "h-9 min-w-9 px-3 text-[13px] gap-1.5", md: "h-11 px-5 text-[14px] gap-2", lg: "h-12 px-7 text-[15px] gap-2" }[size];
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold cursor-pointer transition-all duration-200 select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98] whitespace-nowrap",
        v, s, className,
      )}
      {...p}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export function Chip({ tone = "neutral", className, children, icon }: { tone?: string; className?: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap", TONES[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function Field({ label, hint, error, children, className }: { label?: React.ReactNode; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="block text-[13px] font-semibold mb-1.5">{label}</span>}
      {children}
      {error ? <span className="block text-[12px] text-danger mt-1">{error}</span> : hint && <span className="block text-[12px] text-muted mt-1">{hint}</span>}
    </label>
  );
}

// Callers that pass their own width (w-auto, w-40…) opt out of the full-width default.
const widthCls = (className?: string) => (/(^|\s)w-/.test(className ?? "") ? "" : "w-full");
const inputCls =
  "rounded-2xl bg-glass border border-[var(--glass-border)] backdrop-blur-md px-4 text-[15px] sm:text-[14px] outline-none transition focus:bg-glass-strong focus:border-primary focus:ring-4 focus:ring-primary/15 placeholder:text-muted/80";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(inputCls, widthCls(className), "h-11", className)} {...p} />;
});

const toLatin = (v: string) => v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
const toFa = (v: string) => v.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

/** Whole-number input shown in Persian digits with thousands separators; accepts Persian or Latin typing. */
export function NumberInput({ value, onChange, grouping = true, className, ...p }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & { value: number | null | undefined; onChange: (v: number) => void; grouping?: boolean }) {
  const shown = value || value === 0 && !grouping ? toFa(grouping ? value.toLocaleString("en").replace(/,/g, "٬") : String(value)) : "";
  return (
    <Input {...p} dir="ltr" inputMode="numeric" className={cn("text-left tnum", className)} value={shown}
      onChange={(e) => onChange(Number(toLatin(e.target.value).replace(/\D/g, "")) || 0)} />
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(inputCls, widthCls(className), "py-2.5 min-h-24 leading-7", className)} {...p} />;
});

export function Select({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputCls, widthCls(className), "h-11 cursor-pointer pe-8", className)} {...p}>
      {children}
    </select>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 rounded-full transition-colors cursor-pointer shrink-0", checked ? "bg-primary" : "bg-subtle border border-edge")}
    >
      <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition-all", checked ? "start-[22px]" : "start-0.5")} />
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-xl bg-subtle shimmer", className)} />;
}

export function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      <div className="size-16 rounded-[22px] glass grid place-items-center text-primary mb-4">{icon}</div>
      <h3 className="font-bold text-[16px]">{title}</h3>
      {text && <p className="text-muted text-[14px] mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 sm:mb-7">
      <div className="min-w-0">
        <h1 className="text-[22px] sm:text-[30px] font-black tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-muted text-[14px] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
    </div>
  );
}

export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal aria-label={title}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm fade-in" onClick={onClose} />
      <Card strong className={cn("sheet-up relative w-full max-h-[92dvh] overflow-auto p-5 sm:p-6 rounded-b-none sm:rounded-b-[24px] pb-safe", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="sm:hidden mx-auto -mt-2 mb-3 h-1.5 w-10 rounded-full bg-subtle" aria-hidden />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="بستن"><X className="size-4" /></Button>
        </div>
        {children}
      </Card>
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal aria-label={title}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] fade-in" onClick={onClose} />
      <div className="sheet-up glass-strong absolute inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[24px] sm:inset-x-auto sm:inset-y-3 sm:end-3 sm:max-h-none sm:w-[440px] sm:rounded-[24px] p-5 overflow-auto pb-safe">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="بستن"><X className="size-4" /></Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: React.ReactNode }[] }) {
  return (
    <div className="glass inline-flex max-w-full overflow-x-auto no-scrollbar rounded-full p-1 gap-1" role="tablist">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={cn(
            "h-9 px-4 rounded-full text-[13px] font-bold cursor-pointer transition-all whitespace-nowrap shrink-0",
            value === it.value ? "bg-raised text-fg shadow-[0_1px_3px_rgba(15,23,42,.14)]" : "text-muted hover:text-fg",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/** Wide tables scroll inside their card on small screens instead of pushing the page sideways. */
export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("overflow-x-auto no-scrollbar", className)}>{children}</div>;
}
