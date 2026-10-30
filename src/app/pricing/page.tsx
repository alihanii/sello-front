"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";
import { Logo, ThemeToggle } from "@/components/shell/AppShell";
import { PlanCards } from "@/components/plans/PlanCards";
import { Button, Skeleton } from "@/components/ui/primitives";

export default function Pricing() {
  const router = useRouter();
  const { data: plans } = useQuery({ queryKey: ["plans"], queryFn: () => api<any[]>("/plans") });
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="glass rounded-full h-14 px-3 sm:px-4 flex items-center justify-between mb-10 sm:mb-14">
        <Link href="/"><Logo /></Link>
        <div className="flex items-center gap-2"><ThemeToggle /><Link href="/login"><Button size="sm">ورود</Button></Link></div>
      </header>
      <div className="text-center mb-10">
        <h1 className="text-[26px] sm:text-[36px] font-black tracking-tight">یک پلن، همهٔ امکانات</h1>
        <p className="text-muted mt-2">فقط مدت اشتراک را انتخاب کن؛ هرچه طولانی‌تر، ارزان‌تر.</p>
      </div>
      {plans ? <PlanCards plans={plans} onSelect={() => router.push(getToken() ? "/app/billing" : "/login")} /> : <Skeleton className="h-96" />}
    </div>
  );
}
