"use client";

import { HoldingActions } from "@/components/finance/investment-portfolio/holding-actions";
import { HoldingMetric } from "@/components/finance/investment-portfolio/holding-metric";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateLabel, investmentAssetClassLabels, investmentInstrumentTypeLabels } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { HoldingsTableDiv2Props } from "@/lib/interfaces/render/holdings-table-holdings-table-div2";
import {
CalendarDays,
Coins,
Plus,
} from "lucide-react";

export function HoldingsTableDiv2({ dashboard, onEdit, onAllocate, onArchive, onEditAllocation, onCreate }: HoldingsTableDiv2Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
<div className="space-y-3 px-4 pb-4 md:hidden">
          {dashboard.holdings.length ? (
            dashboard.holdings.map((holding) => (
              <article key={holding.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p data-user-content className="truncate text-lg font-semibold text-content-strong">
                      {holding.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-content">
                      {holding.ticker ? <span data-user-content>{holding.ticker}</span> : "Sem ticker"}
                      {holding.institutionName ? <> · <span data-user-content>{holding.institutionName}</span></> : ""}
                    </p>
                  </div>
                  <HoldingActions
                    holding={holding}
                    onEdit={() => onEdit(holding)}
                    onAllocate={() => onAllocate(holding)}
                    onArchive={() => onArchive(holding)}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-brand/20 text-brand">
                    {investmentAssetClassLabels[holding.assetClass]}
                  </Badge>
                  <Badge variant="outline" className="border-input text-content">
                    {investmentInstrumentTypeLabels[holding.instrumentType]}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <HoldingMetric label="Atual" value={formatCurrency(holding.currentValueCents)} />
                  <HoldingMetric label="Alocado" value={formatCurrency(holding.allocatedCents)} />
                  <HoldingMetric label="Livre" value={formatCurrency(holding.freeValueCents)} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-content">
                  <CalendarDays className="size-3.5" />
                  Valor informado em {formatDateLabel(holding.valueAsOf)}
                </div>
                {holding.allocations.length ? (
                  <div className="mt-3 space-y-1.5 border-t border-border/80 pt-3">
                    {holding.allocations.map((allocation) => (
                      <button
                        key={allocation.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-3 text-left text-xs"
                        title="Editar alocação"
                        onClick={() => onEditAllocation(allocation)}
                      >
                        <span className="flex min-w-0 items-center gap-1.5 truncate text-content">
                          <span
                            className="size-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: allocation.purposeColor }}
                          />
                          {allocation.purposeName}
                        </span>
                        <span className="shrink-0 text-warning">
                          {formatCurrency(allocation.amountCents)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-input px-5 py-10 text-center">
              <Coins className="mx-auto size-7 text-content-subtle" />
              <p className="mt-3 text-lg font-semibold text-content-strong">
                Nenhuma posição cadastrada
              </p>
              <Button type="button" variant="outline" className="mt-4" onClick={onCreate}>
                <Plus className="size-4" />
                Cadastrar ativo
              </Button>
            </div>
          )}
        </div>
  );
}
