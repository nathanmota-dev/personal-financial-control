"use client";
import { cn } from "@/lib/utils";
import { buildDashboardCategoryDistribution } from "@/lib/dashboard-categories";
import { DashboardCategoryBars } from "@/components/finance/dashboard-category-bars";
import { DashboardCategoryDistribution } from "@/components/finance/dashboard-category-distribution";
import type { CategorySpendingChartsProps } from "@/lib/interfaces/dashboard";

export function DashboardCategoryCharts({ categorySpending, className, size = "default" }: CategorySpendingChartsProps) {
  const distribution = buildDashboardCategoryDistribution(categorySpending);
  return (
    <div className={cn("grid gap-6 min-[100.0625rem]:gap-5", className)}>
      <DashboardCategoryBars distribution={distribution} size={size} />
      <DashboardCategoryDistribution distribution={distribution} size={size} />
    </div>
  );
}
