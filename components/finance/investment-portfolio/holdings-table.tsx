"use client";

import {
  CalendarDays,
  Coins,
  Plus,
} from "lucide-react";

import { financePanelClassName } from "@/components/finance/finance-styles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { HoldingsTableProps } from "@/lib/interfaces/investment-portfolio";
import {
  formatCurrency,
  formatDateLabel,
  investmentAssetClassLabels,
  investmentInstrumentTypeLabels,
} from "@/lib/finance-ui";
import { HoldingActions } from "@/components/finance/investment-portfolio/holding-actions";
import { HoldingMetric } from "@/components/finance/investment-portfolio/holding-metric";

export function HoldingsTable({
  dashboard,
  onCreate,
  onEdit,
  onAllocate,
  onEditAllocation,
  onArchive,
}: HoldingsTableProps) {
  return (
    <Card className={financePanelClassName}>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sky-200">
            <Coins className="size-4" />
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]">
              Registro manual
            </span>
          </div>
          <CardTitle className="text-xl text-slate-100">Posições cadastradas</CardTitle>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Informe o valor atual de cada posição. Quantidade, preço médio e cotações automáticas
            ficam fora desta primeira versão.
          </p>
        </div>
        <Button type="button" onClick={onCreate}>
          <Plus className="size-4" />
          Novo ativo
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800/80 hover:bg-transparent">
                <TableHead className="pl-6 text-slate-500">Ativo</TableHead>
                <TableHead className="text-slate-500">Classe / tipo</TableHead>
                <TableHead className="text-right text-slate-500">Atual</TableHead>
                <TableHead className="text-right text-slate-500">Alocado</TableHead>
                <TableHead className="text-right text-slate-500">Livre</TableHead>
                <TableHead className="text-slate-500">Valor em</TableHead>
                <TableHead className="pr-6 text-right text-slate-500">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.holdings.length ? (
                dashboard.holdings.map((holding) => (
                  <TableRow key={holding.id} className="border-slate-800/70 hover:bg-slate-900/45">
                    <TableCell className="max-w-[230px] pl-6">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-100">{holding.name}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {holding.ticker || "Sem ticker"}
                          {holding.institutionName ? " · " + holding.institutionName : ""}
                        </p>
                        {holding.allocations.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {holding.allocations.map((allocation) => (
                              <button
                                key={allocation.id}
                                type="button"
                                className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[0.68rem] text-slate-400 transition hover:border-cyan-300/30 hover:text-cyan-200"
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
                        <Badge variant="outline" className="border-cyan-300/20 text-cyan-200">
                          {investmentAssetClassLabels[holding.assetClass]}
                        </Badge>
                        <p className="text-xs text-slate-500">
                          {investmentInstrumentTypeLabels[holding.instrumentType]}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-100">
                      {formatCurrency(holding.currentValueCents)}
                    </TableCell>
                    <TableCell className="text-right text-teal-200">
                      {formatCurrency(holding.allocatedCents)}
                    </TableCell>
                    <TableCell className="text-right text-slate-300">
                      {formatCurrency(holding.freeValueCents)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-slate-400">
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
                    <Coins className="mx-auto size-7 text-slate-600" />
                    <p className="mt-3 font-heading text-lg font-semibold text-slate-200">
                      Nenhuma posição cadastrada
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Comece pelo ativo com maior impacto no seu patrimônio.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 px-4 pb-4 md:hidden">
          {dashboard.holdings.length ? (
            dashboard.holdings.map((holding) => (
              <article key={holding.id} className="rounded-2xl border border-slate-800 bg-slate-900/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-lg font-semibold text-slate-100">
                      {holding.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {holding.ticker || "Sem ticker"}
                      {holding.institutionName ? " · " + holding.institutionName : ""}
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
                  <Badge variant="outline" className="border-cyan-300/20 text-cyan-200">
                    {investmentAssetClassLabels[holding.assetClass]}
                  </Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    {investmentInstrumentTypeLabels[holding.instrumentType]}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <HoldingMetric label="Atual" value={formatCurrency(holding.currentValueCents)} />
                  <HoldingMetric label="Alocado" value={formatCurrency(holding.allocatedCents)} />
                  <HoldingMetric label="Livre" value={formatCurrency(holding.freeValueCents)} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays className="size-3.5" />
                  Valor informado em {formatDateLabel(holding.valueAsOf)}
                </div>
                {holding.allocations.length ? (
                  <div className="mt-3 space-y-1.5 border-t border-slate-800/80 pt-3">
                    {holding.allocations.map((allocation) => (
                      <button
                        key={allocation.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-3 text-left text-xs"
                        title="Editar alocação"
                        onClick={() => onEditAllocation(allocation)}
                      >
                        <span className="flex min-w-0 items-center gap-1.5 truncate text-slate-400">
                          <span
                            className="size-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: allocation.purposeColor }}
                          />
                          {allocation.purposeName}
                        </span>
                        <span className="shrink-0 text-teal-200">
                          {formatCurrency(allocation.amountCents)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 px-5 py-10 text-center">
              <Coins className="mx-auto size-7 text-slate-600" />
              <p className="mt-3 font-heading text-lg font-semibold text-slate-200">
                Nenhuma posição cadastrada
              </p>
              <Button type="button" variant="outline" className="mt-4" onClick={onCreate}>
                <Plus className="size-4" />
                Cadastrar ativo
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
