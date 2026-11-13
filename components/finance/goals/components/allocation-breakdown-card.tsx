"use client";

import { Cell, Pie, PieChart } from "recharts";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { ALLOCATION_BREAKDOWN_CHART_CONFIG } from "../goals-constants";
import type { AllocationBreakdownCardProps } from "../goals-types";

const chartClassName = "aspect-square size-[180px] shrink-0";

export function AllocationBreakdownCard({
  dashboard,
}: AllocationBreakdownCardProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const data = dashboard.charts.allocationBreakdown
    .filter((item) => item.amountCents > 0)
    .map((item) => ({ ...item, amount: item.amountCents / 100 }));
  const totalCents = data.reduce((sum, item) => sum + item.amountCents, 0);

  return (
    <section className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/expenses-pie.webp" />
      <h2 className="text-lg font-semibold leading-[25px]">Divisão da carteira</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">Metas visíveis e reserva livre</p>
      {totalCents > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-5">
          <div className="relative mx-auto shrink-0">
            {hidden ? (
              <div data-slot="chart" className={chartClassName} />
            ) : (
              <ChartContainer className={chartClassName} config={ALLOCATION_BREAKDOWN_CHART_CONFIG}>
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, item) => (
                          <>
                            <span data-user-content className="text-content">{String(item.payload.name)}</span>
                            <strong>{formatCurrency(Number(value) * 100)}</strong>
                          </>
                        )}
                      />
                    }
                  />
                  <Pie
                    isAnimationActive={false}
                    data={data}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius="57%"
                    outerRadius="89%"
                    paddingAngle={3}
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {data.map((item) => <Cell key={item.id} fill={item.color} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-[11px] text-content-muted">Total</span>
              <span className="text-[13px] font-[650]">{formatCurrency(totalCents)}</span>
            </div>
          </div>
          <ul className="min-w-[140px] flex-1 space-y-3">
            {data.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-xs">
                <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span data-user-content className="min-w-0 flex-1 truncate text-content" title={item.name}>{item.name}</span>
                <span className="font-semibold tabular-nums">{hidden ? "—" : `${Math.round((item.amountCents / totalCents) * 100)}%`}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-8 text-center text-sm text-content-muted">Nenhuma alocação disponível para o gráfico.</p>
      )}
    </section>
  );
}
