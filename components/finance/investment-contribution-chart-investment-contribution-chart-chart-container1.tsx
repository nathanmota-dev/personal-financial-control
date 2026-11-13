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
import type { InvestmentContributionChartChartContainer1Props } from "@/lib/interfaces/render/investment-contribution-chart-investment-contribution-chart-chart-container1";
import { compactCurrencyFormatter } from "@/lib/utils/components/investment-contribution-chart";
import { Area,Bar,CartesianGrid,ComposedChart,XAxis,YAxis } from "recharts";

export function InvestmentContributionChartChartContainer1({ data }: InvestmentContributionChartChartContainer1Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
<ChartContainer
            className="mt-5 min-h-[280px] w-full flex-1 rounded-xl bg-[var(--chart-surface)]"
            config={{
              monthlyContribution: { label: "Aportes", color: "var(--chart-1)" },
              monthlyWithdrawal: { label: "Resgates", color: "var(--chart-2)" },
              cumulativeNetMovement: { label: "Movimentação líquida", color: "var(--chart-5)" },
            }}
          >
            <ComposedChart data={data} margin={{ top: 30, right: 29, bottom: 8, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tickMargin={16}
                fontSize={10}
                stroke="var(--content-subtle)"
                minTickGap={26}
                tickFormatter={(value) => formatMonthLabel(String(value))}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickCount={5}
                fontSize={10}
                stroke="var(--content-subtle)"
                width={68}
                tickFormatter={(value) => compactCurrencyFormatter.format(Number(value))}
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
              <Bar
                dataKey="monthlyContribution"
                name="Aportes"
                fill="var(--color-monthlyContribution)"
                radius={[6, 6, 2, 2]}
                maxBarSize={28}
                isAnimationActive={false}
              />
              <Bar
                dataKey="monthlyWithdrawal"
                name="Resgates"
                fill="var(--color-monthlyWithdrawal)"
                radius={[6, 6, 2, 2]}
                maxBarSize={28}
                isAnimationActive={false}
              />
              <Area
                type="linear"
                dataKey="cumulativeNetMovement"
                name="Movimentação líquida"
                fill="none"
                stroke="var(--color-cumulativeNetMovement)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartContainer>
  );
}
