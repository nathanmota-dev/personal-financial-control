import type { CategorySpendingItem } from "@/lib/interfaces/recurring";

export function buildDashboardCategoryDistribution(categorySpending: CategorySpendingItem[]) {
  const sorted = [...categorySpending].sort((a, b) => b.amountCents - a.amountCents || a.categoryId.localeCompare(b.categoryId));
  const positive = sorted.filter((item) => item.amountCents > 0);
  const credits = sorted.filter((item) => item.amountCents < 0);
  const positiveTotalCents = positive.reduce((sum, item) => sum + item.amountCents, 0);
  const netTotalCents = sorted.reduce((sum, item) => sum + item.amountCents, 0);
  const chart = positive.length > 5 ? [
    ...positive.slice(0, 4),
    { categoryId: "other", categoryName: "Outras", amountCents: positive.slice(4).reduce((sum, item) => sum + item.amountCents, 0) },
  ] : positive;
  return { positive, credits, positiveTotalCents, netTotalCents, chart };
}

export const dashboardCategoryColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
