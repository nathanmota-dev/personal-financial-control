import { useCallback, useEffect, useState } from "react";

import type { AiSettingsDraft, AiSettingsView } from "@/lib/interfaces/ai-settings";
import { pluggyRequest } from "@/lib/pluggy-ui";

type SettingsResponse = { settings: AiSettingsView };

const endpoint = "/api/ai/settings";
const checkEndpoint = "/api/ai/settings/check";

const failureMessage = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir a operação.";

export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettingsView | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    pluggyRequest<SettingsResponse>(endpoint)
      .then((result) => { if (active) setSettings(result.settings); })
      .catch((failure: unknown) => { if (active) setError(failureMessage(failure)); });
    return () => { active = false; };
  }, []);

  /** Runs one request with a shared busy state; `success` is shown only when it worked. */
  const perform = useCallback(async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      await action();
      setNotice(success);
      return true;
    } catch (failure) {
      setError(failureMessage(failure));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const run = useCallback((method: "PUT" | "DELETE", success: string, draft?: AiSettingsDraft) => perform(async () => {
    setSettings((await pluggyRequest<SettingsResponse>(endpoint, method, draft)).settings);
  }, success), [perform]);

  const save = useCallback((draft: AiSettingsDraft) => run("PUT", "Configuração da IA salva.", draft), [run]);
  const remove = useCallback(() => run("DELETE", "Configuração da IA removida."), [run]);

  /** Tries the form's configuration without saving it, so the saved one stays as it was. */
  const check = useCallback((draft: AiSettingsDraft) => perform(async () => {
    await pluggyRequest(checkEndpoint, "POST", draft);
  }, "Conexão funcionando: o modelo respondeu."), [perform]);

  return { settings, busy, notice, error, save, remove, check };
}
