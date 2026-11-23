import type { AiProvider } from "@/lib/interfaces/ai-categorization";
import type { AiConnectionKind } from "@/lib/interfaces/ai-provider";
import type { AiModelOption, AiProviderOption } from "@/lib/interfaces/ai-settings";

/**
 * Hand-picked current models per provider, checked against each provider's docs in November 2026.
 * The Settings form also accepts any other model id, so an outdated list never blocks a new model.
 * A local provider has no fixed list: the form asks the server running on the user's machine for its models.
 */
export const aiProviderCatalog = [
  {
    provider: "google",
    connectionKind: "apiKey",
    label: "Google Gemini",
    models: [
      { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
      { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
      { id: "gemini-4-hydrogen", label: "Gemini 4 Hydrogen" },
      { id: "gemini-4-argon", label: "Gemini 4 Argon" },
      { id: "gemini-4-carbon", label: "Gemini 4 Carbon" },
    ],
  },
  {
    provider: "openai",
    connectionKind: "apiKey",
    label: "OpenAI",
    models: [
      { id: "gpt-6-luna", label: "GPT-6 Luna" },
      { id: "gpt-6.1-terra", label: "GPT-6.1 Terra" },
      { id: "gpt-6.1-sol", label: "GPT-6.1 Sol" },
      { id: "gpt-6-astra", label: "GPT-6 Astra" },
    ],
  },
  {
    provider: "anthropic",
    connectionKind: "apiKey",
    label: "Anthropic Claude",
    models: [
      { id: "claude-haiku-5-5", label: "Claude Haiku 5.5" },
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" },
      { id: "claude-opus-5-5", label: "Claude Opus 5.5" },
      { id: "claude-fable-5-2", label: "Claude Fable 5.2" },
    ],
  },
  {
    provider: "deepseek",
    connectionKind: "apiKey",
    label: "DeepSeek",
    models: [
      { id: "deepseek-flash", label: "DeepSeek Flash" },
      { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
    ],
  },
  {
    provider: "ollama",
    connectionKind: "local",
    label: "Ollama (local)",
    defaultBaseUrl: "http://localhost:11434",
    models: [],
  },
] as const satisfies readonly AiProviderOption[];

export const aiProviders = aiProviderCatalog.map((entry) => entry.provider) as readonly AiProvider[];

export function isAiProvider(value: string): value is AiProvider {
  return (aiProviders as readonly string[]).includes(value);
}

export function aiProviderModels(provider: AiProvider): readonly AiModelOption[] {
  return aiProviderCatalog.find((entry) => entry.provider === provider)?.models ?? [];
}

export function aiProviderConnectionKind(provider: AiProvider): AiConnectionKind {
  return aiProviderCatalog.find((entry) => entry.provider === provider)?.connectionKind ?? "apiKey";
}

export function aiProviderDefaultBaseUrl(provider: AiProvider): string {
  const entry: AiProviderOption | undefined = aiProviderCatalog.find((item) => item.provider === provider);
  return entry?.defaultBaseUrl ?? "";
}

export function aiProviderLabel(provider: AiProvider): string {
  return aiProviderCatalog.find((entry) => entry.provider === provider)?.label ?? provider;
}

/** Shows only the last four characters, so a pasted key can be recognized without being exposed. */
export function maskApiKey(apiKey: string): string {
  return `••••${apiKey.slice(-4)}`;
}
