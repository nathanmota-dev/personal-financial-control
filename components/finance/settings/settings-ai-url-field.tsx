"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SettingsAiUrlFieldProps } from "@/lib/interfaces/components/ai-settings";

/** The address of a local server. It is not a secret, so it is shown and edited in full. */
export function SettingsAiUrlField({ value, onChange, onCommit }: SettingsAiUrlFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="ai-base-url">URL do servidor</Label>
      <Input
        id="ai-base-url"
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder="http://localhost:11434"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onCommit}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onCommit(); } }}
      />
      <p className="text-xs text-content-muted">Onde o Ollama está rodando. Os dados não saem da sua rede.</p>
    </div>
  );
}
