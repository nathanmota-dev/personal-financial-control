"use client";

import { useState, type FormEvent } from "react";

import { FormSelect } from "@/components/finance/form-select";
import { SettingsAiKeyField } from "@/components/finance/settings/settings-ai-key-field";
import { SettingsAiModelField } from "@/components/finance/settings/settings-ai-model-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import { aiProviderCatalog, aiProviderModels, isAiProvider } from "@/lib/ai-model-catalog";
import type { AiProvider } from "@/lib/interfaces/ai-categorization";
import type { SettingsAiFieldsProps } from "@/lib/interfaces/components/ai-settings";

function isCatalogModel(provider: AiProvider | null, model: string) {
  return provider ? aiProviderModels(provider).some((option) => option.id === model) : false;
}

export function SettingsAiFields({ settings, busy, onSave, onRemove }: SettingsAiFieldsProps) {
  const [provider, setProvider] = useState<AiProvider | null>(settings.provider);
  const [model, setModel] = useState(settings.model ?? "");
  const [custom, setCustom] = useState(Boolean(settings.model) && !isCatalogModel(settings.provider, settings.model ?? ""));
  const [apiKey, setApiKey] = useState("");
  // The stored key only serves the provider it was saved for, so another provider always asks for a new one.
  const keepsKey = settings.source === "app" && provider === settings.provider;
  const ready = Boolean(provider && model.trim() && (apiKey.trim() || keepsKey));

  function chooseProvider(value: string) {
    if (!isAiProvider(value) || value === provider) return;
    setProvider(value);
    setModel("");
    setCustom(false);
    // Back on the saved provider the stored key applies again, so a key typed for another one is dropped.
    if (settings.source === "app" && value === settings.provider) setApiKey("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!provider || !ready) return;
    if (await onSave({ provider, model: model.trim(), ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}) })) setApiKey("");
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
      {provider ? <SettingsAiModelField provider={provider} model={model} custom={custom} onChange={(value, isCustom) => { setModel(value); setCustom(isCustom); }} /> : <div className="hidden md:block" />}
      <SettingsAiKeyField key={keepsKey ? "stored" : "new"} storedKey={keepsKey ? settings.keyMasked : null} value={apiKey} onChange={setApiKey} />
      <div className="flex flex-wrap gap-3 md:col-span-3">
        <Button type="submit" variant="outline" disabled={busy || !ready}>{busy ? "Salvando…" : "Salvar configuração"}</Button>
        {settings.source === "app" ? <Button type="button" variant="destructive" disabled={busy} onClick={onRemove}>Remover</Button> : null}
      </div>
    </form>
  );
}
