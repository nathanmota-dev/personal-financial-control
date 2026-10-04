"use client";

import type { CategorySpendingChartsProps } from "@/lib/interfaces/dashboard";
import { cn } from "@/lib/utils";
import { DashboardCategoryChartsSection1 } from "./dashboard-category-charts-dashboard-category-charts-section1";
import { DashboardCategoryChartsSection2 } from "./dashboard-category-charts-dashboard-category-charts-section2";
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
      <DashboardCategoryChartsSection1 sorted={sorted} max={max} total={total} />
      <DashboardCategoryChartsSection2 total={total} chart={chart} />
    </div>
  );
}
