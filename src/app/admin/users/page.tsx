"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { ago, faDigits, faNum, jDate } from "@/lib/format";
import { Card, Chip, Input, PageHeader, Skeleton } from "@/components/ui/primitives";
import { VirtualTbody } from "@/components/ui/VirtualList";

export default function Users() {
  const [q, setQ] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const { data } = useQuery({ queryKey: ["admin-users", q], queryFn: () => api<any[]>(`/admin/users?q=${encodeURIComponent(q)}`) });
  return (
    <>
      <PageHeader title="کاربران" subtitle={data && `${faNum(data.length)} کاربر`} />
      <div className="relative mb-4 max-w-md"><Search className="size-4 absolute top-3.5 start-3 text-muted" /><Input className="ps-9" placeholder="جستجوی موبایل یا نام" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <Card strong ref={scroller} className="overflow-auto max-h-[calc(100dvh-220px)]">
        {!data ? <Skeleton className="h-80 m-4" /> : (
          <table className="w-full text-[14px] min-w-[760px]">
            <thead className="text-muted text-[12px]"><tr className="border-b border-edge">
              {["کاربر", "نقش", "فروشگاه‌ها", "پلن", "عضویت", "آخرین ورود", "وضعیت"].map((h) => <th key={h} className="p-3 text-start font-semibold">{h}</th>)}
            </tr></thead>
            <VirtualTbody items={data} scrollRef={scroller} colSpan={7} estimate={66} render={(u) => (
                <tr key={u.id} className="border-b border-edge last:border-0 hover:bg-subtle/60">
                  <td className="p-3"><Link href={`/admin/users/${u.id}`} className="font-semibold hover:text-primary">{u.name || "بدون نام"}<span className="block text-[12px] text-muted tnum">{faDigits(u.phone)}</span></Link></td>
                  <td className="p-3">{u.role === "admin" ? <Chip tone="warning">ادمین</Chip> : <Chip>فروشنده</Chip>}</td>
                  <td className="p-3 tnum">{faNum(u.stores)}</td>
                  <td className="p-3">{u.plan ? <><Chip tone="primary">{u.plan}</Chip><span className="block text-[11px] text-muted">تا {jDate(u.plan_ends_at)}</span></> : <span className="text-muted">رایگان</span>}</td>
                  <td className="p-3 text-muted">{jDate(u.created_at)}</td>
                  <td className="p-3 text-muted">{ago(u.last_login_at)}</td>
                  <td className="p-3">{u.is_active ? <Chip tone="success">فعال</Chip> : <Chip tone="danger">غیرفعال</Chip>}</td>
                </tr>
              )} />
          </table>
        )}
      </Card>
    </>
  );
}
