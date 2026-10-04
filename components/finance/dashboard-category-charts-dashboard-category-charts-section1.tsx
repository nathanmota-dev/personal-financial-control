"use client";

import { formatCurrency } from "@/lib/finance-ui";
import type { DashboardCategoryChartsSection1Props } from "@/lib/interfaces/render/dashboard-category-charts-dashboard-category-charts-section1";
import { colors } from "@/lib/utils/components/dashboard-category-charts";

export function DashboardCategoryChartsSection1({ sorted, max, total }: DashboardCategoryChartsSection1Props) {
  return (
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
  );
}
