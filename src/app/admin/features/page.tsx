"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { faDigits, faNum } from "@/lib/format";
import { Button, Card, CardHeader, Chip, Field, PageHeader, PhoneInput, Tabs } from "@/components/ui/primitives";
import { cleanPhone, mobileProblem, shownProblem } from "@/lib/phone";
import { FormSectionSkeleton } from "@/components/ui/skeletons";

type Mode = "all" | "selected" | "none";
const MODES: { value: Mode; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "selected", label: "فقط انتخاب‌شده‌ها" },
  { value: "none", label: "هیچ‌کس" },
];
const MODE_TEXT: Record<Mode, string> = {
  all: "همهٔ فروشنده‌ها این قابلیت را می‌بینند.",
  selected: "فقط کاربرهای فهرست زیر آن را می‌بینند. بقیه آن را در منو نمی‌بینند.",
  none: "برای همه بسته است و سایت‌های ساخته‌شده هم از دسترس خارج می‌شوند. فهرست زیر نگه داشته می‌شود.",
};
const ICONS: Record<string, React.ReactNode> = { site_builder: <Globe className="size-5" /> };

/** One feature and who gets it: everyone, a picked segment, or nobody. Admins always have it. */
function FeatureCard({ f }: { f: any }) {
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const save = useMutation({
    mutationFn: (json: any) => api(`/admin/features/${f.key}`, { method: "PUT", json }),
    onSuccess: (d: any) => {
      qc.setQueryData(["admin-features"], (old: any[] | undefined) => (old ?? []).map((x) => (x.key === d.key ? d : x)));
      setPhone(""); setPhoneTouched(false); toast.success("ذخیره شد");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const ids = f.users.map((u: any) => u.id);
  return (
    <Card>
      <CardHeader title={<span className="inline-flex items-center gap-2"><span className="text-primary">{ICONS[f.key]}</span>{f.label}</span>}
        subtitle={`${faNum(f.with_access)} از ${faNum(f.sellers)} فروشنده دسترسی دارند · ادمین‌ها همیشه دارند`}
        action={<Chip tone={f.mode === "all" ? "success" : f.mode === "selected" ? "primary" : "neutral"}>{MODES.find((m) => m.value === f.mode)?.label}</Chip>} />
      <div className="px-4 sm:px-5 pb-5 space-y-4">
        <div>
          <Tabs value={f.mode as Mode} onChange={(m) => save.mutate({ mode: m })} items={MODES} />
          <p className="text-[13px] text-muted mt-2">{MODE_TEXT[f.mode as Mode]}</p>
        </div>
        <div className={f.mode === "selected" ? "" : "opacity-60"}>
          <form className="flex items-start gap-2" onSubmit={(e) => { e.preventDefault(); if (!mobileProblem(phone)) save.mutate({ mode: f.mode, phones: [cleanPhone(phone)] }); }}>
            <Field label="افزودن کاربر با شمارهٔ موبایل" className="flex-1" error={shownProblem(phone, phoneTouched)}>
              <PhoneInput placeholder="09121234567" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setPhoneTouched(true)} aria-invalid={!!shownProblem(phone, phoneTouched)} />
            </Field>
            <Button type="submit" variant="secondary" className="mt-[26px]" icon={<Plus className="size-4" />} loading={save.isPending} disabled={!!mobileProblem(phone)}>افزودن</Button>
          </form>
          <ul className="mt-3 divide-y divide-edge">
            {f.users.length === 0 && <li className="text-[13px] text-muted py-2">هنوز کسی انتخاب نشده.</li>}
            {f.users.map((u: any) => (
              <li key={u.id} className="flex items-center gap-3 py-2 text-[14px]">
                <Link href={`/admin/users/${u.id}`} className="flex-1 min-w-0 hover:text-primary">
                  <span className="font-bold">{u.name || "بدون نام"}</span> <span className="text-muted text-[13px] tnum">{faDigits(u.phone)}</span>
                </Link>
                <Button type="button" size="sm" variant="ghost" aria-label="حذف از فهرست" icon={<X className="size-4" />}
                  onClick={() => save.mutate({ mode: f.mode, user_ids: ids.filter((i: number) => i !== u.id) })} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

export default function AdminFeatures() {
  const { data } = useQuery({ queryKey: ["admin-features"], queryFn: () => api<any[]>("/admin/features") });
  return (
    <div>
      <PageHeader title="قابلیت‌ها" subtitle="هر قابلیت تازه را اول برای گروهی از فروشنده‌ها باز کن، بعد برای همه." />
      {!data ? <FormSectionSkeleton fields={3} /> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">{data.map((f) => <FeatureCard key={f.key} f={f} />)}</div>}
    </div>
  );
}
