"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { CategorySpendingCharts } from "@/components/finance/category-spending-charts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DashboardChartsProps } from "@/lib/interfaces/dashboard";
import { formatCurrency } from "@/lib/finance-ui";

export function DashboardCharts({
  evolution,
  categorySpending,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/75 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.35)]">
        <div className="mb-4">
          <h3 className="font-heading text-lg font-semibold text-slate-100">Evolução mensal</h3>
          <p className="text-sm text-slate-400">Receita, saídas e resultado dos últimos meses.</p>
        </div>
        <ChartContainer
          className="h-[320px] w-full"
          config={{
            income: { label: "Receitas", color: "#0f766e" },
            expenses: { label: "Despesas", color: "#be123c" },
            investments: { label: "Aportes", color: "#0369a1" },
            net: { label: "Líquido", color: "#1e293b" },
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
      </div>

      <CategorySpendingCharts categorySpending={categorySpending} />
    </div>
  );
}
