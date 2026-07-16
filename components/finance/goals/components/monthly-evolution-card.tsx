"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from "recharts";

import { financeChartSurfaceClassName } from "@/components/finance/finance-styles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency, formatMonthLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import {
  COMPACT_CURRENCY_FORMATTER,
  MONTHLY_EVOLUTION_CHART_CONFIG,
} from "../goals-constants";
import type { MonthlyEvolutionCardProps } from "../goals-types";

export function MonthlyEvolutionCard({ dashboard }: MonthlyEvolutionCardProps) {
  const data = dashboard.charts.monthlyEvolution.map((point) => ({
    month: point.month,
    allocated: point.monthlyAllocatedCents / 100,
    released: point.monthlyReleasedCents / 100,
    cumulative: point.cumulativeAllocatedCents / 100,
  }));

  return (
    <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
      <CardHeader>
        <CardTitle>Evolução mensal</CardTitle>
        <p className="text-sm text-slate-400">Alocações, liberações e acumulado.</p>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer
            className={cn(financeChartSurfaceClassName, "h-[280px] w-full")}
            config={MONTHLY_EVOLUTION_CHART_CONFIG}
          >
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickFormatter={(value) => formatMonthLabel(String(value))}
                minTickGap={22}
              />
              <YAxis
                width={72}
                tickFormatter={(value) =>
                  COMPACT_CURRENCY_FORMATTER.format(Number(value))
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatMonthLabel(String(value))}
                    formatter={(value, name) => (
                      <>
                        <span className="text-muted-foreground">{String(name)}</span>
                        <span>{formatCurrency(Number(value) * 100)}</span>
                      </>
                    )}
                  />
                }
              />
              <Bar
                dataKey="allocated"
                name="Alocado"
                fill="var(--color-allocated)"
                radius={[6, 6, 2, 2]}
                maxBarSize={28}
              />
              <Bar
                dataKey="released"
                name="Liberado"
                fill="var(--color-released)"
                fillOpacity={0.7}
                radius={[6, 6, 2, 2]}
                maxBarSize={28}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Acumulado"
                fill="var(--color-cumulative)"
                fillOpacity={0.14}
                stroke="var(--color-cumulative)"
                strokeWidth={2.5}
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="flex min-h-[280px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-800 bg-slate-900/35 px-6 text-center text-sm text-slate-400">
            Alocações e aportes aparecerão aqui ao longo dos meses.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
