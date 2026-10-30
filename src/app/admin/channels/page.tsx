"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { ago } from "@/lib/format";
import { PLATFORMS } from "@/lib/meta";
import { PlatformIcon } from "@/components/ui/status";
import { Card, Chip, PageHeader, Select, Skeleton, Switch } from "@/components/ui/primitives";

const HEALTH: Record<string, [string, string]> = { connected: ["وصل", "success"], error: ["خطا", "danger"], expired: ["منقضی", "danger"] };

export default function AdminChannels() {
  const sp = useSearchParams();
  const [platform, setPlatform] = useState(sp.get("platform") ?? "");
  const [errors, setErrors] = useState(false);
  const { data } = useQuery({ queryKey: ["admin-channels", platform, errors], queryFn: () => api<any[]>(`/admin/channels?platform=${platform}&only_errors=${errors}`) });
  return (
    <>
      <PageHeader title="کانال‌ها" subtitle="همهٔ اتصال‌ها با وضعیت سلامت؛ برای پشتیبانی" />
      <Card className="p-3 mb-4 flex flex-wrap items-center gap-4">
        <Select className="w-auto" value={platform} onChange={(e) => setPlatform(e.target.value)}><option value="">همهٔ پلتفرم‌ها</option>{Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select>
        <label className="flex items-center gap-2 text-[14px]"><Switch checked={errors} onChange={setErrors} />فقط کانال‌های دارای خطا</label>
      </Card>
      <Card strong>
        {!data ? <Skeleton className="h-80 m-4" /> : (
          <ul className="divide-y divide-[var(--glass-edge)]">
            {data.map((c) => (
              <li key={c.id} className="p-4 flex flex-wrap items-center gap-3">
                <PlatformIcon platform={c.platform} size={32} />
                <div className="flex-1 min-w-48"><div className="font-semibold text-[14px]">{c.display_name}</div><div className="text-[12px] text-muted">فروشگاه {c.store.name} · بررسی {ago(c.last_health_at)}</div></div>
                {c.last_error && <span className="text-danger text-[13px] w-full md:w-auto md:max-w-sm">{c.last_error}</span>}
                <Chip tone={HEALTH[c.status]?.[1] ?? "neutral"}>{HEALTH[c.status]?.[0] ?? c.status}</Chip>
              </li>
            ))}
            {data.length === 0 && <li className="p-5 text-muted">کانالی پیدا نشد.</li>}
          </ul>
        )}
      </Card>
    </>
  );
}
