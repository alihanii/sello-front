"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Store } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { jDate } from "@/lib/format";
import { useStores } from "@/lib/hooks";
import { Logo } from "@/components/shell/AppShell";
import { Button, Card, Dialog, Field, Input, PageHeader } from "@/components/ui/primitives";

export default function Stores() {
  const { data: stores } = useStores();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const create = useMutation({
    mutationFn: () => api("/stores", { method: "POST", json: { name, category } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stores"] }); setOpen(false); setName(""); toast.success("فروشگاه ساخته شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Logo className="mb-8" />
      <PageHeader title="فروشگاه‌های من" subtitle="هر فروشگاه کانال‌ها و محصولات خودش را دارد."
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>فروشگاه جدید</Button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stores?.map((s) => (
          <Link key={s.id} href={`/app/s/${s.id}`}>
            <Card className="p-5 flex items-center gap-4 hover:-translate-y-0.5 transition">
              <span className="size-12 rounded-xl bg-primary/12 text-primary grid place-items-center"><Store className="size-5" /></span>
              <div>
                <div className="font-bold">{s.name}</div>
                <div className="text-muted text-[13px]">{s.category || "بدون دسته"} · ساخته‌شده {jDate(s.created_at)}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title="ساخت فروشگاه">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Field label="نام فروشگاه"><Input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
          <Field label="دسته (اختیاری)"><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="مثلاً پوشاک زنانه" /></Field>
          <Button type="submit" className="w-full" loading={create.isPending} disabled={!name.trim()}>ساخت</Button>
        </form>
      </Dialog>
    </div>
  );
}
