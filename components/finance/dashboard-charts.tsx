"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { CategorySpendingCharts } from "@/components/finance/category-spending-charts";
import {
  financeChartSurfaceClassName,
  financeHeaderClassName,
  financePanelClassName,
} from "@/components/finance/finance-styles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DashboardChartsProps } from "@/lib/interfaces/dashboard";
import { formatCurrency } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

export function DashboardCharts({
  evolution,
  categorySpending,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <Card className={cn(financePanelClassName, "gap-0 py-0")}>
        <CardHeader className={financeHeaderClassName}>
          <CardTitle className="text-lg font-semibold text-content-strong">
            Evolução mensal
          </CardTitle>
          <p className="text-sm text-content">Receita, saídas e resultado dos últimos meses.</p>
        </CardHeader>
        <CardContent className="p-5">
          <ChartContainer
            className={cn(financeChartSurfaceClassName, "h-[320px] w-full border-0")}
            config={{
              income: { label: "Receitas", color: "var(--chart-success)" },
              expenses: { label: "Despesas", color: "var(--chart-danger)" },
              investments: { label: "Aportes", color: "var(--chart-brand)" },
              net: { label: "Líquido", color: "var(--chart-neutral)" },
            }}
          >
            <AreaChart data={evolution}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <>
                        <span className="text-muted-foreground">{String(name)}</span>
                        <span>{formatCurrency(Number(value) * 100)}</span>
                      </>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="income"
                fill="var(--color-income)"
                fillOpacity={0.18}
                stroke="var(--color-income)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                fill="var(--color-expenses)"
                fillOpacity={0.12}
                stroke="var(--color-expenses)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="investments"
                fill="var(--color-investments)"
                fillOpacity={0.12}
                stroke="var(--color-investments)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="net"
                fill="var(--color-net)"
                fillOpacity={0.08}
                stroke="var(--color-net)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <CategorySpendingCharts categorySpending={categorySpending} />
    </div>
  );
}
