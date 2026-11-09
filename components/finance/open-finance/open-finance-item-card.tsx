"use client";

import { OpenFinanceLinkRow } from "@/components/finance/open-finance/open-finance-link-row";
import { OpenFinanceRemoveItem } from "@/components/finance/open-finance/open-finance-remove-item";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OpenFinanceItemCardProps } from "@/lib/interfaces/components/open-finance";
import { formatPluggyDateTime } from "@/lib/pluggy-ui";

export function OpenFinanceItemCard({ item, rows, accounts, busy, onRemove, onSaveLink }: OpenFinanceItemCardProps) {
  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle data-user-content>{item.label}</CardTitle>
            <p className="text-xs text-content-muted">Coletado em {formatPluggyDateTime(item.collectedAt)} · Próxima coleta {formatPluggyDateTime(item.nextAutoSyncAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{item.status}</Badge>
            <OpenFinanceRemoveItem label={item.label} busy={busy} onRemove={() => onRemove(item.id)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.accountsError ? <p role="alert" className="text-sm text-destructive">{item.accountsError}</p> : null}
        {!item.accountsError && !rows.length ? <p className="text-sm text-content-muted">Nenhuma conta encontrada nesta conexão.</p> : null}
        {rows.map((row) => (
          <OpenFinanceLinkRow
            key={row.externalAccountId}
            row={row}
            accounts={accounts}
            busy={busy}
            onSave={(target, draft) => onSaveLink(item.id, target, draft)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
