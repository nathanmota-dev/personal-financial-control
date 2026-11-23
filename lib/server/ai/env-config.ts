import { aiProviderConnectionKind, aiProviderDefaultBaseUrl, aiProviders, isAiProvider } from "@/lib/ai-model-catalog";
import { getServerEnv } from "@/lib/env";
import type { AiConfig } from "@/lib/interfaces/ai-categorization";
import { normalizeBaseUrl } from "@/lib/server/ai/connection";

let warned = false;

/** Logs each configuration problem once per process, never including the key itself. */
export function warnAiConfigOnce(message: string) {
  if (warned) return;
  warned = true;
  console.warn(`[ai] ${message} A categorização por IA ficou desligada.`);
}

export function resetAiConfigWarning() {
  warned = false;
}

/**
 * The optional AI_* environment variables. A cloud provider needs AI_API_KEY; a local one uses AI_BASE_URL, or its
 * default address when it is empty. A bad value disables the feature instead of the app.
 */
export function configFromEnv(): AiConfig | null {
  const { AI_PROVIDER: provider, AI_MODEL: model, AI_API_KEY: apiKey, AI_BASE_URL: baseUrl } = getServerEnv();
  if (!provider && !model && !apiKey && !baseUrl) return null;
  if (!provider || !model) {
    warnAiConfigOnce("AI_PROVIDER e AI_MODEL precisam estar preenchidos.");
    return null;
  }
  const normalized = provider.toLowerCase();
  if (!isAiProvider(normalized)) {
    warnAiConfigOnce(`AI_PROVIDER "${provider}" não é suportado. Use ${aiProviders.join(", ")}.`);
    return null;
  }
  if (aiProviderConnectionKind(normalized) === "apiKey") {
    if (apiKey) return { provider: normalized, model, connection: { kind: "apiKey", apiKey } };
    warnAiConfigOnce(`AI_API_KEY precisa estar preenchida para o provedor "${normalized}".`);
    return null;
  }
  const address = normalizeBaseUrl(baseUrl ?? aiProviderDefaultBaseUrl(normalized));
  if (address) return { provider: normalized, model, connection: { kind: "local", baseUrl: address } };
  warnAiConfigOnce("AI_BASE_URL precisa ser uma URL http(s) válida.");
  return null;
}
