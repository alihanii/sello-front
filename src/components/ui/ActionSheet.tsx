"use client";

import { forwardRef, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import cn from "clsx";

const PHONE = "(max-width: 639px)";

/** True below the `sm` breakpoint, where small popovers become bottom sheets instead. */
export function useIsPhone() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(PHONE);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  dir?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
};

/**
 * The phone version of a dropdown or menu: a solid panel that slides up from the bottom edge over a dimmed page.
 * It spans the screen width, stays clear of the bottom nav and the home indicator, and never runs off screen the way
 * a list hanging under its button does. Rendered into <body>, so no parent's blur, transform or overflow affects it.
 */
export const ActionSheet = forwardRef<HTMLDivElement, Props>(function ActionSheet({ open, onClose, title, children, className, dir, onKeyDown }, ref) {
  // How much of the screen's bottom the on-screen keyboard covers, so a search box in the sheet stays above it.
  const [kb, setKb] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!open || !vv) return;
    const fit = () => setKb(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    fit();
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
    return () => { vv.removeEventListener("resize", fit); vv.removeEventListener("scroll", fit); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[70]" dir={dir}>
      <div className="absolute inset-0 bg-black/30 fade-in" onClick={onClose} aria-hidden />
      <div ref={ref} role="dialog" aria-modal aria-label={typeof title === "string" ? title : undefined} onKeyDown={onKeyDown}
        style={kb ? { bottom: kb, maxHeight: `calc(100dvh - ${kb}px - 16px)` } : undefined}
        className={cn("sheet-up absolute inset-x-0 bottom-0 max-h-[80dvh] flex flex-col rounded-t-sheet border border-b-0 border-[var(--glass-border)] [background:linear-gradient(var(--glass-strong),var(--glass-strong)),var(--bg)] shadow-[var(--shadow)] px-3 pt-2 pb-safe", className)}>
        <span className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-muted/30" aria-hidden />
        {title && <div className="px-2 pb-2 text-[15px] font-bold shrink-0">{title}</div>}
        {children}
      </div>
    </div>,
    document.body,
  );
});
