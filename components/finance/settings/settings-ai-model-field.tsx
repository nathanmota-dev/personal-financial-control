"use client";

import { FormSelect } from "@/components/finance/form-select";
import { SettingsAiModelDiscoveryNote } from "@/components/finance/settings/settings-ai-model-discovery-note";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import type { SettingsAiModelFieldProps } from "@/lib/interfaces/components/ai-settings";

const OTHER = "__other";

/** A saved model missing from the list (not installed yet, or the list failed) stays visible as an option. */
function withCurrent(models: SettingsAiModelFieldProps["models"], model: string, custom: boolean) {
  return model && !custom && !models.some((option) => option.id === model) ? [...models, { id: model, label: model }] : models;
}

export function SettingsAiModelField({ models, model, custom, onChange, discovery }: SettingsAiModelFieldProps) {
  const options = withCurrent(models, model, custom);
  const hint = custom ? "Use o ID exato que o provedor publica na documentação." : "Escolha \"Outro\" para usar um modelo fora da lista.";
  return (
    <div className="space-y-1.5">
      <Label htmlFor="ai-model">Modelo</Label>
      <FormSelect id="ai-model" className="w-full" placeholder="Escolha o modelo" value={custom ? OTHER : model} onValueChange={(value) => onChange(value === OTHER ? "" : value, value === OTHER)}>
        {options.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}
        <SelectItem value={OTHER}>Outro…</SelectItem>
      </FormSelect>
      {custom ? (
        <Input id="ai-model-custom" aria-label="ID do modelo" autoComplete="off" spellCheck={false} placeholder={discovery ? "Ex.: qwen3:8b" : "Ex.: gemini-3.6-flash"} value={model} onChange={(event) => onChange(event.target.value, true)} />
      ) : null}
      {discovery ? <SettingsAiModelDiscoveryNote discovery={discovery} count={models.length} /> : <p className="text-xs text-content-muted">{hint}</p>}
    </div>
  );
}
