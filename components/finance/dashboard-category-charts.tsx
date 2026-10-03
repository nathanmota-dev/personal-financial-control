"use client";

import { cn } from "@/lib/utils";
import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { CategorySpendingChartsProps } from "@/lib/interfaces/dashboard";
import { formatCurrency } from "@/lib/finance-ui";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
export function DashboardCategoryCharts({
  categorySpending,
  className,
}: CategorySpendingChartsProps) {
  const sorted = [...categorySpending].sort(
    (a, b) => b.amountCents - a.amountCents,
  );
  const total = sorted.reduce((sum, item) => sum + item.amountCents, 0);
  const chart =
    sorted.length > 5
      ? [
          ...sorted.slice(0, 4),
          {
            categoryId: "other",
            categoryName: "Outras",
            amountCents: sorted
              .slice(4)
              .reduce((sum, item) => sum + item.amountCents, 0),
          },
        ]
      : sorted;
  const max = sorted[0]?.amountCents || 1;
  return (
    <div className={cn("grid gap-6", className)}>
      <section className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6 xl:h-[340px]">
        <h2 className="text-lg font-semibold leading-[25px]">
          Gastos por categoria
        </h2>
        <p className="mt-1 text-xs text-content-muted">
          Peso relativo das despesas no mês
        </p>
        <div className="mt-[27px] grid gap-[28px]">
          {sorted.slice(0, 5).map((item, index) => (
            <div
              key={item.categoryId}
              className="grid grid-cols-[87px_minmax(0,1fr)_76px] items-center gap-3 text-xs"
            >
              <span
                className="truncate font-medium text-content"
                title={item.categoryName}
              >
                {item.categoryName}
              </span>
              <svg
                className="h-[9px] w-full overflow-visible"
                viewBox="0 0 198 9"
                preserveAspectRatio="none"
                role="img"
                aria-label={`${item.categoryName}: ${formatCurrency(item.amountCents)}`}
              >
                <rect
                  width="198"
                  height="9"
                  rx="4.5"
                  fill="var(--chart-rail)"
                />
                <rect
                  width={(item.amountCents / max) * 172.2}
                  height="9"
                  rx="4.5"
                  fill={colors[index]}
                />
              </svg>
              <span className="whitespace-nowrap text-right text-[11px] text-content">
                {formatCurrency(item.amountCents)}
              </span>
            </div>
          ))}
        </div>
        {!total && (
          <p className="mt-14 text-center text-sm text-content-muted">
            Nenhuma despesa neste mês.
          </p>
        )}
      </section>
      <section className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6 xl:h-[340px]">
        <h2 className="text-lg font-semibold leading-[25px]">
          Distribuição das despesas
        </h2>
        <p className="mt-1 text-xs text-content-muted">
          Leitura rápida das categorias dominantes
        </p>
        <div className="mt-[22px] flex flex-wrap items-center gap-5 sm:flex-nowrap">
          <div className="relative shrink-0">
            <ChartContainer
              className="aspect-square h-[200px] w-[200px] shrink-0"
              config={{ amountCents: { label: "Total gasto" } }}
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="categoryName"
                      formatter={(value, name) => (
                        <>
                          <span>{name}</span>
                          <strong>{formatCurrency(Number(value))}</strong>
                        </>
                      )}
                    />
                  }
                />
                <Pie
                  isAnimationActive={false}
                  data={
                    total
                      ? chart
                      : [{ categoryName: "Sem despesas", amountCents: 1 }]
                  }
                  dataKey="amountCents"
                  nameKey="categoryName"
                  innerRadius={57}
                  outerRadius={89}
                  paddingAngle={total ? 3 : 0}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {(total ? chart : [null]).map((item, index) => (
                    <Cell
                      key={item?.categoryId ?? "empty"}
                      fill={total ? colors[index] : "var(--chart-rail)"}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span className="text-[11px] text-content-muted">
                Total gasto
              </span>
              <span className="text-[16px] font-[650]">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-[21px]">
            {chart.map((item, index) => (
              <div
                key={item.categoryId}
                className="flex items-center gap-2 text-xs"
              >
                <svg width="10" height="10" className="shrink-0">
                  <circle cx="5" cy="5" r="5" fill={colors[index]} />
                </svg>
                <span
                  className="min-w-0 flex-1 truncate text-content"
                  title={item.categoryName}
                >
                  {item.categoryName}
                </span>
                <span className="font-semibold">
                  {total ? Math.round((item.amountCents / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
