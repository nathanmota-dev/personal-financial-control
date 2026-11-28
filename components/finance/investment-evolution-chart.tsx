"use client";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { InvestmentEvolutionChartPlot } from "@/components/finance/investment-evolution-chart-plot";
import { InvestmentHistoryPeriodControl } from "@/components/finance/investment-history-period-control";
import { InvestmentHistoryStat } from "@/components/finance/investment-history-stat";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { InvestmentEvolutionChartProps } from "@/lib/interfaces/investment-history";
import { formatSignedPercent } from "@/lib/utils/components/investment-history";

export function InvestmentEvolutionChart({ points, summary, period, onPeriodChange }: InvestmentEvolutionChartProps) {
  const { formatCurrency } = useFinancialFormatter();
  const tone = summary.gainCents < 0 ? "negative" : "positive";
  const since = points[0] ? formatMonthLabel(points[0].month) : "";
  return (
    <section aria-label="Evolução do patrimônio" className="relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src="/images/evolution-chart.webp" />
      <div className="flex flex-col gap-4 pr-16 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold leading-[25px] text-content-strong">Evolução do patrimônio</h2>
          <p className="mt-1 text-xs text-content-muted">Soma das posições cadastradas, do banco e manuais, contra o capital aplicado desde {since}. A distância entre as linhas é o rendimento.</p>
        </div>
        <InvestmentHistoryPeriodControl value={period} onChange={onPeriodChange} />
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <InvestmentHistoryStat label="Patrimônio" value={formatCurrency(summary.valueCents)} tone="brand" />
        <InvestmentHistoryStat label="Capital aplicado" value={formatCurrency(summary.investedCents)} detail="Saldo inicial + aportes líquidos" tone="contrast" />
        <InvestmentHistoryStat label="Rendimento" value={formatCurrency(summary.gainCents)} tone={tone} />
        <InvestmentHistoryStat label="Rentabilidade" value={formatSignedPercent(summary.cumulativeRate)} detail="Ponderada no tempo" tone={tone} />
      </dl>
      <InvestmentEvolutionChartPlot points={points} />
      <p className="mt-3 text-[11px] leading-4 text-content-subtle">Posições do banco usam os aportes e resgates lançados; posições manuais usam as operações registradas. Sem operações, o valor inicial de uma posição manual conta como aporte e as mudanças seguintes, como rendimento.</p>
    </section>
  );
}
