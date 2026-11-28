"use client";

import { useState } from "react";

import { InvestmentBenchmarkChart } from "@/components/finance/investment-benchmark-chart";
import { InvestmentEvolutionChart } from "@/components/finance/investment-evolution-chart";
import { InvestmentHistoryEmpty } from "@/components/finance/investment-history-empty";
import { InvestmentMonthlyReturnChart } from "@/components/finance/investment-monthly-return-chart";
import type { InvestmentHistoryPeriod, InvestmentHistorySectionProps } from "@/lib/interfaces/investment-history";
import { buildBenchmarkPoints, sliceInvestmentHistory, summarizeInvestmentHistory } from "@/lib/investment-history";

export function InvestmentHistorySection({ history }: InvestmentHistorySectionProps) {
  const [period, setPeriod] = useState<InvestmentHistoryPeriod>("12m");
  if (history.points.length < 2) {
    return (
      <section aria-label="Evolução do patrimônio" className="relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
        <h2 className="text-lg font-semibold leading-[25px] text-content-strong">Evolução do patrimônio</h2>
        <p className="mt-1 text-xs text-content-muted">Patrimônio, rendimento mensal e comparação com CDI, IPCA e Ibovespa.</p>
        <InvestmentHistoryEmpty title="Histórico em formação" description="O histórico é registrado a cada sincronização do banco ou atualização de valor. Os gráficos aparecem a partir do segundo mês." />
      </section>
    );
  }
  const points = sliceInvestmentHistory(history.points, period);
  const summary = summarizeInvestmentHistory(points);
  return (
    <div className="space-y-6 min-[100.0625rem]:space-y-5">
      <InvestmentEvolutionChart points={points} summary={summary} period={period} onPeriodChange={setPeriod} />
      <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-2">
        <InvestmentMonthlyReturnChart points={points} summary={summary} />
        <InvestmentBenchmarkChart points={buildBenchmarkPoints(points, history.benchmarks)} benchmarks={history.benchmarks} />
      </div>
    </div>
  );
}
