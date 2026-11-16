import { isDemoMode } from "@/lib/demo/mode";
import { getServerEnv } from "@/lib/env";
import type { AiConfig, AiProvider } from "@/lib/interfaces/ai-categorization";

const providers: Record<AiProvider, true> = { google: true, openai: true, anthropic: true, deepseek: true };

function isProvider(value: string): value is AiProvider {
  return Object.hasOwn(providers, value);
}

let warned = false;

function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  console.warn(`[ai] ${message} A categorização por IA ficou desligada.`);
}

function configFromEnv(): AiConfig | null {
  const { AI_PROVIDER: provider, AI_MODEL: model, AI_API_KEY: apiKey } = getServerEnv();
  if (!provider && !model && !apiKey) return null;
  if (!provider || !model || !apiKey) {
    warnOnce("AI_PROVIDER, AI_MODEL e AI_API_KEY precisam estar todos preenchidos.");
    return null;
  }
  const normalized = provider.toLowerCase();
  if (!isProvider(normalized)) {
    warnOnce(`AI_PROVIDER "${provider}" não é suportado. Use ${Object.keys(providers).join(", ")}.`);
    return null;
  }
  return { provider: normalized, model, apiKey };
}

/**
 * AI categorization is optional: without a complete configuration this returns null and nothing is ever sent.
 * Every caller reads the configuration here, so a Settings-stored key can later take precedence over the env.
 */
export function getAiConfig(): AiConfig | null {
  if (isDemoMode()) return null;
  return configFromEnv();
}

export function resetAiConfigWarning() {
  warned = false;
}
