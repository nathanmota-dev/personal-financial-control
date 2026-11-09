"use client";

import { OpenFinanceRunSummary } from "@/components/finance/open-finance/open-finance-run-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OpenFinanceSyncPanelProps } from "@/lib/interfaces/components/open-finance";
import { RefreshCw } from "lucide-react";

export function OpenFinanceSyncPanel({ run, syncing, onSync }: OpenFinanceSyncPanelProps) {
  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle>Sincronização</CardTitle>
        <CardDescription>Lê o que a Pluggy já coletou dos bancos. O app não consegue forçar uma nova coleta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" disabled={syncing} onClick={onSync}>
          <RefreshCw className="size-4" />
          {syncing ? "Sincronizando…" : "Sincronizar bancos"}
        </Button>
        {run ? <OpenFinanceRunSummary run={run} /> : <p className="text-sm text-content-muted">Nenhuma sincronização realizada.</p>}
      </CardContent>
    </Card>
  );
}
