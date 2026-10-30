"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { faDigits, jDateTime } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui/primitives";

export default function Audit() {
  const { data = [] } = useQuery({ queryKey: ["admin-audit"], queryFn: () => api<any[]>("/admin/audit") });
  return (
    <>
      <PageHeader title="لاگ عملیات ادمین" />
      <Card strong>
        <ul className="divide-y divide-[var(--glass-edge)]">
          {data.map((a) => (
            <li key={a.id} className="p-4 text-[14px] flex flex-wrap gap-3">
              <span className="text-muted w-40">{jDateTime(a.created_at)}</span>
              <span className="font-semibold" dir="ltr">{a.action}</span>
              <span className="text-muted">{a.target_type} #{faDigits(a.target_id ?? "-")}</span>
              <span className="text-muted tnum">{faDigits(a.admin)}</span>
            </li>
          ))}
          {data.length === 0 && <li className="p-5 text-muted">هنوز عملیاتی ثبت نشده.</li>}
        </ul>
      </Card>
    </>
  );
}
