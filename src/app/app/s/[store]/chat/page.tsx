"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { faNum } from "@/lib/format";
import { useStoreId } from "@/lib/hooks";
import { Chip, PageHeader, Switch, Tabs } from "@/components/ui/primitives";
import { useAgent, useSaveAgent } from "@/lib/chat";
import { ChatOverview } from "@/components/chat/Overview";
import { ChatConnections } from "@/components/chat/Connections";
import { AssistantSettings, KnowledgeSettings, OrderSettings } from "@/components/chat/Settings";
import { TestChat } from "@/components/chat/TestChat";
import { Conversations } from "@/components/chat/Conversations";
import { AiOrders } from "@/components/chat/AiOrders";
import { ChatUsage } from "@/components/chat/Usage";

type Tab = "overview" | "connections" | "assistant" | "knowledge" | "orders-settings" | "test" | "conversations" | "orders" | "usage";

export default function Chat() {
  const sid = useStoreId();
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const tab = (sp.get("tab") as Tab) || "overview";
  const go = (t: Tab, extra = "") => router.replace(`${path}?tab=${t}${extra}`, { scroll: false });
  const { data: agent } = useAgent(sid);
  const save = useSaveAgent(sid);
  const { data: ov } = useQuery({ queryKey: ["chat-overview", sid], queryFn: () => api(`/stores/${sid}/chat/overview`), refetchInterval: 30_000 });
  const badge = (n?: number) => (n ? <span className="ms-1.5 min-w-5 h-5 px-1 rounded-full bg-warning text-white text-[11px] inline-grid place-items-center tnum">{faNum(n)}</span> : null);

  return (
    <>
      <PageHeader title="دستیار چت فروش" subtitle="در تلگرام و بله به‌جای ادمین جواب مشتری را می‌دهد، محصول توضیح می‌دهد و سفارش می‌گیرد."
        actions={agent && (
          <label className="glass rounded-full h-11 ps-4 pe-2 flex items-center gap-3 text-[14px] font-bold cursor-pointer">
            {agent.enabled ? <Chip tone="success">روشن</Chip> : <Chip>خاموش</Chip>}
            <span>دستیار</span>
            <Switch checked={agent.enabled} label="روشن/خاموش کردن دستیار" disabled={save.isPending}
              onChange={(v) => save.mutate({ enabled: v })} />
          </label>
        )} />
      <div className="mb-5 -mx-1 px-1 overflow-x-auto no-scrollbar">
        <Tabs<Tab> value={tab} onChange={(t) => go(t)} items={[
          { value: "overview", label: "نمای کلی" },
          { value: "connections", label: "اتصال‌ها" },
          { value: "assistant", label: "دستیار و لحن" },
          { value: "knowledge", label: "دانش فروشگاه" },
          { value: "orders-settings", label: "سفارش و پرداخت" },
          { value: "test", label: "تست چت" },
          { value: "conversations", label: <>گفتگوها{badge(ov?.needs_human)}</> },
          { value: "orders", label: <>سفارش‌های AI{badge(ov?.orders?.payment_submitted)}</> },
          { value: "usage", label: "مصرف و لاگ" },
        ]} />
      </div>
      {tab === "overview" && <ChatOverview data={ov} go={go} />}
      {tab === "connections" && <ChatConnections />}
      {tab === "assistant" && <AssistantSettings />}
      {tab === "knowledge" && <KnowledgeSettings />}
      {tab === "orders-settings" && <OrderSettings />}
      {tab === "test" && <TestChat />}
      {tab === "conversations" && <Conversations initial={Number(sp.get("c")) || undefined} go={go} />}
      {tab === "orders" && <AiOrders go={go} />}
      {tab === "usage" && <ChatUsage />}
    </>
  );
}
