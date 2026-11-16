import { isAiProvider, aiProviders } from "@/lib/ai-model-catalog";
import { getServerEnv } from "@/lib/env";
import type { AiConfig } from "@/lib/interfaces/ai-categorization";

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

/** The optional AI_* environment variables. A bad value disables the feature instead of the app. */
export function configFromEnv(): AiConfig | null {
  const { AI_PROVIDER: provider, AI_MODEL: model, AI_API_KEY: apiKey } = getServerEnv();
  if (!provider && !model && !apiKey) return null;
  if (!provider || !model || !apiKey) {
    warnAiConfigOnce("AI_PROVIDER, AI_MODEL e AI_API_KEY precisam estar todos preenchidos.");
    return null;
  }
  const normalized = provider.toLowerCase();
  if (!isAiProvider(normalized)) {
    warnAiConfigOnce(`AI_PROVIDER "${provider}" não é suportado. Use ${aiProviders.join(", ")}.`);
    return null;
  }
  return { provider: normalized, model, apiKey };
}
