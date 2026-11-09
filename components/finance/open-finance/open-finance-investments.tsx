"use client";

import { OpenFinanceInvestmentRow } from "@/components/finance/open-finance/open-finance-investment-row";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpenFinanceInvestments } from "@/hooks/use-open-finance-investments";
import type { OpenFinanceInvestmentsProps } from "@/lib/interfaces/components/open-finance";

export function OpenFinanceInvestments({ refreshKey }: OpenFinanceInvestmentsProps) {
  const { overview, busy, error, link, unlink } = useOpenFinanceInvestments(refreshKey);
  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle>Investimentos</CardTitle>
        <CardDescription>Vincule cada posição do banco a um ativo. A sincronização atualiza somente o valor e a data dos ativos vinculados, sem alterar ativos cotados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {!overview && !error ? <p role="status" className="text-sm text-content-muted">Carregando investimentos…</p> : null}
        {overview?.notices.map((notice) => (
          <p key={notice.itemId} role={notice.failed ? "alert" : undefined} className={notice.failed ? "text-sm text-destructive" : "text-sm text-content-muted"}>
            <span data-user-content className="font-medium">{notice.label}</span>: {notice.message}
          </p>
        ))}
        {overview?.investments.length ? (
          <ul className="max-h-[32rem] space-y-2 overflow-y-auto">
            {overview.investments.map((row) => (
              <OpenFinanceInvestmentRow key={`${row.itemId}-${row.externalAssetId}`} row={row} holdings={overview.holdings} busy={busy} onLink={link} onUnlink={unlink} />
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
