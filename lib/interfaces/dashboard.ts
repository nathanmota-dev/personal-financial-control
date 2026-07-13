import type { CategorySpendingItem } from "@/lib/interfaces/recurring";

export type DashboardEvolutionItem = {
  month: string;
  income: number;
  expenses: number;
  investments: number;
  net: number;
};

export type DashboardChartsProps = {
  evolution: DashboardEvolutionItem[];
  categorySpending: CategorySpendingItem[];
};
