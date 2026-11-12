"use client";
import { DashboardCategoryCharts } from "@/components/finance/dashboard-category-charts";
import { DashboardEvolutionChart } from "@/components/finance/dashboard-evolution-chart";
import { DashboardChartSummary } from "@/components/finance/dashboard-chart-summary";
import type { DashboardChartsProps } from "@/lib/interfaces/dashboard";

export function DashboardCharts({ evolution, categorySpending, summary }: DashboardChartsProps) {
  return (
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,658fr)_minmax(0,436fr)]">
      <section className="min-w-0 rounded-[20px] border border-border bg-card p-[23px] xl:h-[704px] min-[100.0625rem]:h-[600px] min-[100.0625rem]:p-5">
        <h2 className="text-xl leading-[27px] font-semibold">Evolução mensal</h2>
        <p className="mt-1 text-[13px] text-content-muted">Receita, saídas e resultado dos últimos meses</p>
        <DashboardEvolutionChart evolution={evolution} />
        <DashboardChartSummary summary={summary} />
      </section>
      <DashboardCategoryCharts categorySpending={categorySpending} />
    </div>
  );
}
