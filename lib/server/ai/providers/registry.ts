import type { AiProvider } from "@/lib/interfaces/ai-categorization";
import type { AiProviderDefinition, AiProviderRegistry } from "@/lib/interfaces/ai-provider";
import { anthropicProvider } from "./anthropic";
import { deepseekProvider } from "./deepseek";
import { googleProvider } from "./google";
import { ollamaProvider } from "./ollama";
import { openaiProvider } from "./openai";

/**
 * Every provider the app supports. The type ties each one to the connection its catalog entry declares.
 * Keys are always passed explicitly, so no provider falls back to its own environment variable.
 */
const registry: AiProviderRegistry = {
  google: googleProvider,
  openai: openaiProvider,
  anthropic: anthropicProvider,
  deepseek: deepseekProvider,
  ollama: ollamaProvider,
};

/** The connection is checked against the provider before it reaches here (`assertConnectionKind`). */
export function getAiProvider(provider: AiProvider): AiProviderDefinition {
  return registry[provider] as AiProviderDefinition;
}
