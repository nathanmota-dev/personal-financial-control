import { aiProviderConnectionKind } from "@/lib/ai-model-catalog";
import type { AiConnectionDraft, AiSettingsDraft, AiSettingsFormState } from "@/lib/interfaces/ai-settings";

/** The connection the form sends: a typed key, or the address of a local server. Null keeps the saved one. */
export function aiConnectionDraft(form: AiSettingsFormState): AiConnectionDraft | null {
  if (!form.provider) return null;
  if (aiProviderConnectionKind(form.provider) === "local") {
    const baseUrl = form.baseUrl.trim();
    return baseUrl ? { kind: "local", baseUrl } : null;
  }
  const apiKey = form.apiKey.trim();
  return apiKey ? { kind: "apiKey", apiKey } : null;
}

/** A key may be left empty only while the saved one still serves the chosen provider; an address is always needed. */
export function aiSettingsFormReady(form: AiSettingsFormState): boolean {
  if (!form.provider || !form.model.trim()) return false;
  return Boolean(aiConnectionDraft(form)) || (aiProviderConnectionKind(form.provider) === "apiKey" && form.keepsKey);
}

export function aiSettingsDraft(form: AiSettingsFormState): AiSettingsDraft | null {
  if (!form.provider || !aiSettingsFormReady(form)) return null;
  const connection = aiConnectionDraft(form);
  return { provider: form.provider, model: form.model.trim(), ...(connection ? { connection } : {}) };
}
