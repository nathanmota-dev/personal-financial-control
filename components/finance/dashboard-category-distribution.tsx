"use client";
import { ExpandedCategoryDistribution } from "./expanded-category-distribution";
import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import type { DashboardCategorySectionProps } from "@/lib/interfaces/dashboard";
import { dashboardCategoryColors as colors } from "@/lib/dashboard-categories";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { useRef, useState } from "react";

const distributionChartClassName = "aspect-square h-[200px] w-[200px] min-[100.0625rem]:h-[180px] min-[100.0625rem]:w-[180px] shrink-0";
const distributionTooltipOffset = 16;

export function DashboardCategoryDistribution({ distribution, size = "default" }: DashboardCategorySectionProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const chartRef = useRef<HTMLDivElement>(null);
  const [tooltipX, setTooltipX] = useState(0);
  const [tooltipY, setTooltipY] = useState(0);
  const [tooltipTransform, setTooltipTransform] = useState("translate(12px, 12px)");
  const { chart, positiveTotalCents: total, netTotalCents } = distribution;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  if (size === "expanded") return <ExpandedCategoryDistribution distribution={distribution} />;
  return (
    <section className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6 xl:h-[340px] min-[100.0625rem]:h-[290px]">
      <h2 className="text-lg font-semibold leading-[25px]">Distribuição das despesas</h2>
      <p className="mt-1 text-xs text-content-muted">Percentuais sobre categorias com gasto líquido positivo</p>
      <div className="mt-[22px] min-[100.0625rem]:mt-3 flex flex-wrap items-center gap-5 sm:flex-nowrap">
        <div ref={chartRef} className="relative shrink-0">
          {hidden ? (
            <div data-slot="chart" className={distributionChartClassName} />
          ) : (
            <ChartContainer className={distributionChartClassName} config={{ amountCents: { label: "Total gasto" } }}>
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={total ? chart : [{ categoryName: "Sem despesas", amountCents: 1 }]}
                  dataKey="amountCents"
                  nameKey="categoryName"
                  innerRadius="57%"
                  outerRadius="89%"
                  paddingAngle={total ? 3 : 0}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  onMouseMove={(_, index, event) => {
                    if (!total) return;
                    setHoveredIndex(index);
                    const bounds = chartRef.current?.getBoundingClientRect();
                    if (!bounds) return;

                    const x = event.clientX - bounds.left;
                    const y = event.clientY - bounds.top;
                    setTooltipX(x);
                    setTooltipY(y);
                    setTooltipTransform(
                      `translate(${x < bounds.width / 2 ? `calc(-100% - ${distributionTooltipOffset}px)` : `${distributionTooltipOffset}px`}, ${y < bounds.height / 2 ? `calc(-100% - ${distributionTooltipOffset}px)` : `${distributionTooltipOffset}px`})`,
                    );
                  }}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {(total ? chart : [null]).map((item, index) => <Cell key={item?.categoryId ?? "empty"} fill={total ? colors[index] : "var(--chart-rail)"} />)}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-[11px] text-content-muted">Total líquido</span>
            <span className="text-[16px] font-[650]">{formatCurrency(netTotalCents)}</span>
          </div>
          {hoveredIndex !== null && chart[hoveredIndex] && (
            <div
              data-testid="dashboard-category-tooltip"
              role="tooltip"
              className="pointer-events-none absolute z-20 grid w-max min-w-32 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl"
              style={{ left: tooltipX, top: tooltipY, transform: tooltipTransform }}
            >
              <span className="font-medium">Total gasto</span>
              <div className="flex items-center justify-between gap-2">
                <span>{chart[hoveredIndex].categoryName}</span>
                <strong>{formatCurrency(chart[hoveredIndex].amountCents)}</strong>
              </div>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-[21px] min-[100.0625rem]:space-y-4">
          {chart.map((item, index) => <div key={item.categoryId} className="flex items-center gap-2 text-xs">
            <svg width="10" height="10" className="shrink-0"><circle cx="5" cy="5" r="5" fill={colors[index]} /></svg>
            <span className="min-w-0 flex-1 truncate text-content" title={item.categoryName}>{item.categoryName}</span>
            <span className="font-semibold">{Math.round(item.amountCents / total * 100)}%</span>
          </div>)}
        </div>
      </div>
    </section>
  );
}
