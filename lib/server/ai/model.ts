import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import type { AiConfig, AiProvider, AiProviderOptions } from "@/lib/interfaces/ai-categorization";

/** The key is always passed explicitly, so no provider falls back to its own environment variable. */
const factories: Record<AiProvider, (apiKey: string, model: string) => LanguageModel> = {
  google: (apiKey, model) => createGoogle({ apiKey })(model),
  openai: (apiKey, model) => createOpenAI({ apiKey })(model),
  anthropic: (apiKey, model) => createAnthropic({ apiKey })(model),
  deepseek: (apiKey, model) => createDeepSeek({ apiKey })(model),
};

/**
 * Matching a description to a category needs little reasoning. On Gemini the default thinking spent about
 * three quarters of the output tokens and tripled the latency with the same answers, so it is kept low.
 */
const providerOptions: Partial<Record<AiProvider, AiProviderOptions>> = {
  google: { google: { thinkingConfig: { thinkingLevel: "low" } } },
};

export function createLanguageModel({ provider, apiKey, model }: AiConfig): LanguageModel {
  return factories[provider](apiKey, model);
}

export function languageModelOptions({ provider }: AiConfig): AiProviderOptions | undefined {
  return providerOptions[provider];
}
