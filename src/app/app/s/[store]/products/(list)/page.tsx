"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Download, FileSpreadsheet, Grid2X2, ImageOff, List, Pencil, Plus, Search, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { API_URL, api, getToken, mediaUrl } from "@/lib/api";
import { ago, faDigits, faNum, toman } from "@/lib/format";
import { productListParams, storeQueries, useChannels, useStoreId } from "@/lib/hooks";
import { ChannelStatusStrip, SourceBadge } from "@/components/ui/status";
import { PublishDialog } from "@/components/products/PublishDialog";
import { ImportDialog } from "@/components/products/ImportDialog";
import { BulkEditDialog } from "@/components/products/BulkEditDialog";
import { Button, Card, EmptyState, Input, PageHeader, Select, Tabs, cn } from "@/components/ui/primitives";
import { InlineSkeleton, ProductsBodySkeleton } from "@/components/ui/skeletons";

export default function Products() {
  const sid = useStoreId();
  const qc = useQueryClient();
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [stock, setStock] = useState(sp.get("stock") ?? "");
  const [chan, setChan] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  // Phones get the card grid; a 7-column table is unreadable at 375px. (Signed-in pages render only in the browser.)
  const [view, setView] = useState<"table" | "grid">(() => (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches ? "grid" : "table"));
  const [selected, setSelected] = useState<number[]>([]);
  // "Select all N products": bulk actions go to every product matching the current filters, not just this page.
  const [allMatching, setAllMatching] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const { data: channels = [] } = useChannels(sid);
  const { data: categories = [] } = useQuery(storeQueries.categories(sid));

  const params = productListParams({ q, source, stock, status, category, page });
  if (chan.startsWith("in:")) params.set("published_in", chan.slice(3));
  if (chan.startsWith("not:")) params.set("not_published_in", chan.slice(4));
  const { data, isPending, isPlaceholderData } = useQuery({ ...storeQueries.products(sid, params), placeholderData: keepPreviousData });
  const filters = {
    q, source, stock, status, category: category === "-" ? "" : category || null,
    published_in: chan.startsWith("in:") ? Number(chan.slice(3)) : null,
    not_published_in: chan.startsWith("not:") ? Number(chan.slice(4)) : null,
  };
  const bulk = useMutation({
    mutationFn: (body: any) => api(`/stores/${sid}/products/bulk`, { method: "POST",
      json: allMatching ? { filters, ...body } : { product_ids: selected, ...body } }),
    onSuccess: (r, v: any) => {
      toast.success(v.action === "publish" ? `${faNum(r.queued)} انتشار در صف قرار گرفت؛ وضعیت را در «فعالیت‌ها» ببینید.`
        : v.action === "edit" ? `${faNum(r.changed)} محصول تغییر کرد.` : "انجام شد");
      setSelected([]); setAllMatching(false); setPublishOpen(false); setEditOpen(false);
      qc.invalidateQueries({ queryKey: ["products", sid] });
      qc.invalidateQueries({ queryKey: ["product-categories", sid] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const stockMut = useMutation({
    mutationFn: ({ id, qty }: any) => api(`/products/${id}/stock`, { method: "POST", json: { qty } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", sid] }),
    onError: (e: any) => toast.error(e.message),
  });
  const priceMut = useMutation({
    mutationFn: ({ id, price }: any) => api(`/products/${id}`, { method: "PATCH", json: { price } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products", sid] }); toast.success("قیمت ذخیره شد"); },
    onError: (e: any) => toast.error(e.message),
  });
  const items: any[] = data?.items ?? [];
  const allSel = items.length > 0 && items.every((p) => selected.includes(p.id));
  const selCount = allMatching ? data?.total ?? 0 : selected.length;
  // A filter change makes "all matching" mean something else, so the selection starts over.
  const filterKey = JSON.stringify(filters);
  useEffect(() => { setAllMatching(false); setSelected([]); }, [filterKey]);
  const toggle = (id: number, on: boolean) => { setAllMatching(false); setSelected(on ? [...selected, id] : selected.filter((x) => x !== id)); };

  const exportCsv = async () => {
    const res = await fetch(`${API_URL}/api/v1/stores/${sid}/products.csv`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement("a"), { href: url, download: `products-${sid}.csv` }).click();
  };

  return (
    <>
      <PageHeader title="محصولات" subtitle={data ? `${faNum(data.total)} محصول` : <InlineSkeleton />}
        actions={<>
          <Button variant="ghost" size="sm" icon={<Download className="size-4" />} onClick={exportCsv}>خروجی CSV</Button>
          <Button variant="secondary" size="sm" icon={<FileSpreadsheet className="size-4" />} onClick={() => setImportOpen(true)}>ورود از اکسل</Button>
          <Link href={`/app/s/${sid}/crawl`}><Button variant="secondary">کرال</Button></Link>
          <Link href={`/app/s/${sid}/products/new?mode=ai`}><Button variant="ai" icon={<Sparkles className="size-4" />}>ساخت با AI</Button></Link>
          <Link href={`/app/s/${sid}/products/new?mode=manual`}><Button icon={<Plus className="size-4" />}>افزودن دستی</Button></Link>
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
        <Select className="w-auto" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="دسته‌بندی">
          <option value="">همهٔ دسته‌ها</option>
          <option value="-">بدون دسته</option>
          {categories.map((c) => <option key={c.name} value={c.name}>{c.name} ({faNum(c.count)})</option>)}
        </Select>
        <Select className="w-auto" value={stock} onChange={(e) => { setStock(e.target.value); setPage(1); }} aria-label="موجودی">
          <option value="">همهٔ موجودی‌ها</option><option value="low">کم‌موجودی</option><option value="out">تمام‌شده</option>
        </Select>
        <Select className="w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="وضعیت">
          <option value="">فعال</option><option value="draft">پیش‌نویس</option><option value="archived">آرشیو</option>
        </Select>
        {view === "grid" && items.length > 0 && (
          <label className="flex items-center gap-2 h-11 px-3 rounded-full bg-subtle text-[13px] font-semibold cursor-pointer">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={allSel}
              onChange={(e) => { setAllMatching(false); setSelected(e.target.checked ? items.map((p) => p.id) : []); }} />
            انتخاب همه
          </label>
        )}
        <Tabs value={view} onChange={setView} items={[
          { value: "table", label: <List className="size-4" aria-label="جدول" /> },
          { value: "grid", label: <Grid2X2 className="size-4" aria-label="گرید" /> },
        ]} />
      </Card>

      {/* While a filter change is loading, the previous rows stay (dimmed) instead of collapsing to a skeleton. */}
      <div className={cn("transition-opacity", isPlaceholderData && "opacity-60 pointer-events-none")} aria-busy={isPlaceholderData}>
      {isPending ? <ProductsBodySkeleton view={view} /> : items.length === 0 ? (
        <Card><EmptyState icon={<Plus className="size-6" />} title="محصولی پیدا نشد"
          text="محصول دستی اضافه کن، از کانالت کرال کن یا با AI بساز."
          action={<Link href={`/app/s/${sid}/products/new?mode=ai`}><Button variant="ai">ساخت اولین محصول با AI</Button></Link>} /></Card>
      ) : view === "table" ? (
        <Card strong className="overflow-x-auto">
          <table className="w-full text-[14px] min-w-[900px]">
            <thead className="text-muted text-[12px] text-start">
              <tr className="border-b border-edge">
                <th className="p-3 w-10"><input type="checkbox" aria-label="انتخاب همه" className="size-4 accent-[var(--primary)]" checked={allSel}
                  onChange={(e) => { setAllMatching(false); setSelected(e.target.checked ? items.map((p) => p.id) : []); }} /></th>
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
                    onChange={(e) => toggle(p.id, e.target.checked)} /></td>
                  <td className="p-3">
                    <Link href={`/app/s/${sid}/products/${p.id}`} className="flex items-center gap-3 group">
                      {p.images[0] ? <img src={mediaUrl(p.images[0].url)} alt="" className="size-11 rounded-xl object-cover bg-subtle" loading="lazy" />
                        : <span className="size-11 rounded-xl bg-subtle grid place-items-center text-muted"><ImageOff className="size-4" /></span>}
                      <span>
                        <span className="block font-semibold group-hover:text-primary line-clamp-1">{p.title}</span>
                        <span className="block text-muted text-[12px] tnum">{p.sku || `#${faNum(p.id)}`}{p.category && ` · ${p.category}`}{p.status === "draft" && " · پیش‌نویس"}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="p-3"><PriceCell price={p.price} onSave={(price) => priceMut.mutate({ id: p.id, price })} /></td>
                  <td className="p-3">
                    <input inputMode="numeric" dir="ltr" defaultValue={faDigits(p.stock_qty)} key={p.stock_qty} aria-label="موجودی"
                      className={cn("w-20 h-9 rounded-lg bg-subtle px-2 text-center tnum outline-none focus:ring-2 focus:ring-primary/30",
                        p.stock_qty <= 0 ? "text-danger" : p.stock_qty <= 3 ? "text-warning" : "")}
                      onBlur={(e) => { const v = Number(e.target.value.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/\D/g, "")); if (v !== p.stock_qty) stockMut.mutate({ id: p.id, qty: v }); }} />
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
            <div key={p.id} className="relative">
              {/* Outside the link, so ticking it selects instead of opening the product. */}
              <label className="absolute top-3 start-3 z-10 size-8 grid place-items-center rounded-full glass-strong cursor-pointer">
                <input type="checkbox" aria-label={`انتخاب ${p.title}`} className="size-4 accent-[var(--primary)]"
                  checked={allMatching || selected.includes(p.id)} onChange={(e) => toggle(p.id, e.target.checked)} />
              </label>
              <Link href={`/app/s/${sid}/products/${p.id}`} className="block h-full">
                <Card className={cn("overflow-hidden hover:-translate-y-0.5 transition h-full p-1.5", selected.includes(p.id) && "ring-2 ring-primary/50")}>
                  <div className="aspect-square bg-subtle rounded-[18px] overflow-hidden">
                    {p.images[0] ? <img src={mediaUrl(p.images[0].url)} alt="" className="size-full object-cover" loading="lazy" />
                      : <div className="size-full grid place-items-center text-muted"><ImageOff className="size-6" /></div>}
                  </div>
                  <div className="p-2 sm:p-2.5 space-y-2">
                    <div className="font-bold text-[14px] line-clamp-1">{p.title}</div>
                    {p.category && <div className="text-muted text-[12px] line-clamp-1 -mt-1.5">{p.category}</div>}
                    <div className="flex flex-wrap items-center justify-between gap-1"><span className="tnum text-[13px] font-semibold">{toman(p.price)}</span><SourceBadge source={p.source} /></div>
                    <ChannelStatusStrip channels={channels} listings={p.listings} />
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
      </div>

      {data && data.total > 25 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>قبلی</Button>
          <span className="text-[13px] text-muted tnum">صفحهٔ {faNum(page)} از {faNum(Math.ceil(data.total / 25))}</span>
          <Button variant="secondary" size="sm" disabled={page * 25 >= data.total} onClick={() => setPage(page + 1)}>بعدی</Button>
        </div>
      )}

      {selCount > 0 && (
        <div className="fixed bottom-24 lg:bottom-5 inset-x-0 z-40 flex justify-center px-3">
          <Card strong className="flex flex-wrap items-center justify-center gap-2 p-2 ps-4 rounded-[22px]">
            <span className="text-[14px] font-bold tnum">{faNum(selCount)} مورد</span>
            {data && !allMatching && allSel && data.total > items.length && (
              <Button size="sm" variant="ghost" onClick={() => setAllMatching(true)}>انتخاب همهٔ {faNum(data.total)} محصول</Button>
            )}
            {allMatching && <Button size="sm" variant="ghost" onClick={() => setAllMatching(false)}>فقط همین صفحه</Button>}
            <Button size="sm" icon={<Pencil className="size-4" />} onClick={() => setEditOpen(true)}>ویرایش گروهی</Button>
            <Button size="sm" variant="secondary" icon={<Send className="size-4" />} onClick={() => setPublishOpen(true)}>انتشار در…</Button>
            <Button size="sm" variant="secondary" title="محصولات پیش‌نویس (مثلاً ساخته‌شده با AI) تأیید و فعال می‌شوند"
              onClick={() => bulk.mutate({ action: "status", status: "ready" })}>تأیید پیش‌نویس</Button>
            <Button size="sm" variant="danger" icon={<Archive className="size-4" />} onClick={() => bulk.mutate({ action: "archive" })}>آرشیو</Button>
            <Button size="sm" variant="ghost" onClick={() => { setSelected([]); setAllMatching(false); }}>لغو</Button>
          </Card>
        </div>
      )}
      <ImportDialog storeId={sid} open={importOpen} onClose={() => setImportOpen(false)} />
      <BulkEditDialog open={editOpen} onClose={() => setEditOpen(false)} storeId={sid} count={selCount} loading={bulk.isPending}
        sample={allMatching ? items : items.filter((p) => selected.includes(p.id))}
        onConfirm={(edit) => bulk.mutate({ action: "edit", edit })} />
      <PublishDialog open={publishOpen} onClose={() => setPublishOpen(false)} channels={channels} loading={bulk.isPending}
        onConfirm={(ids: number[], showPrice: boolean) => bulk.mutate({ action: "publish", channel_ids: ids, show_price: showPrice })} />
    </>
  );
}

const toLatinDigits = (v: string) => v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
const groupFa = (n: number) => faDigits(n.toLocaleString("en").replace(/,/g, "٬"));

/** Price edited right in the table: type, then Enter or click away to save; Escape puts it back. */
function PriceCell({ price, onSave }: { price: number; onSave: (price: number) => void }) {
  const [text, setText] = useState(groupFa(price));
  useEffect(() => setText(groupFa(price)), [price]);
  const commit = () => {
    const v = Number(toLatinDigits(text).replace(/\D/g, "")) || 0;
    setText(groupFa(v));
    if (v !== price) onSave(v);
  };
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <input inputMode="numeric" dir="ltr" value={text} aria-label="قیمت (تومان)"
        className="w-28 h-9 rounded-lg bg-subtle px-2 text-center tnum outline-none focus:ring-2 focus:ring-primary/30"
        onFocus={(e) => e.target.select()}
        onChange={(e) => { const v = Number(toLatinDigits(e.target.value).replace(/\D/g, "")); setText(v ? groupFa(v) : ""); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setText(groupFa(price)); setTimeout(() => (e.target as HTMLInputElement).blur()); } }}
        onBlur={commit} />
      <span className="text-[12px] text-muted">تومان</span>
    </span>
  );
}
