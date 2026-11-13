"use client";

import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatMonthLabel } from "@/lib/finance-ui";

import { COMPACT_CURRENCY_FORMATTER, MONTHLY_EVOLUTION_CHART_CONFIG } from "../goals-constants";
import type { MonthlyEvolutionChartProps } from "../goals-types";

export function MonthlyEvolutionChart({ data }: MonthlyEvolutionChartProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <ChartContainer
      className="mt-[17px] min-h-[280px] w-full flex-1 rounded-xl bg-[var(--chart-surface)]"
      config={MONTHLY_EVOLUTION_CHART_CONFIG}
    >
      <ComposedChart
        data={data}
        margin={{ top: 30, right: 29, bottom: 8, left: 0 }}
      >
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tickMargin={16}
          fontSize={10}
          stroke="var(--content-subtle)"
          tickFormatter={(value) => formatMonthLabel(String(value))}
          minTickGap={22}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tickCount={5}
          fontSize={10}
          stroke="var(--content-subtle)"
          width={64}
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
                  <span className="text-content">{String(name)}</span>
                  <strong>{formatCurrency(Number(value) * 100)}</strong>
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
          isAnimationActive={false}
        />
        <Bar
          dataKey="released"
          name="Liberado"
          fill="var(--color-released)"
          radius={[6, 6, 2, 2]}
          maxBarSize={28}
          isAnimationActive={false}
        />
        <Area
          type="linear"
          dataKey="cumulative"
          name="Acumulado"
          fill="none"
          stroke="var(--color-cumulative)"
          strokeWidth={2}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
