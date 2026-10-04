"use client";

import {
ChartContainer,
ChartTooltip,
ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/finance-ui";
import type { DashboardCategoryChartsSection2Props } from "@/lib/interfaces/render/dashboard-category-charts-dashboard-category-charts-section2";
import { colors } from "@/lib/utils/components/dashboard-category-charts";
import { Cell,Pie,PieChart } from "recharts";

export function DashboardCategoryChartsSection2({ total, chart }: DashboardCategoryChartsSection2Props) {
  return (
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
  );
}
