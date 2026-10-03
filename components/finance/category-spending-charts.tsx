"use client";

import { DashboardCategoryCharts } from "@/components/finance/dashboard-category-charts";
import type { CategorySpendingChartsProps } from "@/lib/interfaces/dashboard";

export function CategorySpendingCharts(props: CategorySpendingChartsProps) {
  return <DashboardCategoryCharts {...props} />;
}
