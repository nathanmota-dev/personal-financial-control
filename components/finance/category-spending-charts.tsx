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
import type { CategorySpendingItem } from "@/lib/interfaces/recurring";
import { buildCategoryChartData } from "@/lib/category-spending";
import { formatCurrency } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

export function CategorySpendingCharts({
  categorySpending,
  className,
}: {
  categorySpending: CategorySpendingItem[];
  className?: string;
}) {
  const topCategories = buildCategoryChartData(categorySpending);
  const hasCategoryData = topCategories.length > 0;

  return (
    <div className={cn("grid gap-6", className)}>
      <article className="rounded-[1.75rem] border border-slate-800 bg-slate-950/75 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.35)]">
        <div className="mb-4">
          <h3 className="font-heading text-lg font-semibold text-slate-100">
            Gastos por categoria
          </h3>
          <p className="text-sm text-slate-400">Peso relativo das despesas no mês.</p>
        </div>
        {hasCategoryData ? (
          <ChartContainer
            className="h-[220px] w-full"
            config={{
              amount: { label: "Valor", color: "#14b8a6" },
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
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <ChartTooltip
                cursor={{ fill: "rgba(20, 184, 166, 0.08)" }}
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
          <div className="flex h-[220px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-800 bg-slate-950/40 px-6 text-center text-sm text-slate-400">
            Nenhuma despesa categorizada encontrada para este mês.
          </div>
        )}
      </article>

      <article className="rounded-[1.75rem] border border-slate-800 bg-slate-950/75 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.35)]">
        <div className="mb-4">
          <h3 className="font-heading text-lg font-semibold text-slate-100">
            Distribuição das despesas
          </h3>
          <p className="text-sm text-slate-400">Leitura rápida das categorias dominantes.</p>
        </div>
        {hasCategoryData ? (
          <ChartContainer
            className="h-[220px] w-full"
            config={{
              a: { label: "1", color: "#38bdf8" },
              b: { label: "2", color: "#f97316" },
              c: { label: "3", color: "#14b8a6" },
              d: { label: "4", color: "#f43f5e" },
              e: { label: "5", color: "#eab308" },
              f: { label: "6", color: "#a78bfa" },
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
          <div className="flex h-[220px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-800 bg-slate-950/40 px-6 text-center text-sm text-slate-400">
            Adicione despesas com categoria para liberar a distribuição visual.
          </div>
        )}
      </article>
    </div>
  );
}
