import type { AiProvider } from "@/lib/interfaces/ai-categorization";

export type AiModelOption = { id: string; label: string };

export type AiProviderOption = { provider: AiProvider; label: string; models: readonly AiModelOption[] };

/** Where the active configuration comes from. The app's own record always wins over the environment. */
export type AiSettingsSource = "app" | "env";

/** What the Settings screen may see: the API key itself never leaves the server, only its last characters. */
export type AiSettingsView = {
  provider: AiProvider | null;
  model: string | null;
  keyMasked: string | null;
  source: AiSettingsSource | null;
};

/** Omitting `apiKey` keeps the stored one, because the form never receives it back. */
export type AiSettingsDraft = { provider: AiProvider; model: string; apiKey?: string };
