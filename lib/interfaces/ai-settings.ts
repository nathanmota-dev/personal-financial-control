import type { AiProvider } from "@/lib/interfaces/ai-categorization";
import type { AiConnectionKind } from "@/lib/interfaces/ai-provider";

export type AiModelOption = { id: string; label: string };

/** `defaultBaseUrl` prefills the address of a local provider; cloud providers have none. */
export type AiProviderOption = {
  provider: AiProvider;
  label: string;
  connectionKind: AiConnectionKind;
  defaultBaseUrl?: string;
  models: readonly AiModelOption[];
};

/** Where the active configuration comes from. The app's own record always wins over the environment. */
export type AiSettingsSource = "app" | "env";

/** What the Settings screen may see of a connection: a key only by its last characters, an address in full. */
export type AiConnectionView = { kind: "apiKey"; keyMasked: string } | { kind: "local"; baseUrl: string };

export type AiSettingsView = {
  provider: AiProvider | null;
  model: string | null;
  connection: AiConnectionView | null;
  source: AiSettingsSource | null;
};

export type AiConnectionDraft = { kind: "apiKey"; apiKey: string } | { kind: "local"; baseUrl: string };

/** Omitting `connection` keeps the stored one for the same provider, because the form never receives a key back. */
export type AiSettingsDraft = { provider: AiProvider; model: string; connection?: AiConnectionDraft };

/** Asks a provider for its models, with the same connection rules as a save. */
export type AiModelsDraft = Omit<AiSettingsDraft, "model">;

/** What the Settings form holds while the user edits it. */
export type AiSettingsFormState = {
  provider: AiProvider | null;
  model: string;
  apiKey: string;
  baseUrl: string;
  /** True when the saved key still serves the chosen provider, so leaving the key empty keeps it. */
  keepsKey: boolean;
};
