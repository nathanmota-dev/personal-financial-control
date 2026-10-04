"use client";

import { InvestmentGrowthChartChartContainer1 } from "./investment-growth-chart-investment-growth-chart-chart-container1";

import { InvestmentGrowthSummaryMetric } from "@/components/finance/investment-growth-summary-metric";
import { formatCurrency,formatRateFromBps } from "@/lib/finance-ui";
import type { InvestmentGrowthChartProps } from "@/lib/interfaces/investments";
import { buildInvestmentGrowthSeries } from "@/lib/investment-projection";

export function InvestmentGrowthChart({
  currentBalanceCents,
  expectedMonthlyRateBps,
  referenceDate,
  movements,
  months,
  periodLabel,
}: InvestmentGrowthChartProps) {
  const data = buildInvestmentGrowthSeries({
    currentBalanceCents,
    expectedMonthlyRateBps,
    referenceDate,
    movements,
    months,
  }).map((point) => ({
    ...point,
    principal: point.principalCents / 100,
    interest: point.interestCents / 100,
    total: point.balanceCents / 100,
  }));
  const finalPoint = data[data.length - 1];
  const finalPrincipalCents = Math.round((finalPoint?.principal ?? 0) * 100);
  const finalInterestCents = Math.round((finalPoint?.interest ?? 0) * 100);
  const finalTotalCents = Math.round((finalPoint?.total ?? 0) * 100);
  const interestShare =
    finalTotalCents > 0
      ? `${Math.round((finalInterestCents / finalTotalCents) * 100)}%`
      : "0%";

  if (!data.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-none">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-content-strong">
            Saldo estimado e movimentações
          </h3>
          <p className="mt-1 text-sm text-content">
            Composição até {periodLabel} com taxa de {formatRateFromBps(expectedMonthlyRateBps)} e os lançamentos previstos.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
          <InvestmentGrowthSummaryMetric
            label="Saldo + movimentos"
            value={formatCurrency(finalPrincipalCents)}
            tone="cyan"
          />
          <InvestmentGrowthSummaryMetric
            label="Rendimento"
            value={formatCurrency(finalInterestCents)}
            tone="amber"
          />
          <InvestmentGrowthSummaryMetric
            label="Peso dos juros"
            value={interestShare}
            tone="emerald"
          />
        </div>
      </div>

      <InvestmentGrowthChartChartContainer1 data={data} />
    </div>
  );
}
