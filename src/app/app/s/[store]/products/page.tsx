"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Download, Grid2X2, ImageOff, List, Plus, Search, Send, Sparkles, Tag } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { API_URL, api, getToken, mediaUrl } from "@/lib/api";
import { ago, faNum, toman } from "@/lib/format";
import { useChannels, useStoreId } from "@/lib/hooks";
import { ChannelStatusStrip, SourceBadge } from "@/components/ui/status";
import { PublishDialog } from "@/components/products/PublishDialog";
import { Button, Card, EmptyState, Input, PageHeader, Select, Skeleton, Tabs, cn } from "@/components/ui/primitives";

export default function Products() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [stock, setStock] = useState(sp.get("stock") ?? "");
  const [chan, setChan] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"table" | "grid">("table");
  // Phones get the card grid; a 7-column table is unreadable at 375px.
  useEffect(() => { if (window.matchMedia("(max-width: 767px)").matches) setView("grid"); }, []);
  const [selected, setSelected] = useState<number[]>([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const { data: channels = [] } = useChannels(sid);

  const params = new URLSearchParams({ q, source, stock, status, page: String(page), size: "25" });
  if (chan.startsWith("in:")) params.set("published_in", chan.slice(3));
  if (chan.startsWith("not:")) params.set("not_published_in", chan.slice(4));
  const { data, isLoading } = useQuery({
    queryKey: ["products", sid, params.toString()],
    queryFn: () => api(`/stores/${sid}/products?${params}`),
    placeholderData: keepPreviousData,
  });
  const bulk = useMutation({
    mutationFn: (body: any) => api(`/stores/${sid}/products/bulk`, { method: "POST", json: { product_ids: selected, ...body } }),
    onSuccess: (r, v: any) => {
      toast.success(v.action === "publish" ? `${faNum(r.queued)} انتشار در صف قرار گرفت؛ وضعیت را در «فعالیت‌ها» ببینید.` : "انجام شد");
      setSelected([]); setPublishOpen(false);
      qc.invalidateQueries({ queryKey: ["products", sid] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const stockMut = useMutation({
    mutationFn: ({ id, qty }: any) => api(`/products/${id}/stock`, { method: "POST", json: { qty } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", sid] }),
    onError: (e: any) => toast.error(e.message),
  });
  const items: any[] = data?.items ?? [];
  const allSel = items.length > 0 && items.every((p) => selected.includes(p.id));

  const exportCsv = async () => {
    const res = await fetch(`${API_URL}/api/v1/stores/${sid}/products.csv`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement("a"), { href: url, download: `products-${sid}.csv` }).click();
  };

  return (
    <>
      <PageHeader title="محصولات" subtitle={data ? `${faNum(data.total)} محصول` : undefined}
        actions={<>
          <Button variant="ghost" size="sm" icon={<Download className="size-4" />} onClick={exportCsv}>خروجی CSV</Button>
          <Link href={`/app/s/${sid}/crawl`}><Button variant="secondary">کرال</Button></Link>
          <Link href={`/app/s/${sid}/products/ai`}><Button variant="ai" icon={<Sparkles className="size-4" />}>ساخت با AI</Button></Link>
          <Link href={`/app/s/${sid}/products/new`}><Button icon={<Plus className="size-4" />}>افزودن دستی</Button></Link>
        </>} />

      <Card className="p-3 mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="size-4 absolute top-3.5 start-3 text-muted" />
          <Input placeholder="جستجو در عنوان، شناسه، توضیح…" className="ps-9" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <Select className="w-auto" value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} aria-label="منبع">
          <option value="">همهٔ منابع</option><option value="manual">دستی</option><option value="crawl">کرال</option><option value="ai">AI</option>
        </Select>
        <Select className="w-auto" value={chan} onChange={(e) => { setChan(e.target.value); setPage(1); }} aria-label="کانال">
          <option value="">همهٔ کانال‌ها</option>
          {channels.map((c: any) => <option key={`in${c.id}`} value={`in:${c.id}`}>منتشرشده در {c.display_name}</option>)}
          {channels.map((c: any) => <option key={`n${c.id}`} value={`not:${c.id}`}>منتشرنشده در {c.display_name}</option>)}
        </Select>
        <Select className="w-auto" value={stock} onChange={(e) => { setStock(e.target.value); setPage(1); }} aria-label="موجودی">
          <option value="">همهٔ موجودی‌ها</option><option value="low">کم‌موجودی</option><option value="out">تمام‌شده</option>
        </Select>
        <Select className="w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="وضعیت">
          <option value="">فعال</option><option value="draft">پیش‌نویس</option><option value="archived">آرشیو</option>
        </Select>
        <Tabs value={view} onChange={setView} items={[
          { value: "table", label: <List className="size-4" aria-label="جدول" /> },
          { value: "grid", label: <Grid2X2 className="size-4" aria-label="گرید" /> },
        ]} />
      </Card>

      {isLoading ? <Skeleton className="h-96" /> : items.length === 0 ? (
        <Card><EmptyState icon={<Plus className="size-6" />} title="محصولی پیدا نشد"
          text="محصول دستی اضافه کن، از کانالت کرال کن یا با AI بساز."
          action={<Link href={`/app/s/${sid}/products/ai`}><Button variant="ai">ساخت اولین محصول با AI</Button></Link>} /></Card>
      ) : view === "table" ? (
        <Card strong className="overflow-x-auto">
          <table className="w-full text-[14px] min-w-[900px]">
            <thead className="text-muted text-[12px] text-start">
              <tr className="border-b border-edge">
                <th className="p-3 w-10"><input type="checkbox" aria-label="انتخاب همه" className="size-4 accent-[var(--primary)]" checked={allSel}
                  onChange={(e) => setSelected(e.target.checked ? items.map((p) => p.id) : [])} /></th>
                <th className="p-3 text-start font-semibold">محصول</th>
                <th className="p-3 text-start font-semibold">قیمت</th>
                <th className="p-3 text-start font-semibold">موجودی</th>
                <th className="p-3 text-start font-semibold">منبع</th>
                <th className="p-3 text-start font-semibold">وضعیت در کانال‌ها</th>
                <th className="p-3 text-start font-semibold">آخرین تغییر</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className={cn("border-b border-edge last:border-0 hover:bg-subtle/60 transition", selected.includes(p.id) && "bg-primary/6")}>
                  <td className="p-3"><input type="checkbox" aria-label={`انتخاب ${p.title}`} className="size-4 accent-[var(--primary)]" checked={selected.includes(p.id)}
                    onChange={(e) => setSelected(e.target.checked ? [...selected, p.id] : selected.filter((x) => x !== p.id))} /></td>
                  <td className="p-3">
                    <Link href={`/app/s/${sid}/products/${p.id}`} className="flex items-center gap-3 group">
                      {p.images[0] ? <img src={mediaUrl(p.images[0].url)} alt="" className="size-11 rounded-xl object-cover bg-subtle" loading="lazy" />
                        : <span className="size-11 rounded-xl bg-subtle grid place-items-center text-muted"><ImageOff className="size-4" /></span>}
                      <span>
                        <span className="block font-semibold group-hover:text-primary line-clamp-1">{p.title}</span>
                        <span className="block text-muted text-[12px] tnum">{p.sku || `#${faNum(p.id)}`}{p.status === "draft" && " · پیش‌نویس"}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="p-3 tnum whitespace-nowrap">{toman(p.price)}</td>
                  <td className="p-3">
                    <input type="number" defaultValue={p.stock_qty} aria-label="موجودی"
                      className={cn("w-20 h-9 rounded-lg bg-subtle px-2 text-center tnum outline-none focus:ring-2 focus:ring-primary/30",
                        p.stock_qty <= 0 ? "text-danger" : p.stock_qty <= 3 ? "text-warning" : "")}
                      onBlur={(e) => { const v = Number(e.target.value); if (v !== p.stock_qty) stockMut.mutate({ id: p.id, qty: v }); }} />
                  </td>
                  <td className="p-3"><SourceBadge source={p.source} /></td>
                  <td className="p-3"><ChannelStatusStrip channels={channels} listings={p.listings} /></td>
                  <td className="p-3 text-muted text-[12px] whitespace-nowrap">{ago(p.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {items.map((p) => (
            <Link key={p.id} href={`/app/s/${sid}/products/${p.id}`}>
              <Card className="overflow-hidden hover:-translate-y-0.5 transition h-full p-1.5">
                <div className="aspect-square bg-subtle rounded-[18px] overflow-hidden">
                  {p.images[0] ? <img src={mediaUrl(p.images[0].url)} alt="" className="size-full object-cover" loading="lazy" />
                    : <div className="size-full grid place-items-center text-muted"><ImageOff className="size-6" /></div>}
                </div>
                <div className="p-2 sm:p-2.5 space-y-2">
                  <div className="font-bold text-[14px] line-clamp-1">{p.title}</div>
                  <div className="flex flex-wrap items-center justify-between gap-1"><span className="tnum text-[13px] font-semibold">{toman(p.price)}</span><SourceBadge source={p.source} /></div>
                  <ChannelStatusStrip channels={channels} listings={p.listings} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data && data.total > 25 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>قبلی</Button>
          <span className="text-[13px] text-muted tnum">صفحهٔ {faNum(page)} از {faNum(Math.ceil(data.total / 25))}</span>
          <Button variant="secondary" size="sm" disabled={page * 25 >= data.total} onClick={() => setPage(page + 1)}>بعدی</Button>
        </div>
      )}

      {selected.length > 0 && (
        <div className="fixed bottom-24 lg:bottom-5 inset-x-0 z-40 flex justify-center px-3">
          <Card strong className="flex flex-wrap items-center justify-center gap-2 p-2 ps-4 rounded-[22px]">
            <span className="text-[14px] font-bold tnum">{faNum(selected.length)} مورد</span>
            <Button size="sm" icon={<Send className="size-4" />} onClick={() => setPublishOpen(true)}>انتشار در…</Button>
            <Button size="sm" variant="secondary" icon={<Tag className="size-4" />} onClick={() => {
              const tag = prompt("برچسب:"); if (tag) bulk.mutate({ action: "tag", tag });
            }}>برچسب</Button>
            <Button size="sm" variant="secondary" onClick={() => bulk.mutate({ action: "status", status: "ready" })}>آماده</Button>
            <Button size="sm" variant="danger" icon={<Archive className="size-4" />} onClick={() => bulk.mutate({ action: "archive" })}>آرشیو</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>لغو</Button>
          </Card>
        </div>
      )}
      <PublishDialog open={publishOpen} onClose={() => setPublishOpen(false)} channels={channels} loading={bulk.isPending}
        onConfirm={(ids: number[]) => bulk.mutate({ action: "publish", channel_ids: ids })} />
    </>
  );
}
