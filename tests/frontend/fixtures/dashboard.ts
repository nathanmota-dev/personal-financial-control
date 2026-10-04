import fixtures from "./finance.json";
import { buildDashboardChartSummary, buildDashboardComparisons } from "@/lib/dashboard-comparisons";
import { selectDashboardTopExpenses } from "@/lib/dashboard-aggregation";
import type { DashboardData, DashboardExpense } from "@/lib/interfaces/dashboard";

const dashboard = { ...fixtures.dashboard, hasMovements: true };
const evolution = fixtures.evolution.map((item) => ({ ...item, hasMovements: true }));
const previous = evolution[0];
const comparisons = buildDashboardComparisons(dashboard, previous);
export const dashboardFixture: DashboardData = {
  dashboard: dashboard as DashboardData["dashboard"], previous, evolution, comparisons,
  chartSummary: buildDashboardChartSummary(evolution, comparisons.netResultCents),
  categorySpending: fixtures.spending,
  expenses: selectDashboardTopExpenses(fixtures.expenses.map((expense) => ({ ...expense, competenceMonth: "2026-07" })) as DashboardExpense[]),
  investmentOverview: fixtures.overview as DashboardData["investmentOverview"],
};
