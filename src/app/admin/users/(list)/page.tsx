"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, ShieldPlus } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { ago, faDigits, faNum, jDate } from "@/lib/format";
import { toast } from "sonner";
import { Button, Card, Chip, Dialog, Field, Input, PageHeader, PhoneInput } from "@/components/ui/primitives";
import { mobileProblem, shownProblem } from "@/lib/phone";
import { InlineSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { VirtualTbody } from "@/components/ui/VirtualList";

/** Creates an admin account for a phone number (or makes an existing account an admin). */
function AddAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const r = await api<any>("/admin/users/admin", { method: "POST", json: { phone } });
      toast.success(r.created ? "حساب ادمین ساخته شد؛ با همین شماره و کد پیامکی وارد می‌شود." : "این حساب حالا ادمین است.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
      setPhone("");
      setTouched(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button variant="secondary" icon={<ShieldPlus className="size-4" />} onClick={() => setOpen(true)}>افزودن ادمین</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="افزودن ادمین">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <p className="text-[13px] text-muted leading-6">اگر این شماره حساب ندارد، حساب ادمین ساخته می‌شود. اگر دارد، همان حساب ادمین می‌شود (و اگر بلاک بود فعال می‌شود).</p>
          <Field label="شمارهٔ موبایل" error={shownProblem(phone, touched)}>
            <PhoneInput autoFocus value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={!!shownProblem(phone, touched)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button type="submit" loading={busy} disabled={!!mobileProblem(phone)}>ساخت ادمین</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export default function Users() {
  const [q, setQ] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const { data } = useQuery({ queryKey: ["admin-users", q], queryFn: () => api<any[]>(`/admin/users?q=${encodeURIComponent(q)}`) });
  return (
    <>
      <PageHeader title="کاربران" subtitle={data ? `${faNum(data.length)} کاربر` : <InlineSkeleton />} actions={<AddAdmin />} />
      <div className="relative mb-4 max-w-md"><Search className="size-4 absolute top-3.5 start-3 text-muted" /><Input className="ps-9" placeholder="جستجوی موبایل یا نام" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <Card strong ref={scroller} className="overflow-auto max-h-[calc(100dvh-220px)]">
        {!data ? <TableSkeleton rows={10} cols={7} /> : (
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
                  <td className="p-3">{!u.is_active ? <Chip tone="danger">بلاک</Chip> : u.plan_status === "expired" ? <Chip tone="warning">پلن تمام شده</Chip> : <Chip tone="success">فعال</Chip>}</td>
                </tr>
              )} />
          </table>
        )}
      </Card>
    </>
  );
}
