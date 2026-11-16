"use client";

import { SettingsAiFields } from "@/components/finance/settings/settings-ai-fields";
import { SettingsAiSourceNotice } from "@/components/finance/settings/settings-ai-source-notice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAiSettings } from "@/hooks/use-ai-settings";

export function SettingsAiPanel() {
  const { settings, busy, notice, error, save, remove } = useAiSettings();
  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle>Categorização por IA</CardTitle>
        <CardDescription>Sugere categorias para os lançamentos pendentes do Open Finance. Vão só as descrições e as suas categorias, nunca valores, datas ou contas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {settings ? <SettingsAiSourceNotice settings={settings} /> : null}
        {settings ? <SettingsAiFields key={`${settings.source}:${settings.provider}:${settings.model}:${settings.keyMasked}`} settings={settings} busy={busy} onSave={save} onRemove={remove} /> : null}
        {notice ? <p role="status" className="text-sm text-content-muted">{notice}</p> : null}
      </CardContent>
    </Card>
  );
}
