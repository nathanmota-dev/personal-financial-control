"use client";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { InvestmentHistoryEmpty } from "@/components/finance/investment-history-empty";
import { InvestmentHistoryStat } from "@/components/finance/investment-history-stat";
import { InvestmentMonthlyReturnChartPlot } from "@/components/finance/investment-monthly-return-chart-plot";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { InvestmentMonthlyReturnChartProps } from "@/lib/interfaces/investment-history";

export function InvestmentMonthlyReturnChart({ points, summary }: InvestmentMonthlyReturnChartProps) {
  const { formatCurrency } = useFinancialFormatter();
  const months = points.slice(1);
  const { best, worst } = summary;
  return (
    <section aria-label="Rendimento mensal" className="relative flex h-full min-w-0 flex-col rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src="/images/calculators-compound-interest.webp" />
      <h2 className="text-lg font-semibold leading-[25px] text-content-strong">Rendimento mensal</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">Quanto as posições renderam em cada mês, sem os aportes e resgates.</p>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <InvestmentHistoryStat label="Média por mês" value={formatCurrency(summary.averageGainCents)} tone={summary.averageGainCents < 0 ? "negative" : "positive"} />
        <InvestmentHistoryStat label="Melhor mês" value={best ? formatCurrency(best.gainCents) : "—"} detail={best ? formatMonthLabel(best.month) : undefined} tone="positive" />
        <InvestmentHistoryStat label="Pior mês" value={worst ? formatCurrency(worst.gainCents) : "—"} detail={worst ? formatMonthLabel(worst.month) : undefined} tone={worst && worst.gainCents < 0 ? "negative" : "neutral"} />
      </dl>
      {months.length ? (
        <InvestmentMonthlyReturnChartPlot points={months} />
      ) : (
        <InvestmentHistoryEmpty title="Ainda sem meses completos" description="O rendimento aparece a partir do segundo mês de histórico." />
      )}
    </section>
  );
}
