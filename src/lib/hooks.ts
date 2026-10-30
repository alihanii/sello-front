"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { API_URL, api, getToken } from "./api";

export function useStoreId(): number {
  const p = useParams<{ store: string }>();
  return Number(p.store);
}

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => api("/auth/me"), staleTime: 60_000 });
}

export function useStores() {
  return useQuery({ queryKey: ["stores"], queryFn: () => api<any[]>("/stores") });
}

export function useChannels(storeId: number) {
  return useQuery({ queryKey: ["channels", storeId], queryFn: () => api<any[]>(`/stores/${storeId}/channels`), enabled: !!storeId });
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
