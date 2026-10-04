"use client";

import { HoldingActions } from "@/components/finance/investment-portfolio/holding-actions";
import { Badge } from "@/components/ui/badge";
import {
TableBody,
TableCell,
TableRow
} from "@/components/ui/table";
import {
formatCurrency,
formatDateLabel,
investmentAssetClassLabels,
investmentInstrumentTypeLabels,
} from "@/lib/finance-ui";
import type { HoldingsTableTableBody1Props } from "@/lib/interfaces/render/holdings-table-holdings-table-table-body1";
import {
Coins
} from "lucide-react";

export function HoldingsTableTableBody1({ dashboard, onEditAllocation, onEdit, onAllocate, onArchive }: HoldingsTableTableBody1Props) {
  return (
<TableBody>
              {dashboard.holdings.length ? (
                dashboard.holdings.map((holding) => (
                  <TableRow key={holding.id} className="border-border/70 hover:bg-card">
                    <TableCell className="max-w-[230px] pl-6">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-content-strong">{holding.name}</p>
                        <p className="mt-1 truncate text-xs text-content">
                          {holding.ticker || "Sem ticker"}
                          {holding.institutionName ? " · " + holding.institutionName : ""}
                        </p>
                        {holding.allocations.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {holding.allocations.map((allocation) => (
                              <button
                                key={allocation.id}
                                type="button"
                                className="inline-flex items-center gap-1 rounded-full border border-input bg-surface-raised px-2 py-1 text-[0.68rem] text-content transition hover:border-brand/30 hover:text-brand"
                                title="Editar alocação"
                                onClick={() => onEditAllocation(allocation)}
                              >
                                <span
                                  className="size-1.5 rounded-full"
                                  style={{ backgroundColor: allocation.purposeColor }}
                                />
                                {allocation.purposeName}: {formatCurrency(allocation.amountCents)}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="border-brand/20 text-brand">
                          {investmentAssetClassLabels[holding.assetClass]}
                        </Badge>
                        <p className="text-xs text-content">
                          {investmentInstrumentTypeLabels[holding.instrumentType]}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-content-strong">
                      {formatCurrency(holding.currentValueCents)}
                    </TableCell>
                    <TableCell className="text-right text-warning">
                      {formatCurrency(holding.allocatedCents)}
                    </TableCell>
                    <TableCell className="text-right text-content">
                      {formatCurrency(holding.freeValueCents)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-content">
                      {formatDateLabel(holding.valueAsOf)}
                    </TableCell>
                    <TableCell className="pr-6">
                      <HoldingActions
                        holding={holding}
                        onEdit={() => onEdit(holding)}
                        onAllocate={() => onAllocate(holding)}
                        onArchive={() => onArchive(holding)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="px-6 py-12 text-center">
                    <Coins className="mx-auto size-7 text-content-subtle" />
                    <p className="mt-3 text-lg font-semibold text-content-strong">
                      Nenhuma posição cadastrada
                    </p>
                    <p className="mt-1 text-sm text-content">
                      Comece pelo ativo com maior impacto no seu patrimônio.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
  );
}
