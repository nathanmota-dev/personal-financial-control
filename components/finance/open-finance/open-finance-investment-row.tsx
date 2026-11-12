"use client";

import { useState } from "react";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/finance/form-select";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import type { OpenFinanceInvestmentRowProps } from "@/lib/interfaces/components/open-finance";

export function OpenFinanceInvestmentRow({ row, holdings, busy, onLink, onUnlink }: OpenFinanceInvestmentRowProps) {
  const { formatCurrency } = useFinancialFormatter();
  const [choice, setChoice] = useState(row.suggestedHoldingId ?? "");
  // The list is reloaded after each link, which can take the chosen holding out of the options.
  const holdingId = holdings.some((holding) => holding.id === choice) ? choice : "";
  const fieldId = `open-finance-investment-${row.externalAssetId}`;
  const { link } = row;

  return (
    <li className="grid items-end gap-3 rounded-lg border border-border p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <p data-user-content className="truncate text-sm font-medium text-content-strong">{row.name}</p>
        <p className="text-xs text-content-muted">
          <span data-user-content>{row.institutionName ?? row.itemLabel}</span> · <span data-user-content>{row.currentValueCents === null ? "Saldo não informado" : formatCurrency(row.currentValueCents)}</span> · <span data-user-content>{row.valueAsOf}</span>
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {link ? <Badge variant="outline">Vinculado</Badge> : null}
          {!link && holdingId && holdingId === row.suggestedHoldingId ? <Badge variant="secondary">Sugestão</Badge> : null}
          {row.withdrawn ? <Badge variant="destructive">Resgate total</Badge> : null}
        </div>
      </div>
      {link ? (
        <p className="min-w-0 truncate text-sm text-content-muted">Ativo: <span data-user-content className="font-medium text-content-strong">{link.holdingName}</span></p>
      ) : (
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={fieldId}>Ativo local de {row.name}</Label>
          <FormSelect id={fieldId} className="w-full" value={holdingId} placeholder="Selecione um ativo" onValueChange={setChoice}>
            {holdings.map((holding) => <SelectItem data-user-content key={holding.id} value={holding.id}>{holding.name}</SelectItem>)}
          </FormSelect>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {link ? <Button variant="outline" disabled={busy} onClick={() => onUnlink(link.holdingId)}>Desvincular</Button> : null}
        {!link ? <Button variant="outline" disabled={busy || !holdingId} onClick={() => onLink(row, holdingId)}>Vincular ativo</Button> : null}
        {!link ? <Button variant="outline" disabled={busy || row.currentValueCents === null} onClick={() => onLink(row, null)}>Criar novo ativo</Button> : null}
      </div>
    </li>
  );
}
