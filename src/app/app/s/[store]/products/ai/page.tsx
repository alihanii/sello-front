"use client";

import { useStoreId } from "@/lib/hooks";
import { RedesignPlaceholder } from "@/components/products/RedesignPlaceholder";

export default function Page() {
  return <RedesignPlaceholder storeId={useStoreId()} title="ساخت محصول با AI" />;
}
