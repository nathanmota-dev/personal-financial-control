import { Alert, AlertDescription } from "@/components/ui/alert";
import { aiProviderLabel } from "@/lib/ai-model-catalog";
import type { SettingsAiSourceNoticeProps } from "@/lib/interfaces/components/ai-settings";

/** Tells where the active configuration comes from, so a .env setup is never mistaken for "off". */
export function SettingsAiSourceNotice({ settings }: SettingsAiSourceNoticeProps) {
  if (!settings.source || !settings.provider) {
    return <p className="text-sm text-content-muted">A categorização por IA está desligada. Nada é enviado a nenhum provedor até você salvar uma configuração.</p>;
  }
  const address = settings.connection?.kind === "local" ? ` em ${settings.connection.baseUrl}` : "";
  const active = `${aiProviderLabel(settings.provider)} · ${settings.model}${address}`;
  if (settings.source === "env") {
    return (
      <Alert>
        <AlertDescription>Configurado via .env ({active}). Salvar aqui passa a valer no lugar das variáveis AI_*.</AlertDescription>
      </Alert>
    );
  }
  return <p className="text-sm text-content-muted">Em uso: <span className="font-medium text-content-strong">{active}</span>.</p>;
}
