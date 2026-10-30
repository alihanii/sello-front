"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { OperationWatcher } from "@/components/OperationWatcher";
import { Button, Card } from "@/components/ui/primitives";

export default function InstagramCallback() {
  const params = useSearchParams();
  const router = useRouter();
  const [op, setOp] = useState<any>(null);
  const [error, setError] = useState("");
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) {
      setError(params.get("error_description") || "ورود با اینستاگرام لغو شد.");
      return;
    }
    api("/channels/instagram/oauth-callback", { method: "POST", json: { code, state } })
      .then(setOp)
      .catch((e) => setError(e.message));
  }, [params]);

  const back = () => router.replace(op ? `/app/s/${op.store_id}/channels` : "/app");
  return (
    <div className="min-h-dvh grid place-items-center px-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <h1 className="font-extrabold text-[18px]">اتصال اینستاگرام</h1>
        {error && <p className="text-[14px] text-danger bg-danger/8 rounded-xl p-3">{error}</p>}
        {op && <OperationWatcher opId={op.id} storeId={op.store_id} />}
        {!op && !error && <p className="text-muted text-[14px]">در حال دریافت دسترسی…</p>}
        <Button variant="secondary" className="w-full" onClick={back}>بازگشت به کانال‌ها</Button>
      </Card>
    </div>
  );
}
