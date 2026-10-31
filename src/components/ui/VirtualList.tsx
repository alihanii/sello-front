"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { cloneElement, useRef } from "react";

/** Below this many items lists render normally; virtualizing a short list only adds cost. */
export const VIRTUAL_FROM = 40;

/**
 * A long list that renders only the rows on screen. It scrolls inside its own box (maxHeight) and
 * measures each row, so rows can have any height.
 */
export function VirtualList<T>({ items, render, getKey, estimate = 56, maxHeight = 560, className, gap = 4 }: {
  items: T[];
  render: (item: T, index: number) => React.ReactNode;
  getKey: (item: T, index: number) => React.Key;
  estimate?: number;
  maxHeight?: number;
  className?: string;
  gap?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const virt = useVirtualizer({ count: items.length, getScrollElement: () => ref.current, estimateSize: () => estimate, overscan: 6, gap });
  if (items.length < VIRTUAL_FROM) {
    return <div className={clsx("flex flex-col", className)} style={{ gap }}>{items.map((it, i) => <div key={getKey(it, i)}>{render(it, i)}</div>)}</div>;
  }
  return (
    <div ref={ref} className={clsx("overflow-y-auto overscroll-contain", className)} style={{ maxHeight }}>
      <div className="relative w-full" style={{ height: virt.getTotalSize() }}>
        {virt.getVirtualItems().map((row) => (
          <div key={getKey(items[row.index], row.index)} data-index={row.index} ref={virt.measureElement}
            className="absolute inset-x-0" style={{ transform: `translateY(${row.start}px)` }}>
            {render(items[row.index], row.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Table rows rendered only when on screen. Put it in place of <tbody>; `scrollRef` is the element that
 * scrolls the table (give it a max height). Spacer rows keep the scrollbar honest.
 */
export function VirtualTbody<T>({ items, render, scrollRef, colSpan, estimate = 60 }: {
  items: T[];
  render: (item: T, index: number) => React.ReactElement;
  scrollRef: React.RefObject<HTMLElement | null>;
  colSpan: number;
  estimate?: number;
}) {
  const virt = useVirtualizer({ count: items.length, getScrollElement: () => scrollRef.current, estimateSize: () => estimate, overscan: 8 });
  if (items.length < VIRTUAL_FROM) return <tbody>{items.map(render)}</tbody>;
  const rows = virt.getVirtualItems();
  const top = rows[0]?.start ?? 0;
  const bottom = virt.getTotalSize() - (rows.at(-1)?.end ?? 0);
  return (
    <tbody>
      {top > 0 && <tr aria-hidden><td colSpan={colSpan} style={{ height: top, padding: 0 }} /></tr>}
      {rows.map((row) => cloneElement(render(items[row.index], row.index) as React.ReactElement<any>,
        { ref: virt.measureElement, "data-index": row.index }))}
      {bottom > 0 && <tr aria-hidden><td colSpan={colSpan} style={{ height: bottom, padding: 0 }} /></tr>}
    </tbody>
  );
}
