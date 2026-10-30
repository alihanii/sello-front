import Link from "next/link";
import { Wrench } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";

/** Stand-in while product creation/editing is being redesigned. */
export function RedesignPlaceholder({ storeId, title }: { storeId: number; title: string }) {
  return (
    <Card className="p-10 text-center max-w-lg mx-auto mt-10">
      <div className="size-12 rounded-2xl bg-subtle grid place-items-center mx-auto"><Wrench className="size-6 text-muted" /></div>
      <h1 className="text-[18px] font-extrabold mt-4">{title}</h1>
      <p className="text-[14px] text-muted mt-2 leading-7">این بخش در حال طراحی دوباره است تا ساده‌تر شود.</p>
      <Link href={`/app/s/${storeId}/products`}><Button variant="secondary" className="mt-5">بازگشت به محصولات</Button></Link>
    </Card>
  );
}
