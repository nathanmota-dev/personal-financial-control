"use client";

import { DashboardCategoryCharts } from "@/components/finance/dashboard-category-charts";
import { formatCurrency } from "@/lib/finance-ui";
import type { DashboardChartsProps } from "@/lib/interfaces/dashboard";
import { series } from "@/lib/utils/components/dashboard-charts";
import { DashboardChartsChartContainer1 } from "./dashboard-charts-dashboard-charts-chart-container1";
export function DashboardCharts({
  evolution,
  categorySpending,
}: DashboardChartsProps) {
  const average = evolution.length
    ? evolution.reduce((sum, item) => sum + item.income, 0) / evolution.length
    : 0;
  const first = evolution[0]?.net ?? 0;
  const last = evolution.at(-1)?.net ?? 0;
  const variation = first ? ((last - first) / Math.abs(first)) * 100 : null;
  const accumulated = evolution.reduce((sum, item) => sum + item.net, 0);
  const variationLabel =
    variation === null
      ? "—"
      : `${variation > 0 ? "+" : ""}${variation.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,658fr)_minmax(0,436fr)]">
      <section className="min-w-0 rounded-[20px] border border-border bg-card p-[23px] xl:h-[704px]">
        <h2 className="text-xl leading-[27px] font-semibold">
          Evolução mensal
        </h2>
        <p className="mt-1 text-[13px] text-content-muted">
          Receita, saídas e resultado dos últimos meses
        </p>
        <div className="mt-[18px] grid grid-cols-2 gap-3 sm:grid-cols-4">
          {series.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-[7px] text-[11px] text-content"
            >
              <svg width="9" height="9">
                <circle cx="4.5" cy="4.5" r="4.5" fill={item.color} />
              </svg>
              {item.label}
            </div>
          ))}
        </div>
        <DashboardChartsChartContainer1 evolution={evolution} />
        <div className="mt-[33px]">
          <h3 className="text-sm font-semibold">
            Resultado acumulado {accumulated >= 0 ? "positivo" : "negativo"}
          </h3>
          <p className="mt-[10px] min-h-[40px] text-[13px] leading-[19px] text-content">
            {variation === null
              ? "Acompanhe a evolução das receitas, despesas e investimentos ao longo dos meses."
              : `O saldo livre ${variation >= 0 ? "cresceu" : "diminuiu"} ${Math.abs(variation).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% nos últimos ${evolution.length} meses. O resultado acumulado no período é de ${formatCurrency(accumulated * 100)}.`}
          </p>
        </div>
        <div className="mt-[22px] grid grid-cols-2 gap-6 border-t border-border pt-[24px]">
          <div>
            <p className="text-xs text-content-muted">
              Média mensal de receitas
            </p>
            <p className="mt-2 text-xl font-semibold">
              {formatCurrency(average * 100)}
            </p>
          </div>
          <div>
            <p className="text-xs text-content-muted">Variação do saldo</p>
            <p className="mt-2 text-xl font-semibold text-brand">
              {variationLabel}
            </p>
          </div>
        </div>
      </section>
      <DashboardCategoryCharts categorySpending={categorySpending} />
    </div>
  );
}
