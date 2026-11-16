import { eq } from "drizzle-orm";

import { maskApiKey } from "@/lib/ai-model-catalog";
import type { AppDb } from "@/lib/db";
import { aiSettings } from "@/lib/db/schema";
import type { AiConfig } from "@/lib/interfaces/ai-categorization";
import type { AiSettingsView } from "@/lib/interfaces/ai-settings";
import { configFromEnv } from "@/lib/server/ai/env-config";
import { invariant } from "@/lib/server/errors";
import type { AiSettingsInput } from "./inputs";

function viewOf(config: AiConfig | null, source: AiSettingsView["source"]): AiSettingsView {
  if (!config) return { provider: null, model: null, keyMasked: null, source: null };
  return { provider: config.provider, model: config.model, keyMasked: maskApiKey(config.apiKey), source };
}

/** The configuration saved in Settings, or null when there is none. A stored key that cannot be decrypted throws. */
export async function loadStoredAiConfig(db: AppDb): Promise<AiConfig | null> {
  const row = await db.query.aiSettings.findFirst();
  return row ? { provider: row.provider, model: row.model, apiKey: row.apiKey } : null;
}

export async function getAiSettingsView(db: AppDb): Promise<AiSettingsView> {
  const stored = await loadStoredAiConfig(db);
  return stored ? viewOf(stored, "app") : viewOf(configFromEnv(), "env");
}

/**
 * Omitting `apiKey` keeps the stored one. A key belongs to one provider, so switching provider requires a new key,
 * and the environment's key is never copied into the database.
 */
export async function saveAiSettings(input: AiSettingsInput, db: AppDb): Promise<AiSettingsView> {
  const existing = await db.query.aiSettings.findFirst();
  const apiKey = input.apiKey ?? (existing?.provider === input.provider ? existing.apiKey : undefined);
  invariant(apiKey, "AI_API_KEY_REQUIRED", "Informe a API key do provedor escolhido.");
  const values = { provider: input.provider, model: input.model, apiKey, updatedAt: new Date() };
  if (existing) await db.update(aiSettings).set(values).where(eq(aiSettings.id, existing.id));
  else await db.insert(aiSettings).values(values);
  return getAiSettingsView(db);
}

/** Removing the app's configuration falls back to the environment variables, when they are set. */
export async function deleteAiSettings(db: AppDb): Promise<AiSettingsView> {
  await db.delete(aiSettings);
  return getAiSettingsView(db);
}
