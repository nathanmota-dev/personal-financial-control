"use client";
import { cn } from "@/lib/utils";
import { buildDashboardCategoryDistribution } from "@/lib/dashboard-categories";
import { DashboardCategoryBars } from "@/components/finance/dashboard-category-bars";
import { DashboardCategoryDistribution } from "@/components/finance/dashboard-category-distribution";
import type { CategorySpendingChartsProps } from "@/lib/interfaces/dashboard";

export function DashboardCategoryCharts({ categorySpending, className }: CategorySpendingChartsProps) {
  const distribution = buildDashboardCategoryDistribution(categorySpending);
  return (
    <div className={cn("grid gap-6", className)}>
      <DashboardCategoryBars distribution={distribution} />
      <DashboardCategoryDistribution distribution={distribution} />
    </div>
  );
}
