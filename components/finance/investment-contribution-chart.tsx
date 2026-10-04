"use client";

import { ArrowDownToLine,ArrowUpFromLine,WalletCards } from "lucide-react";
import { InvestmentContributionChartChartContainer1 } from "./investment-contribution-chart-investment-contribution-chart-chart-container1";

import { InvestmentHistoryMetric } from "@/components/finance/investment-history-metric";
import { Card,CardContent,CardHeader } from "@/components/ui/card";
import { formatCurrency,formatMonthLabel } from "@/lib/finance-ui";
import type { InvestmentContributionChartProps } from "@/lib/interfaces/investments";

export function InvestmentContributionChart({
  history,
}: InvestmentContributionChartProps) {
  const data = history.points.map((point) => ({
    ...point,
    monthlyContribution: point.monthlyContributionCents / 100,
    monthlyWithdrawal: point.monthlyWithdrawalCents / 100,
    cumulativeNetMovement: point.cumulativeNetMovementCents / 100,
  }));
  const latestPoint = history.points.at(-1);
  const netMovementCents = history.totalContributionCents - history.totalWithdrawalCents;

  return (
    <Card className="h-full overflow-hidden rounded-[20px] border-border bg-card shadow-none">
      <CardHeader className="border-b border-border/80 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-brand">
              <WalletCards className="size-4" />
              <span className="text-[0.68rem] font-semibold">
                Movimentações reais
              </span>
            </div>
            <h2 className="text-xl font-semibold text-content-strong">
              Aportes e resgates
            </h2>
            <p className="mt-1 text-sm leading-6 text-content">
              Histórico dos lançamentos realizados, sem misturar rendimento estimado.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-brand/15 bg-brand/8 px-3 py-2 text-xs text-brand">
            <ArrowUpFromLine className="size-3.5" />
            <span>Ligado a Lançamentos</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <InvestmentHistoryMetric
            label="Total aportado"
            value={formatCurrency(history.totalContributionCents)}
            tone="cyan"
          />
          <InvestmentHistoryMetric
            label="Total resgatado"
            value={formatCurrency(history.totalWithdrawalCents)}
            detail={latestPoint ? formatMonthLabel(latestPoint.month) : "Sem registros"}
            tone="amber"
          />
          <InvestmentHistoryMetric
            label="Movimentação líquida"
            value={formatCurrency(netMovementCents)}
            tone="sky"
          />
        </div>

        {data.length ? (
          <InvestmentContributionChartChartContainer1 data={data} />
        ) : (
          <div className="flex min-h-[330px] flex-col items-center justify-center rounded-[20px] border border-dashed border-input bg-card px-6 text-center">
            <div className="rounded-full border border-brand/15 bg-brand/10 p-3 text-brand">
              <ArrowDownToLine className="size-6" />
            </div>
            <p className="mt-4 text-lg font-semibold text-content-strong">
              Nenhuma movimentação realizada
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-content">
              Cadastre aportes ou resgates na tela de Lançamentos para acompanhar o capital em movimento.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
