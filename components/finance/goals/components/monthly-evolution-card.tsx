"use client";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";

import { MONTHLY_EVOLUTION_CHART_CONFIG } from "../goals-constants";
import type { MonthlyEvolutionCardProps } from "../goals-types";
import { MonthlyEvolutionChart } from "./monthly-evolution-chart";

export function MonthlyEvolutionCard({ dashboard }: MonthlyEvolutionCardProps) {
  const data = dashboard.charts.monthlyEvolution.map((point) => ({
    month: point.month,
    allocated: point.monthlyAllocatedCents / 100,
    released: point.monthlyReleasedCents / 100,
    cumulative: point.cumulativeAllocatedCents / 100,
  }));

  return (
    <section className="relative flex min-w-0 flex-col rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/evolution-chart.webp" />
      <h2 className="text-lg font-semibold leading-[25px]">Evolução mensal</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">Alocações, liberações e acumulado</p>
        {data.length ? (
          <>
          <div className="mt-[18px] flex flex-wrap gap-x-5 gap-y-2">
            {Object.entries(MONTHLY_EVOLUTION_CHART_CONFIG).map(([key, item]) => (
              <span key={key} className="flex items-center gap-[7px] text-[11px] text-content">
                <svg width="9" height="9" aria-hidden="true"><circle cx="4.5" cy="4.5" r="4.5" fill={item.color} /></svg>
                {item.label}
              </span>
            ))}
          </div>
          <MonthlyEvolutionChart data={data} />
          </>
        ) : (
          <p className="mt-8 text-center text-sm text-content-muted">
            Alocações e aportes aparecerão aqui ao longo dos meses.
          </p>
        )}
    </section>
  );
}
