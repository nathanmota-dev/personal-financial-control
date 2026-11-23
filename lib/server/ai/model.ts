import type { LanguageModel } from "ai";

import type { AiConfig, AiProviderOptions } from "@/lib/interfaces/ai-categorization";
import type { AiProviderTimeouts } from "@/lib/interfaces/ai-provider";
import { assertConnectionKind } from "@/lib/server/ai/connection";
import { getAiProvider } from "@/lib/server/ai/providers/registry";

export function createLanguageModel({ provider, model, connection }: AiConfig): LanguageModel {
  assertConnectionKind(provider, connection);
  return getAiProvider(provider).createModel(connection, model);
}

export function languageModelOptions({ provider }: AiConfig): AiProviderOptions | undefined {
  return getAiProvider(provider).options;
}

export function languageModelTimeouts({ provider }: AiConfig): AiProviderTimeouts {
  return getAiProvider(provider).timeouts;
}
