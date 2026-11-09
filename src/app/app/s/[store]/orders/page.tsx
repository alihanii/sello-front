"use client";

import { useQuery } from "@tanstack/react-query";
import { FilePlus2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { faNum } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { orderQueries } from "@/lib/orders";
import { Button, PageHeader, Tabs } from "@/components/ui/primitives";
import { OrdersList } from "@/components/orders/OrdersList";
import { InvoiceForm } from "@/components/orders/InvoiceForm";
import { InvoiceList, InvoiceSettings } from "@/components/orders/Invoices";

type Tab = "orders" | "invoices" | "new" | "chat-order" | "settings";

export default function Orders() {
  const sid = useStoreId();
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const tab = (sp.get("tab") as Tab) || "orders";
  const go = (t: Tab) => router.replace(`${path}?tab=${t}`, { scroll: false });
  const { data } = useQuery({ ...orderQueries.list(sid, new URLSearchParams({ status: "payment_submitted", limit: "1" })), refetchInterval: 30_000 });
  const waiting = data?.counts?.payment_submitted;
  return (
    <>
      <PageHeader title="سفارشات" subtitle="همهٔ سفارش‌ها یک‌جا: دستیار AI، سفارش‌های چت و فاکتورهایی که مشتری پرداخت کرده."
        actions={tab !== "new" && <Button icon={<FilePlus2 className="size-4" />} onClick={() => go("new")}>فاکتور جدید</Button>} />
      <div className="mb-5 -mx-1 px-1 overflow-x-auto no-scrollbar">
        <Tabs<Tab> value={tab === "chat-order" ? "orders" : tab} onChange={go} items={[
          { value: "orders", label: <>لیست سفارشات{waiting ? <span className="ms-1.5 min-w-5 h-5 px-1 rounded-full bg-warning text-white text-[11px] inline-grid place-items-center tnum">{faNum(waiting)}</span> : null}</> },
          { value: "invoices", label: "فاکتورها" },
          { value: "new", label: "ساخت فاکتور جدید" },
          { value: "settings", label: "تنظیمات فاکتور" },
        ]} />
      </div>
      {tab === "orders" && <OrdersList onNewChatOrder={() => go("chat-order")} />}
      {tab === "chat-order" && <><h2 className="font-extrabold text-[17px] mb-3">ثبت سفارشی که در چت گرفتی</h2><InvoiceForm chat onDone={() => go("orders")} /></>}
      {tab === "invoices" && <InvoiceList onNew={() => go("new")} />}
      {tab === "new" && <InvoiceForm onDone={() => go("invoices")} />}
      {tab === "settings" && <InvoiceSettings />}
    </>
  );
}
