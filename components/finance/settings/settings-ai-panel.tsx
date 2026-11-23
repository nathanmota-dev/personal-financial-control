"use client";

import { SettingsAiFields } from "@/components/finance/settings/settings-ai-fields";
import { SettingsAiSourceNotice } from "@/components/finance/settings/settings-ai-source-notice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAiSettings } from "@/hooks/use-ai-settings";
import type { AiSettingsView } from "@/lib/interfaces/ai-settings";

/** A new saved configuration remounts the form, so it starts from what the server holds. */
function settingsKey({ source, provider, model, connection }: AiSettingsView) {
  const reach = connection?.kind === "apiKey" ? connection.keyMasked : connection?.baseUrl;
  return `${source}:${provider}:${model}:${reach}`;
}

export function SettingsAiPanel() {
  const { settings, busy, notice, error, save, remove, check } = useAiSettings();
  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle>Categorização por IA</CardTitle>
        <CardDescription>Sugere categorias para os lançamentos pendentes do Open Finance. Vão só as descrições e as suas categorias, nunca valores, datas ou contas. Com o Ollama, tudo roda na sua máquina.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {settings ? <SettingsAiSourceNotice settings={settings} /> : null}
        {settings ? <SettingsAiFields key={settingsKey(settings)} settings={settings} busy={busy} onSave={save} onCheck={check} onRemove={remove} /> : null}
        {notice ? <p role="status" className="text-sm text-content-muted">{notice}</p> : null}
      </CardContent>
    </Card>
  );
}
