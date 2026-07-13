import type { CategorySpendingItem } from "@/lib/interfaces/recurring";

export const categoryChartColors = [
  "#38bdf8",
  "#f97316",
  "#14b8a6",
  "#f43f5e",
  "#eab308",
  "#a78bfa",
] as const;

export type CategoryChartItem = CategorySpendingItem & {
  amount: number;
  shortLabel: string;
  fill: (typeof categoryChartColors)[number];
};

export function buildCategoryChartData(
  categorySpending: CategorySpendingItem[]
): CategoryChartItem[] {
  return categorySpending
    .filter((item) => item.amountCents > 0)
    .sort((left, right) => right.amountCents - left.amountCents)
    .slice(0, categoryChartColors.length)
    .map((item, index) => ({
      ...item,
      amount: item.amountCents / 100,
      shortLabel:
        item.categoryName.length > 18
          ? `${item.categoryName.slice(0, 18).trimEnd()}...`
          : item.categoryName,
      fill: categoryChartColors[index],
    }));
}
