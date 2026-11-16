"use client";

import { FormSelect } from "@/components/finance/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import { aiProviderModels } from "@/lib/ai-model-catalog";
import type { SettingsAiModelFieldProps } from "@/lib/interfaces/components/ai-settings";

const OTHER = "__other";

export function SettingsAiModelField({ provider, model, custom, onChange }: SettingsAiModelFieldProps) {
  const models = aiProviderModels(provider);
  return (
    <div className="space-y-1.5">
      <Label htmlFor="ai-model">Modelo</Label>
      <FormSelect id="ai-model" className="w-full" placeholder="Escolha o modelo" value={custom ? OTHER : model} onValueChange={(value) => onChange(value === OTHER ? "" : value, value === OTHER)}>
        {models.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}
        <SelectItem value={OTHER}>Outro…</SelectItem>
      </FormSelect>
      {custom ? (
        <Input id="ai-model-custom" aria-label="ID do modelo" autoComplete="off" spellCheck={false} placeholder="Ex.: gemini-3.6-flash" value={model} onChange={(event) => onChange(event.target.value, true)} />
      ) : null}
      <p className="text-xs text-content-muted">{custom ? "Use o ID exato que o provedor publica na documentação." : "Escolha \"Outro\" para usar um modelo fora da lista."}</p>
    </div>
  );
}
