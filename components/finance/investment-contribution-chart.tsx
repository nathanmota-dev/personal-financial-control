"use client";

import { ArrowDownToLine } from "lucide-react";
import { InvestmentContributionChartChartContainer1 } from "./investment-contribution-chart-investment-contribution-chart-chart-container1";

import { InvestmentHistoryMetric } from "@/components/finance/investment-history-metric";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { formatMonthLabel } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { InvestmentContributionChartProps } from "@/lib/interfaces/investments";

export function InvestmentContributionChart({
  history,
}: InvestmentContributionChartProps) {
  const { formatCurrency } = useFinancialFormatter();
  const data = history.points.map((point) => ({
    ...point,
    monthlyContribution: point.monthlyContributionCents / 100,
    monthlyWithdrawal: point.monthlyWithdrawalCents / 100,
    cumulativeNetMovement: point.cumulativeNetMovementCents / 100,
  }));
  const latestPoint = history.points.at(-1);
  const netMovementCents = history.totalContributionCents - history.totalWithdrawalCents;

  return (
    <section className="relative flex h-full min-w-0 flex-col rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/evolution-chart.webp" />
      <h2 className="text-lg font-semibold leading-[25px]">Aportes e resgates</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">Histórico dos lançamentos realizados, sem misturar rendimento estimado</p>
      <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-3">
        <InvestmentHistoryMetric label="Total aportado" value={formatCurrency(history.totalContributionCents)} tone="cyan" />
        <InvestmentHistoryMetric label="Total resgatado" value={formatCurrency(history.totalWithdrawalCents)} detail={latestPoint ? formatMonthLabel(latestPoint.month) : "Sem registros"} tone="amber" />
        <InvestmentHistoryMetric label="Movimentação líquida" value={formatCurrency(netMovementCents)} tone="sky" />
      </dl>
      {data.length ? (
        <InvestmentContributionChartChartContainer1 data={data} />
      ) : (
        <div className="mt-5 flex min-h-[280px] flex-1 flex-col items-center justify-center rounded-xl bg-[var(--chart-surface)] px-6 text-center">
          <ArrowDownToLine aria-hidden className="size-6 text-primary" />
          <p className="mt-3 text-sm font-semibold text-content-strong">Nenhuma movimentação realizada</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-content">Cadastre aportes ou resgates na tela de Lançamentos para acompanhar o capital em movimento.</p>
        </div>
      )}
    </section>
  );
}
