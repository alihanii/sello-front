"use client";

import { queryOptions, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { API_URL, api, getToken } from "./api";

export function useStoreId(): number {
  const p = useParams<{ store: string }>();
  return Number(p.store);
}

export function useMe(enabled = true) {
  return useQuery({ queryKey: ["me"], queryFn: () => api("/auth/me"), staleTime: 60_000, enabled });
}

export function useStores() {
  return useQuery({ queryKey: ["stores"], queryFn: () => api<any[]>("/stores") });
}

/**
 * Query definitions shared by pages and by hover-prefetch in the shell, so a prefetched result lands under exactly the key
 * the page reads and the page opens with its data already there.
 */
export const productListParams = (f: { q?: string; source?: string; stock?: string; status?: string; category?: string; page?: number } = {}) => {
  const p = new URLSearchParams({ q: f.q ?? "", source: f.source ?? "", stock: f.stock ?? "", status: f.status ?? "", page: String(f.page ?? 1), size: "25" });
  if (f.category) p.set("category", f.category); // "-" = products without a category
  return p;
};
export const activityParams = (f: { type?: string; status?: string; page?: number } = {}) =>
  new URLSearchParams({ type: f.type ?? "", status: f.status === "failed" ? "failed,partial" : (f.status ?? ""), page: String(f.page ?? 1), size: "30" });

export const storeQueries = {
  channels: (sid: number) => queryOptions({ queryKey: ["channels", sid], queryFn: () => api<any[]>(`/stores/${sid}/channels`), enabled: !!sid }),
  dashboard: (sid: number) => queryOptions({ queryKey: ["dashboard", sid], queryFn: () => api(`/stores/${sid}/dashboard`) }),
  products: (sid: number, params: URLSearchParams) => queryOptions({ queryKey: ["products", sid, params.toString()], queryFn: () => api(`/stores/${sid}/products?${params}`) }),
  categories: (sid: number) => queryOptions({ queryKey: ["product-categories", sid], queryFn: () => api<{ name: string; count: number }[]>(`/stores/${sid}/product-categories`), enabled: !!sid }),
  operations: (sid: number, params: URLSearchParams) => queryOptions({ queryKey: ["operations", sid, params.toString()], queryFn: () => api(`/stores/${sid}/operations?${params}`) }),
  crawlSources: (sid: number) => queryOptions({ queryKey: ["crawl-sources", sid], queryFn: () => api<any[]>(`/stores/${sid}/crawl-sources`) }),
  platforms: () => queryOptions({ queryKey: ["platforms"], queryFn: () => api<any[]>("/platforms"), staleTime: 5 * 60_000 }),
  store: (sid: number) => queryOptions({ queryKey: ["store", sid], queryFn: () => api(`/stores/${sid}`) }),
  orders: (sid: number) => queryOptions({ queryKey: ["orders", sid, new URLSearchParams({ source: "", status: "", q: "", limit: "30", offset: "0" }).toString()], queryFn: () => api(`/stores/${sid}/orders?source=&status=&q=&limit=30&offset=0`) }),
  chatOverview: (sid: number) => queryOptions({ queryKey: ["chat-overview", sid], queryFn: () => api(`/stores/${sid}/chat/overview`) }),
  site: (sid: number) => queryOptions({ queryKey: ["site", sid], queryFn: () => api(`/stores/${sid}/site`) }),
};

export function useChannels(storeId: number) {
  return useQuery(storeQueries.channels(storeId));
}

/** Warms the data of a store page (called when the pointer reaches its link), so opening it shows content, not a skeleton. */
export function prefetchStorePage(qc: QueryClient, sid: number, href: string) {
  const rest = href.replace(`/app/s/${sid}`, "").split("?")[0];
  const jobs: Record<string, () => unknown[]> = {
    "": () => [storeQueries.dashboard(sid), storeQueries.chatOverview(sid), storeQueries.channels(sid)],
    "/products": () => [storeQueries.products(sid, productListParams()), storeQueries.channels(sid)],
    "/activity": () => [storeQueries.operations(sid, activityParams()), storeQueries.channels(sid)],
    "/channels": () => [storeQueries.channels(sid), storeQueries.platforms(), storeQueries.crawlSources(sid)],
    "/crawl": () => [storeQueries.crawlSources(sid), storeQueries.channels(sid)],
    "/settings": () => [storeQueries.store(sid)],
    "/chat": () => [storeQueries.chatOverview(sid)],
    "/orders": () => [storeQueries.orders(sid)],
    "/site": () => [storeQueries.site(sid)],
  };
  // prefetchQuery skips anything still fresh, so hovering back and forth costs nothing.
  for (const q of jobs[rest]?.() ?? []) qc.prefetchQuery(q as any);
}

/** Live status: refreshes every query that depends on operations when one changes. */
export function useOperationsStream(storeId: number) {
  const qc = useQueryClient();
  useEffect(() => {
    const token = getToken();
    if (!storeId || !token) return;
    const es = new EventSource(`${API_URL}/api/v1/stores/${storeId}/operations/stream?token=${encodeURIComponent(token)}`);
    es.onmessage = (e) => {
      const op = JSON.parse(e.data);
      qc.setQueryData(["operation", op.id], (old: any) => (old ? { ...old, ...op } : old));
      qc.invalidateQueries({ queryKey: ["operations", storeId] });
      qc.invalidateQueries({ queryKey: ["ops-summary", storeId] });
      if (["succeeded", "failed", "partial"].includes(op.status)) {
        qc.invalidateQueries({ queryKey: ["operation", op.id] });
        qc.invalidateQueries({ queryKey: ["products", storeId] });
        qc.invalidateQueries({ queryKey: ["product"] });
        qc.invalidateQueries({ queryKey: ["channels", storeId] });
        qc.invalidateQueries({ queryKey: ["dashboard", storeId] });
        qc.invalidateQueries({ queryKey: ["calendar", storeId] });
      }
    };
    return () => es.close();
  }, [storeId, qc]);
}
