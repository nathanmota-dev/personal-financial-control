import { z } from "zod";

import { aiProviderConnectionKind } from "@/lib/ai-model-catalog";
import type { AiProvider } from "@/lib/interfaces/ai-categorization";
import type { AiConnection } from "@/lib/interfaces/ai-provider";
import { DomainError } from "@/lib/server/errors";

/**
 * The server root of a local provider, kept without a trailing slash or `/v1`, so pasting either the root or the
 * OpenAI-compatible endpoint works. Credentials, a query or a fragment in the address are refused.
 */
export function normalizeBaseUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password || url.search || url.hash) return null;
  const path = url.pathname.replace(/\/+$/, "").replace(/\/v1$/, "");
  return `${url.origin}${path}`;
}

export const aiModelIdSchema = z.string().trim().min(1).max(120).regex(/^[\w.:/-]+$/);

const baseUrlSchema = z.string().max(300).transform((value, context) => {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) context.addIssue({ code: "custom", message: "Informe uma URL http(s) válida." });
  return normalized ?? "";
});

export const aiConnectionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("apiKey"), apiKey: z.string().trim().min(8).max(512).regex(/^\S+$/) }),
  z.object({ kind: z.literal("local"), baseUrl: baseUrlSchema }),
]);

/** A key cannot reach a local server, nor an address a cloud provider, so the kind must match the provider. */
export function assertConnectionKind(provider: AiProvider, connection: AiConnection): void {
  if (connection.kind !== aiProviderConnectionKind(provider)) {
    throw new DomainError("AI_CONNECTION_MISMATCH", "Esse provedor usa outro tipo de conexão.");
  }
}

/** Reads a stored connection. Anything that does not fit the provider throws, so the feature turns off. */
export function parseStoredConnection(provider: AiProvider, stored: string): AiConnection {
  const connection = aiConnectionSchema.parse(JSON.parse(stored));
  assertConnectionKind(provider, connection);
  return connection;
}
