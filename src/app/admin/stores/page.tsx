"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { ago, faDigits, faNum, toman } from "@/lib/format";
import { PlatformIcon, SourceBadge } from "@/components/ui/status";
import { Card, PageHeader, Sheet, Skeleton } from "@/components/ui/primitives";

export default function AdminStores() {
  const { data } = useQuery({ queryKey: ["admin-stores"], queryFn: () => api<any[]>("/admin/stores") });
  const [focus, setFocus] = useState<any>(null);
  const { data: products } = useQuery({ queryKey: ["admin-store-products", focus?.id], queryFn: () => api<any[]>(`/admin/stores/${focus.id}/products`), enabled: !!focus });
  return (
    <>
      <PageHeader title="فروشگاه‌ها" subtitle={data && `${faNum(data.length)} فروشگاه`} />
      <Card strong className="overflow-x-auto">
        {!data ? <Skeleton className="h-80 m-4" /> : (
          <table className="w-full text-[14px] min-w-[760px]">
            <thead className="text-muted text-[12px]"><tr className="border-b border-edge">
              {["فروشگاه", "مالک", "کانال‌ها", "محصولات", "آخرین فعالیت"].map((h) => <th key={h} className="p-3 text-start font-semibold">{h}</th>)}
            </tr></thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-b border-edge last:border-0 hover:bg-subtle/60 cursor-pointer" onClick={() => setFocus(s)}>
                  <td className="p-3 font-semibold">{s.name}<span className="block text-[12px] text-muted">{s.category}</span></td>
                  <td className="p-3"><Link href={`/admin/users/${s.owner.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary">{s.owner.name || faDigits(s.owner.phone)}</Link></td>
                  <td className="p-3"><div className="flex gap-1">{s.platforms.map((p: string, i: number) => <PlatformIcon key={i} platform={p} size={22} />)}</div></td>
                  <td className="p-3 tnum">{faNum(s.products)}</td>
                  <td className="p-3 text-muted">{ago(s.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Sheet open={!!focus} onClose={() => setFocus(null)} title={focus?.name ?? ""}>
        <div className="text-[13px] text-muted mb-3">محصولاتی که این فروشگاه اضافه کرده</div>
        <ul className="space-y-1">
          {products?.map((p) => (
            <li key={p.id} className="flex items-center gap-2 p-2 rounded-xl bg-subtle text-[13px]">
              <span className="flex-1 truncate">{p.title}</span><span className="tnum text-muted">{toman(p.price)}</span><SourceBadge source={p.source} />
            </li>
          ))}
          {products?.length === 0 && <li className="text-muted text-[13px]">محصولی ندارد.</li>}
        </ul>
      </Sheet>
    </>
  );
}
