"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useStoreId } from "@/lib/hooks";
import { ProductForm, emptyDraft } from "@/components/products/ProductForm";
import { PageHeader } from "@/components/ui/primitives";

export default function NewProduct() {
  const sid = useStoreId();
  const router = useRouter();
  const create = useMutation({
    mutationFn: (d: any) => api(`/stores/${sid}/products`, { method: "POST", json: d }),
    onSuccess: (p) => { toast.success("محصول ذخیره شد"); router.push(`/app/s/${sid}/products/${p.id}`); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <>
      <PageHeader title="افزودن محصول" subtitle="محصول با برچسب «دستی» ذخیره می‌شود." />
      <ProductForm storeId={sid} initial={emptyDraft} onSubmit={(d) => create.mutate(d)} submitting={create.isPending} />
    </>
  );
}
