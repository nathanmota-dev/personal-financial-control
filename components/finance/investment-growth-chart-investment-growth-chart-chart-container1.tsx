"use client";

import {
ChartContainer,
ChartLegend,
ChartLegendContent,
ChartTooltip,
ChartTooltipContent,
} from "@/components/ui/chart";
import { formatMonthLabel } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { InvestmentGrowthChartChartContainer1Props } from "@/lib/interfaces/render/investment-growth-chart-investment-growth-chart-chart-container1";
import { formatAxisCurrency } from "@/lib/utils/components/investment-growth-chart";
import {
Area,
AreaChart,
CartesianGrid,
XAxis,
YAxis,
} from "recharts";

export function InvestmentGrowthChartChartContainer1({ data }: InvestmentGrowthChartChartContainer1Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
<ChartContainer
        className="mt-5 h-[380px] w-full rounded-xl bg-[var(--chart-surface)] min-[100.0625rem]:h-[320px]"
        config={{
          principal: { label: "Saldo + movimentos", color: "var(--chart-1)" },
          interest: { label: "Rendimento estimado", color: "var(--chart-2)" },
        }}
      >
        <AreaChart data={data} margin={{ top: 30, right: 29, bottom: 8, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="competenceMonth"
            axisLine={false}
            tickLine={false}
            tickMargin={16}
            fontSize={10}
            stroke="var(--content-subtle)"
            minTickGap={30}
            tickFormatter={(value) => formatMonthLabel(String(value))}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickCount={5}
            fontSize={10}
            stroke="var(--content-subtle)"
            width={72}
            tickFormatter={(value) => formatAxisCurrency(Number(value))}
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
          <ChartLegend content={<ChartLegendContent className="text-[11px] text-content" />} />
          <Area
            type="linear"
            dataKey="principal"
            name="Saldo + movimentos"
            stackId="growth"
            fill="var(--color-principal)"
            fillOpacity={0.18}
            stroke="var(--color-principal)"
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area
            type="linear"
            dataKey="interest"
            name="Rendimento estimado"
            stackId="growth"
            fill="var(--color-interest)"
            fillOpacity={0.22}
            stroke="var(--color-interest)"
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
  );
}
