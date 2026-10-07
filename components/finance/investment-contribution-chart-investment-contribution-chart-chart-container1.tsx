"use client";

import { financeChartSurfaceClassName } from "@/components/finance/finance-styles";
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
import { cn } from "@/lib/utils";
import { compactCurrencyFormatter } from "@/lib/utils/components/investment-contribution-chart";
import { Area,Bar,CartesianGrid,ComposedChart,XAxis,YAxis } from "recharts";

export function InvestmentContributionChartChartContainer1({ data }: InvestmentContributionChartChartContainer1Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
<ChartContainer
            className={cn(financeChartSurfaceClassName, "h-[330px] w-full")}
            config={{
              monthlyContribution: { label: "Aportes", color: "var(--chart-brand)" },
              monthlyWithdrawal: { label: "Resgates", color: "var(--chart-warning)" },
              cumulativeNetMovement: { label: "Movimentação líquida", color: "var(--chart-brand)" },
            }}
          >
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="investmentMovementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-cumulativeNetMovement)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-cumulativeNetMovement)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                minTickGap={26}
                tickFormatter={(value) => formatMonthLabel(String(value))}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={68}
                tickFormatter={(value) => compactCurrencyFormatter.format(Number(value))}
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
              <Bar
                dataKey="monthlyContribution"
                name="Aportes"
                fill="var(--color-monthlyContribution)"
                fillOpacity={0.72}
                radius={[6, 6, 2, 2]}
                maxBarSize={28}
              />
              <Bar
                dataKey="monthlyWithdrawal"
                name="Resgates"
                fill="var(--color-monthlyWithdrawal)"
                fillOpacity={0.72}
                radius={[6, 6, 2, 2]}
                maxBarSize={28}
              />
              <Area
                type="monotone"
                dataKey="cumulativeNetMovement"
                name="Movimentação líquida"
                fill="url(#investmentMovementGradient)"
                stroke="var(--color-cumulativeNetMovement)"
                strokeWidth={2.5}
              />
            </ComposedChart>
          </ChartContainer>
  );
}
