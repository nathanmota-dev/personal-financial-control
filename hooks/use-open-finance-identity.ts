import { useCallback, useEffect, useState } from "react";

import type { PluggyIdentityDraft, PluggyIdentityView } from "@/lib/interfaces/pluggy";
import { pluggyRequest } from "@/lib/pluggy-ui";

type IdentityResponse = { identity: PluggyIdentityView };

const failureMessage = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir a operação.";

export function useOpenFinanceIdentity() {
  const [identity, setIdentity] = useState<PluggyIdentityView | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    pluggyRequest<IdentityResponse>("/api/pluggy/identity")
      .then((result) => { if (active) setIdentity(result.identity); })
      .catch((failure: unknown) => { if (active) setError(failureMessage(failure)); });
    return () => { active = false; };
  }, []);

  const save = useCallback(async (draft: PluggyIdentityDraft) => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      setIdentity((await pluggyRequest<IdentityResponse>("/api/pluggy/identity", "PUT", draft)).identity);
      setSaved(true);
    } catch (failure) {
      setError(failureMessage(failure));
    } finally {
      setSaving(false);
    }
  }, []);

  return { identity, saving, saved, error, save };
}
