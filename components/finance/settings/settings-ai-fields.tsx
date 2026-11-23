"use client";

import { useState, type FormEvent } from "react";

import { FormSelect } from "@/components/finance/form-select";
import { SettingsAiKeyField } from "@/components/finance/settings/settings-ai-key-field";
import { SettingsAiModelField } from "@/components/finance/settings/settings-ai-model-field";
import { SettingsAiUrlField } from "@/components/finance/settings/settings-ai-url-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import { useAiModels } from "@/hooks/use-ai-models";
import { aiProviderCatalog, aiProviderConnectionKind, aiProviderDefaultBaseUrl, aiProviderModels, isAiProvider } from "@/lib/ai-model-catalog";
import { aiSettingsDraft } from "@/lib/ai-settings-form";
import type { AiProvider } from "@/lib/interfaces/ai-categorization";
import type { AiModelsDraft, AiSettingsView } from "@/lib/interfaces/ai-settings";
import type { SettingsAiFieldsProps } from "@/lib/interfaces/components/ai-settings";

const isLocal = (provider: AiProvider | null) => provider !== null && aiProviderConnectionKind(provider) === "local";

/** A cloud model outside the catalog opens as "Outro…"; a local list is read from the server, so it never does. */
function startsCustom({ provider, model }: AiSettingsView) {
  if (!provider || !model || isLocal(provider)) return false;
  return !aiProviderModels(provider).some((option) => option.id === model);
}

function initialModelsDraft({ provider, connection }: AiSettingsView): AiModelsDraft | null {
  return provider && connection?.kind === "local" ? { provider, connection } : null;
}

export function SettingsAiFields({ settings, busy, onSave, onCheck, onRemove }: SettingsAiFieldsProps) {
  const stored = settings.connection;
  const [provider, setProvider] = useState<AiProvider | null>(settings.provider);
  const [model, setModel] = useState(settings.model ?? "");
  const [custom, setCustom] = useState(() => startsCustom(settings));
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(stored?.kind === "local" ? stored.baseUrl : "");
  const discovery = useAiModels(initialModelsDraft(settings));
  const local = isLocal(provider);
  // The stored key only serves the provider it was saved for, so another provider always asks for a new one.
  const keepsKey = settings.source === "app" && provider === settings.provider && stored?.kind === "apiKey";
  const draft = aiSettingsDraft({ provider, model, apiKey, baseUrl, keepsKey });

  function listModels(target: AiProvider | null, url: string) {
    if (!isLocal(target) || !target || !url.trim()) return discovery.clear();
    void discovery.load({ provider: target, connection: { kind: "local", baseUrl: url.trim() } });
  }

  function chooseProvider(value: string) {
    if (!isAiProvider(value) || value === provider) return;
    setProvider(value);
    setModel("");
    setCustom(false);
    // Back on the saved provider the stored key applies again, so a key typed for another one is dropped.
    if (settings.source === "app" && value === settings.provider) setApiKey("");
    const url = isLocal(value) ? baseUrl.trim() || aiProviderDefaultBaseUrl(value) : baseUrl;
    setBaseUrl(url);
    listModels(value, url);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (draft && await onSave(draft)) setApiKey("");
  }

  return (
    <form className="grid items-start gap-3 md:grid-cols-3" onSubmit={submit}>
      <div className="space-y-1.5">
        <Label htmlFor="ai-provider">Provedor</Label>
        <FormSelect id="ai-provider" className="w-full" placeholder="Escolha o provedor" value={provider ?? ""} onValueChange={chooseProvider}>
          {aiProviderCatalog.map((entry) => <SelectItem key={entry.provider} value={entry.provider}>{entry.label}</SelectItem>)}
        </FormSelect>
        <p className="text-xs text-content-muted">Quem vai sugerir as categorias dos lançamentos.</p>
      </div>
      {provider ? (
        <SettingsAiModelField
          models={local ? discovery.models : aiProviderModels(provider)}
          model={model}
          custom={custom}
          onChange={(value, isCustom) => { setModel(value); setCustom(isCustom); }}
          discovery={local ? { loading: discovery.loading, error: discovery.error, onRefresh: () => listModels(provider, baseUrl) } : undefined}
        />
      ) : <div className="hidden md:block" />}
      {local
        ? <SettingsAiUrlField value={baseUrl} onChange={setBaseUrl} onCommit={() => listModels(provider, baseUrl)} />
        : <SettingsAiKeyField key={keepsKey ? "stored" : "new"} storedKey={keepsKey ? stored.keyMasked : null} value={apiKey} onChange={setApiKey} />}
      <div className="flex flex-wrap gap-3 md:col-span-3">
        <Button type="submit" variant="outline" disabled={busy || !draft}>{busy ? "Salvando…" : "Salvar configuração"}</Button>
        <Button type="button" variant="ghost" disabled={busy || !draft} onClick={() => { if (draft) void onCheck(draft); }}>Testar conexão</Button>
        {settings.source === "app" ? <Button type="button" variant="destructive" disabled={busy} onClick={onRemove}>Remover</Button> : null}
      </div>
    </form>
  );
}
