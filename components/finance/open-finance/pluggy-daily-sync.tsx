"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useDatabaseSync } from "@/lib/database-sync-context";
import type { PluggyDailySyncResult } from "@/lib/interfaces/pluggy";
import type { PluggyDailySyncProps } from "@/lib/interfaces/components/open-finance";

async function requestDailySync(): Promise<PluggyDailySyncResult | null> {
  // A background check must not redirect: session locking is handled by SessionActivity.
  const response = await fetch("/api/pluggy/sync/daily", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: "{}" });
  return response.ok ? await response.json() as PluggyDailySyncResult : null;
}

/** Asks the server once per app load; the server decides whether today's sync already happened. */
export function PluggyDailySync({ demoMode }: PluggyDailySyncProps) {
  const { canWrite } = useDatabaseSync();
  const router = useRouter();
  const requested = useRef(false);

  useEffect(() => {
    if (demoMode || !canWrite || requested.current) return;
    requested.current = true;
    requestDailySync()
      .then((result) => {
        if (!result?.ran) return;
        if (result.run.status === "failed") {
          toast.error("A sincronização automática com os bancos falhou. Veja os detalhes em Configurações.");
          return;
        }
        toast.success("Bancos sincronizados.");
        router.refresh();
      })
      // The manual sync in Configurações stays available, so a background failure stays quiet.
      .catch(() => undefined);
  }, [demoMode, canWrite, router]);

  return null;
}
