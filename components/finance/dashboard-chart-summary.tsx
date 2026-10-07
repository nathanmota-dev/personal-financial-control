"use client";

import type { DashboardChartSummaryProps } from "@/lib/interfaces/dashboard";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";

export function DashboardChartSummary({ summary }: DashboardChartSummaryProps) {
  const { formatCurrency, protect } = useFinancialFormatter();
  const comparison = summary.balanceComparison;
  const tone = comparison.tone === "positive" ? "text-success" : comparison.tone === "negative" ? "text-danger" : "text-content-subtle";
  return (<>
    <div className="mt-[33px] min-[100.0625rem]:mt-5">
      <h3 className="text-sm font-semibold">Resultado acumulado {summary.resultLabel}</h3>
      <p className="mt-[10px] min-h-[40px] text-[13px] leading-[19px] text-content">
        Saldo livre: {protect(comparison.description)}. O resultado acumulado nos seis meses exibidos é de {formatCurrency(summary.accumulatedCents)}.
      </p>
    </div>
    <div className="mt-[22px] grid grid-cols-2 gap-6 border-t border-border pt-[24px] min-[100.0625rem]:mt-4 min-[100.0625rem]:pt-4">
      <div>
        <p className="text-xs text-content-muted">Média mensal de receitas</p>
        <p className="mt-2 text-xl font-semibold">{formatCurrency(summary.averageIncomeCents)}</p>
      </div>
      <div>
        <p className="text-xs text-content-muted">Variação do saldo no mês</p>
        <p className={`mt-2 text-xl font-semibold ${tone}`}>{protect(comparison.valueLabel)}</p>
      </div>
    </div>
  </>);
}
