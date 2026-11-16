"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import type { SettingsAiKeyFieldProps } from "@/lib/interfaces/components/ai-settings";

/**
 * With a saved key, the field shows only its masked ending and asks for a new key on "Trocar".
 * The typed key is hidden by default; the eye button reveals it so a pasted key can be checked.
 */
export function SettingsAiKeyField({ storedKey, value, onChange }: SettingsAiKeyFieldProps) {
  const [replacing, setReplacing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const toggleLabel = revealed ? "Ocultar chave" : "Mostrar chave";

  if (storedKey && !replacing) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="ai-api-key">API key</Label>
        <InputGroup>
          <InputGroupInput id="ai-api-key" readOnly value={storedKey} className="text-content" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton onClick={() => setReplacing(true)}>Trocar</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <p className="text-xs text-content-muted">Chave salva e criptografada. Só o final dela é exibido.</p>
      </div>
    );
  }

  function cancel() {
    onChange("");
    setRevealed(false);
    setReplacing(false);
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="ai-api-key">{storedKey ? "Nova API key" : "API key"}</Label>
      <InputGroup>
        <InputGroupInput id="ai-api-key" type={revealed ? "text" : "password"} autoComplete="off" spellCheck={false} autoFocus={replacing} placeholder="Cole a chave do provedor" value={value} onChange={(event) => onChange(event.target.value)} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label={toggleLabel} title={toggleLabel} aria-pressed={revealed} onClick={() => setRevealed((current) => !current)}>
            {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </InputGroupButton>
          {storedKey ? <InputGroupButton onClick={cancel}>Cancelar</InputGroupButton> : null}
        </InputGroupAddon>
      </InputGroup>
      <p className="text-xs text-content-muted">Guardada criptografada no banco e nunca exibida de novo.</p>
    </div>
  );
}
