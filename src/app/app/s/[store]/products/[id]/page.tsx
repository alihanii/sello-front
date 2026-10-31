"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useStoreId } from "@/lib/hooks";
import { ProductDetails } from "@/components/products/ProductDetails";
import { Skeleton } from "@/components/ui/primitives";

export default function EditProduct() {
  const sid = useStoreId();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: p } = useQuery({ queryKey: ["product", id], queryFn: () => api(`/products/${id}`) });
  const save = useMutation({
    // Saving here also confirms an AI draft as a ready product.
    mutationFn: (d: any) => api(`/products/${id}`, { method: "PATCH", json: { ...d, status: "ready" } }),
    onSuccess: (r) => { qc.setQueryData(["product", id], r); toast.success("ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!p) return <Skeleton className="h-[600px] max-w-2xl" />;
  return (
    <>
      <Link href={`/app/s/${sid}/products`} className="text-muted text-[13px] inline-flex items-center gap-1 hover:text-fg mb-3"><ArrowRight className="size-4" />محصولات</Link>
      <h1 className="text-[22px] font-extrabold mb-4">ویرایش محصول</h1>
      <ProductDetails key={p.updated_at} storeId={sid} saving={save.isPending} onSave={(d) => save.mutate(d)}
        initial={{ images: p.images.map((i: any) => i.url), title: p.title, sku: p.sku ?? "", price: p.price, stock_qty: p.stock_qty,
                   description: p.description, attributes: p.attributes ?? {} }} />
    </>
  );
}
