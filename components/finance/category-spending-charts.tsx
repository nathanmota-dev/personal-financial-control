"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  financeChartSurfaceClassName,
  financeHeaderClassName,
  financePanelClassName,
} from "@/components/finance/finance-styles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCategoryChartData } from "@/lib/category-spending";
import { formatCurrency } from "@/lib/finance-ui";
import type { CategorySpendingChartsProps } from "@/lib/interfaces/dashboard";
import { cn } from "@/lib/utils";

export function CategorySpendingCharts({
  categorySpending,
  className,
}: CategorySpendingChartsProps) {
  const topCategories = buildCategoryChartData(categorySpending);
  const hasCategoryData = topCategories.length > 0;

  return (
    <div className={cn("grid gap-6", className)}>
      <Card className={cn(financePanelClassName, "gap-0 py-0")}>
        <CardHeader className={financeHeaderClassName}>
          <CardTitle className="text-lg font-semibold text-content-strong">
            Gastos por categoria
          </CardTitle>
          <p className="text-sm text-content">Peso relativo das despesas no mês.</p>
        </CardHeader>
        <CardContent className="p-5">
          {hasCategoryData ? (
            <ChartContainer
              className={cn(financeChartSurfaceClassName, "h-[220px] w-full border-0")}
              config={{
                amount: { label: "Valor", color: "var(--chart-success)" },
              }}
            >
              <BarChart
                data={topCategories}
                layout="vertical"
                margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="shortLabel"
                  axisLine={false}
                  tickLine={false}
                  width={112}
                  tick={{ fill: "var(--chart-neutral)", fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={{ fill: "rgb(var(--success-rgb) / .08)" }}
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => (
                        <>
                          <span className="text-muted-foreground">
                            {String(item.payload.categoryName)}
                          </span>
                          <span>{formatCurrency(Number(value) * 100)}</span>
                        </>
                      )}
                    />
                  }
                />
                <Bar dataKey="amount" radius={999} barSize={18}>
                  {topCategories.map((item) => (
                    <Cell key={item.categoryId} fill={item.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-border bg-surface/45 px-6 text-center text-sm text-content">
              Nenhuma despesa categorizada encontrada para este mês.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={cn(financePanelClassName, "gap-0 py-0")}>
        <CardHeader className={financeHeaderClassName}>
          <CardTitle className="text-lg font-semibold text-content-strong">
            Distribuição das despesas
          </CardTitle>
          <p className="text-sm text-content">Leitura rápida das categorias dominantes.</p>
        </CardHeader>
        <CardContent className="p-5">
          {hasCategoryData ? (
            <ChartContainer
              className={cn(financeChartSurfaceClassName, "h-[220px] w-full border-0")}
              config={{
                a: { label: "1", color: "var(--chart-brand)" },
                b: { label: "2", color: "var(--chart-warning)" },
                c: { label: "3", color: "var(--chart-success)" },
                d: { label: "4", color: "var(--chart-danger)" },
                e: { label: "5", color: "var(--chart-warning)" },
                f: { label: "6", color: "var(--chart-brand)" },
              }}
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => (
                        <>
                          <span className="text-muted-foreground">
                            {String(item.payload.categoryName)}
                          </span>
                          <span>{formatCurrency(Number(value) * 100)}</span>
                        </>
                      )}
                    />
                  }
                />
                <Pie
                  data={topCategories}
                  dataKey="amount"
                  nameKey="categoryName"
                  innerRadius={48}
                  outerRadius={82}
                  paddingAngle={2}
                >
                  {topCategories.map((item) => (
                    <Cell key={item.categoryId} fill={item.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-border bg-surface/45 px-6 text-center text-sm text-content">
              Adicione despesas com categoria para liberar a distribuição visual.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
