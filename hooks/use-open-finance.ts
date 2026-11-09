"use client";

import { useCallback, useEffect, useState } from "react";

import type { PluggyAccountRow, PluggyLatestRun, PluggyLinkDraft, PluggyOverview, PluggySyncRunView } from "@/lib/interfaces/pluggy";
import { pluggyRequest } from "@/lib/pluggy-ui";

const failureMessage = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir a operação.";

export function useOpenFinance() {
  const [overview, setOverview] = useState<PluggyOverview | null>(null);
  const [run, setRun] = useState<PluggySyncRunView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setOverview(await pluggyRequest<PluggyOverview>("/api/pluggy/items"));
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([pluggyRequest<PluggyOverview>("/api/pluggy/items"), pluggyRequest<PluggyLatestRun>("/api/pluggy/sync")])
      .then(([nextOverview, latest]) => {
        if (!active) return;
        setOverview(nextOverview);
        setRun(latest.run);
        setSyncing(latest.running);
      })
      .catch((failure: unknown) => { if (active) setError(failureMessage(failure)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const mutate = useCallback(async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await loadOverview();
      return true;
    } catch (failure) {
      setError(failureMessage(failure));
      return false;
    } finally {
      setBusy(false);
    }
  }, [loadOverview]);

  const addItem = useCallback((externalItemId: string, label: string) =>
    mutate(() => pluggyRequest("/api/pluggy/items", "POST", { externalItemId, label })), [mutate]);

  const removeItem = useCallback((id: string) => {
    void mutate(() => pluggyRequest(`/api/pluggy/items?id=${encodeURIComponent(id)}`, "DELETE"));
  }, [mutate]);

  const saveLink = useCallback((itemId: string, row: PluggyAccountRow, draft: PluggyLinkDraft) => {
    void mutate(() => row.link
      ? pluggyRequest("/api/pluggy/links", "PATCH", { id: row.link.id, ...draft })
      : pluggyRequest("/api/pluggy/links", "POST", { itemId, externalAccountId: row.externalAccountId, accountId: draft.accountId, cutoffDate: draft.cutoffDate }));
  }, [mutate]);

  const sync = useCallback(() => {
    setSyncing(true);
    setError(null);
    pluggyRequest<{ run: PluggySyncRunView }>("/api/pluggy/sync", "POST")
      .then(async (result) => { setRun(result.run); await loadOverview(); })
      .catch((failure: unknown) => setError(failureMessage(failure)))
      .finally(() => setSyncing(false));
  }, [loadOverview]);

  return { overview, run, loading, busy, syncing, error, addItem, removeItem, saveLink, sync };
}
