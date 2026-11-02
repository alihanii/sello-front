"use client";

import { useQuery } from "@tanstack/react-query";
import { useId } from "react";
import { storeQueries } from "@/lib/hooks";
import { Input } from "@/components/ui/primitives";

/** Free text, with the shop's existing categories suggested so the same category isn't typed two ways. */
export function CategoryInput({ storeId, value, onChange, className, autoFocus }: {
  storeId: number; value: string; onChange: (v: string) => void; className?: string; autoFocus?: boolean;
}) {
  const { data = [] } = useQuery(storeQueries.categories(storeId));
  const id = useId();
  return (
    <>
      <Input list={id} maxLength={120} placeholder="مثلاً هودی" className={className} autoFocus={autoFocus}
        value={value} onChange={(e) => onChange(e.target.value)} aria-label="دسته‌بندی" />
      <datalist id={id}>{data.map((c) => <option key={c.name} value={c.name} />)}</datalist>
    </>
  );
}
