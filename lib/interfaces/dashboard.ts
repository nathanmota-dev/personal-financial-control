import type { ReactNode } from "react";

import type { CategorySpendingItem } from "@/lib/interfaces/recurring";

export type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export type MetricCardProps = {
  label: string;
  value: string;
  description: string;
  accent: string;
  icon: ReactNode;
};

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

export type CategorySpendingChartsProps = {
  categorySpending: CategorySpendingItem[];
  className?: string;
};
