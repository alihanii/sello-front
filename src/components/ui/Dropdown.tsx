"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { Check, ChevronDown, Search } from "lucide-react";
import { isValidElement, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fieldCls, widthCls } from "./styles";

export type DropdownOption = { value: string; label: React.ReactNode; disabled?: boolean };

/** Options at or above this count get a search box. */
export const SEARCH_FROM = 8;
const ROW = 40;
const MAX_LIST = 320;

/** Plain text of a label, for search and the native fallback select. */
export function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

// Persian/Arabic letters and digits typed either way should still match.
const fold = (s: string) =>
  s.toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  dir?: string;
  searchable?: boolean;
  "aria-label"?: string;
};

/**
 * The site's dropdown: same field look as inputs, opens a glass list, searchable from 8 options,
 * and the list is virtualized so hundreds of options (e.g. all models of a key) stay smooth.
 */
export function Dropdown({ value, onChange, options, placeholder = "انتخاب کنید", className, disabled, required, name, id,
  dir, searchable, "aria-label": ariaLabel }: Props) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; up: boolean; maxH: number } | null>(null);

  const withSearch = searchable ?? options.length >= SEARCH_FROM;
  const selected = options.find((o) => o.value === value);
  const shown = useMemo(() => {
    const q = fold(query.trim());
    return q ? options.filter((o) => fold(textOf(o.label)).includes(q) || fold(o.value).includes(q)) : options;
  }, [options, query]);

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const vh = window.innerHeight;
    const below = vh - r.bottom - 12;
    const above = r.top - 12;
    const up = below < 220 && above > below;
    const width = Math.min(Math.max(r.width, 220), window.innerWidth - 16);
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    setPos({ top: up ? r.top - 6 : r.bottom + 6, left, width, up, maxH: Math.min(MAX_LIST + (withSearch ? 56 : 0), up ? above : below) });
  }, [withSearch]);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setQuery("");
    if (refocus) triggerRef.current?.focus();
  }, []);

  const openList = () => {
    if (disabled) return;
    place();
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const pick = (o: DropdownOption | undefined) => {
    if (!o || o.disabled) return;
    if (o.value !== value) onChange(o.value);
    close();
  };

  useLayoutEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !triggerRef.current?.contains(t)) close(false);
    };
    const onMove = () => place();
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, place, close]);

  useEffect(() => {
    if (open && withSearch) searchRef.current?.focus({ preventScroll: true });
    else if (open) listRef.current?.focus({ preventScroll: true });
  }, [open, withSearch]);

  useEffect(() => { setActive(shown.length ? 0 : -1); }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const virt = useVirtualizer({ count: shown.length, getScrollElement: () => listRef.current, estimateSize: () => ROW, overscan: 8 });

  useEffect(() => {
    if (open && active >= 0) virt.scrollToIndex(active, { align: "auto" });
  }, [open, active]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (step: number) => {
    if (!shown.length) return;
    let i = active;
    for (let n = 0; n < shown.length; n++) {
      i = (i + step + shown.length) % shown.length;
      if (!shown[i].disabled) break;
    }
    setActive(i);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) { e.preventDefault(); openList(); }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(shown.length - 1); }
    else if (e.key === "Enter") { e.preventDefault(); pick(shown[active]); }
    else if (e.key === "Tab") close(false);
  };

  const listH = Math.min(shown.length * ROW, MAX_LIST, Math.max(ROW, (pos?.maxH ?? MAX_LIST) - (withSearch ? 56 : 0)));

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        dir={dir}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKey}
        className={clsx(fieldCls, widthCls(className), "h-11 cursor-pointer pe-3 inline-flex items-center gap-2 text-start disabled:opacity-60 disabled:cursor-not-allowed",
          open && "bg-glass-strong border-primary ring-4 ring-primary/15", className)}
      >
        <span className={clsx("flex-1 min-w-0 truncate", !selected && "text-muted/80")}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={clsx("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {(required || name) && (
        // Keeps native form behaviour (required, name) for the custom control.
        <select aria-hidden tabIndex={-1} className="sr-only" name={name} required={required} value={value}
          onChange={() => {}} onFocus={() => triggerRef.current?.focus()}>
          <option value="" />
          {options.map((o) => <option key={o.value} value={o.value}>{textOf(o.label)}</option>)}
        </select>
      )}
      {open && pos && createPortal(
        <div
          ref={popRef}
          onKeyDown={onKey}
          dir={dir}
          className="glass-strong fixed z-[70] rounded-2xl p-1.5 shadow-[var(--shadow)] fade-in"
          style={{ left: pos.left, width: pos.width, ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }) }}
        >
          {withSearch && (
            <div className="relative mb-1.5">
              <Search className="size-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted pointer-events-none" aria-hidden />
              <input ref={searchRef} dir="auto" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجو…"
                aria-label="جستجو در گزینه‌ها" aria-controls={listId}
                className="w-full h-10 rounded-xl bg-subtle border border-transparent ps-9 pe-3 text-[14px] outline-none focus:border-primary" />
            </div>
          )}
          <div ref={listRef} id={listId} role="listbox" tabIndex={-1} className="overflow-y-auto outline-none overscroll-contain" style={{ height: shown.length ? listH : undefined }}>
            {shown.length === 0 ? (
              <div className="px-3 py-3 text-[13px] text-muted text-center">چیزی پیدا نشد</div>
            ) : (
              <div className="relative w-full" style={{ height: virt.getTotalSize() }}>
                {virt.getVirtualItems().map((row) => {
                  const o = shown[row.index];
                  const isSel = o.value === value;
                  return (
                    <div
                      key={o.value + row.index}
                      role="option"
                      aria-selected={isSel}
                      aria-disabled={o.disabled}
                      title={textOf(o.label)}
                      onPointerEnter={() => !o.disabled && setActive(row.index)}
                      onClick={() => pick(o)}
                      className={clsx("absolute inset-x-0 flex items-center gap-2 rounded-xl px-3 text-[14px] sm:text-[13px]",
                        o.disabled ? "text-muted/60 cursor-not-allowed" : "cursor-pointer",
                        row.index === active && !o.disabled && "bg-subtle", isSel && "font-semibold text-primary")}
                      style={{ top: row.start, height: ROW }}
                    >
                      <span className="flex-1 min-w-0 truncate">{o.label}</span>
                      {isSel && <Check className="size-4 shrink-0" aria-hidden />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
