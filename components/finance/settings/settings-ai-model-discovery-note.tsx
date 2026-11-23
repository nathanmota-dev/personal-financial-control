"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SettingsAiModelDiscoveryNoteProps } from "@/lib/interfaces/components/ai-settings";

function discoveryText(loading: boolean, error: string | null, count: number) {
  if (loading) return "Buscando os modelos instalados…";
  if (error) return error;
  if (count === 0) return "Nenhum modelo instalado. Rode \"ollama pull <modelo>\" e atualize.";
  return `${count} ${count === 1 ? "modelo instalado" : "modelos instalados"} no servidor.`;
}

/** Status of the model list read from a local server, with a button to read it again. */
export function SettingsAiModelDiscoveryNote({ discovery, count }: SettingsAiModelDiscoveryNoteProps) {
  const { loading, error, onRefresh } = discovery;
  return (
    <div className="flex items-start justify-between gap-2">
      <p role={error ? "alert" : undefined} className={error ? "text-xs text-danger" : "text-xs text-content-muted"}>{discoveryText(loading, error, count)}</p>
      <Button type="button" variant="ghost" size="xs" disabled={loading} onClick={onRefresh}>
        <RefreshCw aria-hidden="true" />
        Atualizar
      </Button>
    </div>
  );
}
