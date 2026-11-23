import type { LanguageModel } from "ai";

import type { aiProviderCatalog } from "@/lib/ai-model-catalog";
import type { AiProvider, AiProviderOptions } from "@/lib/interfaces/ai-categorization";
import type { AiModelOption } from "@/lib/interfaces/ai-settings";

/** How the app reaches a provider: a cloud API with a key, or a server on the user's own network. */
export type AiConnectionKind = "apiKey" | "local";

export type AiApiKeyConnection = { kind: "apiKey"; apiKey: string };

/** `baseUrl` is the server root, without a trailing slash or the `/v1` suffix. */
export type AiLocalConnection = { kind: "local"; baseUrl: string };

export type AiConnection = AiApiKeyConnection | AiLocalConnection;

/** The connection each provider expects, read from the catalog so the two can never disagree. */
export type AiProviderConnection<P extends AiProvider> = Extract<
  AiConnection,
  { kind: Extract<(typeof aiProviderCatalog)[number], { provider: P }>["connectionKind"] }
>;

/** Local models on a CPU answer far slower than a cloud API, so each provider sets its own limits. */
export type AiProviderTimeouts = { categorizeMs: number; chatMs: number; checkMs: number };

/**
 * One provider behind the AI SDK's `LanguageModel`. The categorization and the chat only ever see that model,
 * so adding a provider means adding one of these and registering it.
 */
export interface AiProviderDefinition<C extends AiConnection = AiConnection> {
  createModel(connection: C, modelId: string): LanguageModel;
  options?: AiProviderOptions;
  timeouts: AiProviderTimeouts;
  listModels?(connection: C): Promise<AiModelOption[]>;
}

export type AiProviderRegistry = { [P in AiProvider]: AiProviderDefinition<AiProviderConnection<P>> };
