"use client";

import { InvestmentGrowthChartChartContainer1 } from "./investment-growth-chart-investment-growth-chart-chart-container1";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { InvestmentGrowthSummaryMetric } from "@/components/finance/investment-growth-summary-metric";
import { formatRateFromBps } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
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
  const { formatCurrency } = useFinancialFormatter();
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
    <section className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/reports-growth-bars.webp" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="pr-16 lg:pr-0">
          <h2 className="text-lg font-semibold leading-[25px]">Saldo estimado e movimentações</h2>
          <p className="mt-1 text-xs text-content-muted">
            Composição até {periodLabel} com taxa de {formatRateFromBps(expectedMonthlyRateBps)} e os lançamentos previstos.
          </p>
        </div>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3 lg:mr-20 lg:min-w-[420px]">
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
        </dl>
      </div>

      <InvestmentGrowthChartChartContainer1 data={data} />
    </section>
  );
}
