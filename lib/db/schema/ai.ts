import { encryptedText } from "@/lib/db/encrypted-content";
import { encryptionChecks } from "@/lib/db/encryption-checks";
import { aiProviders } from "@/lib/ai-model-catalog";
import type { AiProvider } from "@/lib/interfaces/ai-categorization";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { timestampColumns } from "./accounts";
import { recordId } from "./columns";

/**
 * Single row with the AI provider chosen in Settings. It takes precedence over the AI_* environment variables.
 * `connection` is the JSON of an `AiConnection` (a key, a local address…), so a new kind needs no new column.
 */
export const aiSettings = sqliteTable("ai_settings", {
  id: recordId(),
  provider: encryptedText<AiProvider>("provider", "ai_settings.provider", { enum: aiProviders }).notNull(),
  model: encryptedText("model", "ai_settings.model").notNull(),
  connection: encryptedText("connection", "ai_settings.connection").notNull(),
  ...timestampColumns("ai_settings"),
}, (table) => [...encryptionChecks(table)]);
