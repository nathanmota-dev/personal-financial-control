"use client";

import { financeChartSurfaceClassName } from "@/components/finance/finance-styles";
import {
ChartContainer,
ChartLegend,
ChartLegendContent,
ChartTooltip,
ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency,formatMonthLabel } from "@/lib/finance-ui";
import type { InvestmentGrowthChartChartContainer1Props } from "@/lib/interfaces/render/investment-growth-chart-investment-growth-chart-chart-container1";
import { cn } from "@/lib/utils";
import { formatAxisCurrency } from "@/lib/utils/components/investment-growth-chart";
import {
Area,
AreaChart,
CartesianGrid,
XAxis,
YAxis,
} from "recharts";

export function InvestmentGrowthChartChartContainer1({ data }: InvestmentGrowthChartChartContainer1Props) {
  return (
<ChartContainer
        className={cn(financeChartSurfaceClassName, "h-[460px] w-full")}
        config={{
          principal: { label: "Saldo + movimentos", color: "var(--chart-brand)" },
          interest: { label: "Rendimento estimado", color: "var(--chart-warning)" },
        }}
      >
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="competenceMonth"
            axisLine={false}
            tickLine={false}
            minTickGap={30}
            tickFormatter={(value) => formatMonthLabel(String(value))}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={72}
            tickFormatter={(value) => formatAxisCurrency(Number(value))}
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
          <ChartLegend content={<ChartLegendContent className="text-content" />} />
          <Area
            type="monotone"
            dataKey="principal"
            name="Saldo + movimentos"
            stackId="growth"
            fill="var(--color-principal)"
            fillOpacity={0.34}
            stroke="var(--color-principal)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="interest"
            name="Rendimento estimado"
            stackId="growth"
            fill="var(--color-interest)"
            fillOpacity={0.42}
            stroke="var(--color-interest)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
  );
}
