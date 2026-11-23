import { eq } from "drizzle-orm";

import { aiProviderConnectionKind, maskApiKey } from "@/lib/ai-model-catalog";
import type { AppDb } from "@/lib/db";
import { aiSettings } from "@/lib/db/schema";
import type { AiConfig, AiProvider } from "@/lib/interfaces/ai-categorization";
import type { AiConnection } from "@/lib/interfaces/ai-provider";
import type { AiConnectionView, AiSettingsView } from "@/lib/interfaces/ai-settings";
import { assertConnectionKind, parseStoredConnection } from "@/lib/server/ai/connection";
import { configFromEnv } from "@/lib/server/ai/env-config";
import { DomainError } from "@/lib/server/errors";
import type { AiConnectionInput, AiSettingsInput } from "./inputs";

function connectionView(connection: AiConnection): AiConnectionView {
  return connection.kind === "apiKey" ? { kind: "apiKey", keyMasked: maskApiKey(connection.apiKey) } : connection;
}

function viewOf(config: AiConfig | null, source: AiSettingsView["source"]): AiSettingsView {
  if (!config) return { provider: null, model: null, connection: null, source: null };
  return { provider: config.provider, model: config.model, connection: connectionView(config.connection), source };
}

/** The configuration saved in Settings, or null when there is none. A row that cannot be decrypted or read throws. */
export async function loadStoredAiConfig(db: AppDb): Promise<AiConfig | null> {
  const row = await db.query.aiSettings.findFirst();
  return row ? { provider: row.provider, model: row.model, connection: parseStoredConnection(row.provider, row.connection) } : null;
}

export async function getAiSettingsView(db: AppDb): Promise<AiSettingsView> {
  const stored = await loadStoredAiConfig(db);
  return stored ? viewOf(stored, "app") : viewOf(configFromEnv(), "env");
}

/**
 * Omitting the connection keeps the stored one. A key or an address belongs to one provider, so switching provider
 * requires a new one, and the environment's connection is never copied into the database.
 */
export async function resolveAiConnection(input: { provider: AiProvider; connection?: AiConnectionInput }, db: AppDb): Promise<AiConnection> {
  if (input.connection) {
    assertConnectionKind(input.provider, input.connection);
    return input.connection;
  }
  const stored = await loadStoredAiConfig(db);
  if (stored?.provider === input.provider) return stored.connection;
  throw aiProviderConnectionKind(input.provider) === "apiKey"
    ? new DomainError("AI_API_KEY_REQUIRED", "Informe a API key do provedor escolhido.")
    : new DomainError("AI_BASE_URL_REQUIRED", "Informe a URL do servidor local.");
}

export async function resolveAiConfig(input: AiSettingsInput, db: AppDb): Promise<AiConfig> {
  return { provider: input.provider, model: input.model, connection: await resolveAiConnection(input, db) };
}

export async function saveAiSettings(input: AiSettingsInput, db: AppDb): Promise<AiSettingsView> {
  const { provider, model, connection } = await resolveAiConfig(input, db);
  const values = { provider, model, connection: JSON.stringify(connection), updatedAt: new Date() };
  const existing = await db.query.aiSettings.findFirst({ columns: { id: true } });
  if (existing) await db.update(aiSettings).set(values).where(eq(aiSettings.id, existing.id));
  else await db.insert(aiSettings).values(values);
  return getAiSettingsView(db);
}

/** Removing the app's configuration falls back to the environment variables, when they are set. */
export async function deleteAiSettings(db: AppDb): Promise<AiSettingsView> {
  await db.delete(aiSettings);
  return getAiSettingsView(db);
}
