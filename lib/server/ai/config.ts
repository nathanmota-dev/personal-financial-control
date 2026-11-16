import type { AppDb } from "@/lib/db";
import { isDemoMode } from "@/lib/demo/mode";
import type { AiConfig } from "@/lib/interfaces/ai-categorization";
import { configFromEnv, warnAiConfigOnce } from "@/lib/server/ai/env-config";
import { loadStoredAiConfig } from "@/lib/server/ai/settings";

export { resetAiConfigWarning } from "@/lib/server/ai/env-config";

/**
 * AI categorization is optional: without a complete configuration this returns null and nothing is ever sent.
 * The configuration saved in Settings wins over the AI_* environment variables, which stay as an alternative.
 * A saved configuration that cannot be read disables the feature instead of silently using another provider.
 */
export async function getAiConfig(db: AppDb): Promise<AiConfig | null> {
  if (isDemoMode()) return null;
  let stored: AiConfig | null;
  try {
    stored = await loadStoredAiConfig(db);
  } catch {
    warnAiConfigOnce("A configuração salva em Configurações não pôde ser lida.");
    return null;
  }
  return stored ?? configFromEnv();
}
