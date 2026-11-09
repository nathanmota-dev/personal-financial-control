import { useCallback, useEffect, useState } from "react";

import type { PluggyInvestmentOverview, PluggyInvestmentView } from "@/lib/interfaces/pluggy-investments";
import { pluggyRequest } from "@/lib/pluggy-ui";

const PATH = "/api/pluggy/investments";
const failureMessage = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir a operação.";

/** `refreshKey` changes when a sync finishes or a connection changes, because both alter the remote positions. */
export function useOpenFinanceInvestments(refreshKey: string) {
  const [overview, setOverview] = useState<PluggyInvestmentOverview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    pluggyRequest<PluggyInvestmentOverview>(PATH)
      .then((result) => { if (active) { setOverview(result); setError(null); } })
      .catch((failure: unknown) => { if (active) setError(failureMessage(failure)); });
    return () => { active = false; };
  }, [refreshKey]);

  const mutate = useCallback(async (action: () => Promise<PluggyInvestmentOverview>) => {
    setBusy(true);
    setError(null);
    try {
      setOverview(await action());
    } catch (failure) {
      setError(failureMessage(failure));
    } finally {
      setBusy(false);
    }
  }, []);

  const link = useCallback((row: PluggyInvestmentView, holdingId: string | null) => {
    void mutate(() => pluggyRequest<PluggyInvestmentOverview>(PATH, "POST", { itemId: row.itemId, externalAssetId: row.externalAssetId, holdingId }));
  }, [mutate]);

  const unlink = useCallback((holdingId: string) => {
    void mutate(() => pluggyRequest<PluggyInvestmentOverview>(`${PATH}?holdingId=${encodeURIComponent(holdingId)}`, "DELETE"));
  }, [mutate]);

  return { overview, busy, error, link, unlink };
}
