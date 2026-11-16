import type { AiProvider } from "@/lib/interfaces/ai-categorization";
import type { AiSettingsDraft, AiSettingsView } from "@/lib/interfaces/ai-settings";

export type SettingsAiFieldsProps = {
  settings: AiSettingsView;
  busy: boolean;
  onSave: (draft: AiSettingsDraft) => Promise<boolean>;
  onRemove: () => void;
};

/** `custom` is true when the model id is typed by hand instead of picked from the catalog. */
export type SettingsAiModelFieldProps = {
  provider: AiProvider;
  model: string;
  custom: boolean;
  onChange: (model: string, custom: boolean) => void;
};

export type SettingsAiSourceNoticeProps = { settings: AiSettingsView };

/** `storedKey` is the masked ending of a saved key that still serves the chosen provider, or null. */
export type SettingsAiKeyFieldProps = {
  storedKey: string | null;
  value: string;
  onChange: (value: string) => void;
};
