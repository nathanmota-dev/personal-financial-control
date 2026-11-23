import type { AiModelOption, AiSettingsDraft, AiSettingsView } from "@/lib/interfaces/ai-settings";

export type SettingsAiFieldsProps = {
  settings: AiSettingsView;
  busy: boolean;
  onSave: (draft: AiSettingsDraft) => Promise<boolean>;
  onCheck: (draft: AiSettingsDraft) => Promise<boolean>;
  onRemove: () => void;
};

/** The state of a model list read from a local server, with a way to read it again. */
export type SettingsAiModelDiscovery = {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

/**
 * `custom` is true when the model id is typed by hand instead of picked from the list. `discovery` is set for a
 * provider whose models come from its own server instead of the fixed catalog.
 */
export type SettingsAiModelFieldProps = {
  models: readonly AiModelOption[];
  model: string;
  custom: boolean;
  onChange: (model: string, custom: boolean) => void;
  discovery?: SettingsAiModelDiscovery;
};

export type SettingsAiModelDiscoveryNoteProps = { discovery: SettingsAiModelDiscovery; count: number };

export type SettingsAiSourceNoticeProps = { settings: AiSettingsView };

/** `storedKey` is the masked ending of a saved key that still serves the chosen provider, or null. */
export type SettingsAiKeyFieldProps = {
  storedKey: string | null;
  value: string;
  onChange: (value: string) => void;
};

/** `onCommit` runs when the user finishes typing the address, so the models are listed once, not per keystroke. */
export type SettingsAiUrlFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
};
