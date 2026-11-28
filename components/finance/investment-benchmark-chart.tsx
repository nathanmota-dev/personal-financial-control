"use client";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { InvestmentBenchmarkChartPlot } from "@/components/finance/investment-benchmark-chart-plot";
import { InvestmentHistoryEmpty } from "@/components/finance/investment-history-empty";
import { InvestmentHistoryStat } from "@/components/finance/investment-history-stat";
import type { InvestmentBenchmarkChartProps } from "@/lib/interfaces/investment-history";
import { availableBenchmarks, shareOfCdi } from "@/lib/investment-history";
import { formatShare, formatSignedPercent, INVESTMENT_BENCHMARK_LABELS } from "@/lib/utils/components/investment-history";

export function InvestmentBenchmarkChart({ points, benchmarks }: InvestmentBenchmarkChartProps) {
  const available = availableBenchmarks(benchmarks);
  const last = points.at(-1);
  const cdiShare = shareOfCdi(last);
  const missing = (["cdi", "ipca", "ibov"] as const).filter((key) => !available.includes(key)).map((key) => INVESTMENT_BENCHMARK_LABELS[key]);
  return (
    <section aria-label="Rentabilidade vs índices" className="relative flex h-full min-w-0 flex-col rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src="/images/projected-balance-trend.webp" />
      <h2 className="text-lg font-semibold leading-[25px] text-content-strong">Rentabilidade vs índices</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">Retorno acumulado da carteira, ponderado no tempo, contra CDI, IPCA e Ibovespa no mesmo período.</p>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <InvestmentHistoryStat label="Carteira" value={last ? formatSignedPercent(last.portfolio) : "—"} tone={last && last.portfolio < 0 ? "negative" : "brand"} />
        <InvestmentHistoryStat label="CDI" value={last?.cdi != null ? formatSignedPercent(last.cdi) : "—"} tone="contrast" />
        <InvestmentHistoryStat label="% do CDI" value={cdiShare !== null ? formatShare(cdiShare) : "—"} tone={cdiShare !== null && cdiShare >= 1 ? "positive" : "neutral"} />
      </dl>
      {points.length > 1 ? (
        <InvestmentBenchmarkChartPlot points={points} available={available} />
      ) : (
        <InvestmentHistoryEmpty title="Ainda sem meses para comparar" description="A comparação aparece a partir do segundo mês de histórico." />
      )}
      {missing.length && points.length > 1 ? <p role="status" className="mt-3 text-[11px] text-content-subtle">Índices indisponíveis no momento: {missing.join(", ")}.</p> : null}
    </section>
  );
}
