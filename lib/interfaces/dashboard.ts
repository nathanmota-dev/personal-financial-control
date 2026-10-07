import type { accounts, categories, transactions } from "@/lib/db/schema";
import type { CategorySpendingItem } from "@/lib/interfaces/recurring";
import type { InvestmentOverview } from "@/lib/interfaces/investment-operations";
import type { serializeTimestamps } from "@/lib/server/finance";
import type { ReactNode } from "react";

export type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export type DashboardTransaction = typeof transactions.$inferSelect;
export type DashboardExpense = {
  id: string;
  amountCents: number;
  description: string;
  expenseDate: string;
  competenceMonth: string;
  category: ReturnType<typeof serializeTimestamps<typeof categories.$inferSelect>> | null;
  account: ReturnType<typeof serializeTimestamps<typeof accounts.$inferSelect>> | null;
};
export type DashboardTotals = {
  incomeCents: number;
  fixedExpenseCents: number;
  variableExpenseCents: number;
  uncategorizedExpenseCents: number;
  investmentContributionCents: number;
  investmentWithdrawalCents: number;
  netInvestmentFlowCents: number;
  netResultCents: number;
};
export type DashboardMonth = {
  competenceMonth: string;
  totals: DashboardTotals;
  hasMovements: boolean;
};
export type DashboardAccountBalance = {
  id: string;
  name: string;
  type: typeof accounts.$inferSelect.type;
  currentBalanceCents: number;
  metricLabel: string;
};
export type DashboardMetricKey = "incomeCents" | "fixedExpenseCents" | "variableExpenseCents" | "netInvestmentFlowCents" | "netResultCents";
export type DashboardComparison = {
  differenceCents: number;
  direction: "up" | "down" | "stable";
  tone: "positive" | "negative" | "neutral";
  percentage: number | null;
  valueLabel: string;
  description: string;
};
export type DashboardComparisons = Record<DashboardMetricKey, DashboardComparison>;
export type DashboardChartSummary = {
  averageIncomeCents: number;
  accumulatedCents: number;
  resultLabel: string;
  balanceComparison: DashboardComparison;
};
export type DashboardData = {
  dashboard: DashboardMonth & { accountBalances: DashboardAccountBalance[] };
  previous: DashboardMonth;
  comparisons: DashboardComparisons;
  evolution: DashboardMonth[];
  chartSummary: DashboardChartSummary;
  categorySpending: CategorySpendingItem[];
  expenses: DashboardExpense[];
  investmentOverview: InvestmentOverview;
};
export type MetricCardProps = {
  label: string;
  value: ReactNode;
  comparison: DashboardComparison;
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
  summary: DashboardChartSummary;
};
export type DashboardEvolutionChartProps = Pick<DashboardChartsProps, "evolution">;
export type DashboardChartSummaryProps = { summary: DashboardChartSummary };
export type CategorySpendingChartsProps = {
  categorySpending: CategorySpendingItem[];
  className?: string;
  size?: "default" | "expanded";
};
export type DashboardActionsProps = { month: string };
export type DashboardDetailsProps = Pick<DashboardData, "dashboard" | "expenses" | "investmentOverview">;
export type DashboardExpenseListProps = Pick<DashboardData, "expenses">;
export type DashboardBalancesProps = { accounts: DashboardAccountBalance[] };
export type DashboardPortfolioProps = Pick<DashboardData, "investmentOverview">;
export type DashboardMetricListProps = Pick<DashboardData, "comparisons"> & { totals: DashboardTotals };
export type DashboardCategoryDistribution = ReturnType<typeof import("@/lib/dashboard-categories").buildDashboardCategoryDistribution>;
export type DashboardCategorySectionProps = { distribution: DashboardCategoryDistribution; size?: "default" | "expanded" };
export type DashboardUncategorizedNoticeProps = { amountCents: number; month: string };
