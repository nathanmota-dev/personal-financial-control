import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import { buildRecentMonths } from "@/lib/finance-ui";
import { shiftMonth } from "@/lib/dashboard-cards";
import { aggregateDashboardCategories, aggregateDashboardMonth, selectDashboardTopExpenses, sortDashboardExpenses } from "@/lib/dashboard-aggregation";
import { buildDashboardChartSummary, buildDashboardComparisons } from "@/lib/dashboard-comparisons";
import type { DashboardData } from "@/lib/interfaces/dashboard";
import { buildDashboardHousing } from "@/lib/dashboard-housing";
import { readDashboardBills } from "@/lib/server/dashboard-bills";
import { getFinanceToday } from "@/lib/server/runtime";
import { getInvestmentOverview } from "@/lib/server/investment-operations";
import { getInvestmentProjection } from "@/lib/server/investments";
import { normalizeCompetenceMonth } from "@/lib/server/finance";
import { readDashboardAccounts, readDashboardBalances, readDashboardCards, readDashboardRecords } from "@/lib/server/dashboard-records";

export async function getDashboardData(month: string, database?: AppDb): Promise<DashboardData> {
  const competenceMonth = normalizeCompetenceMonth(month);
  const db = database ?? await getFinanceDatabase();
  const months = buildRecentMonths(6, competenceMonth).reverse();
  // Two extra months are read in the same batch so cards can show upcoming invoices.
  const upcomingMonths = [shiftMonth(competenceMonth, 1), shiftMonth(competenceMonth, 2)];
  const [records, investmentOverview, accountRows] = await Promise.all([
    readDashboardRecords([...months, ...upcomingMonths], db), getInvestmentOverview(db), readDashboardAccounts(db),
  ]);
  const evolution = months.map((item) => aggregateDashboardMonth(item, records.activeTransactions, records.expenses));
  const current = evolution[5];
  const previous = evolution[4];
  const expenses = records.expenses.filter((row) => row.competenceMonth === competenceMonth);
  const comparisons = buildDashboardComparisons(current, previous);
  return {
    dashboard: { ...current, accountBalances: await readDashboardBalances(competenceMonth, expenses, db, accountRows) },
    previous, comparisons, evolution, investmentOverview, cards: await readDashboardCards(competenceMonth, records.expenses, accountRows, db),
    bills: await readDashboardBills(getFinanceToday(), db),
    housing: buildDashboardHousing({ expenses, incomeCents: current.totals.incomeCents }),
    chartSummary: buildDashboardChartSummary(evolution, comparisons.netResultCents),
    categorySpending: aggregateDashboardCategories(expenses),
    expenses: selectDashboardTopExpenses(expenses),
  };
}

export async function getMonthlyDashboard(month: string, database?: AppDb) {
  const competenceMonth = normalizeCompetenceMonth(month);
  const db = database ?? await getFinanceDatabase();
  const [records, investmentProjection] = await Promise.all([
    readDashboardRecords([competenceMonth], db), getInvestmentProjection(db),
  ]);
  return {
    ...aggregateDashboardMonth(competenceMonth, records.activeTransactions, records.expenses),
    accountBalances: await readDashboardBalances(competenceMonth, records.expenses, db),
    investmentProjection,
  };
}

export async function getMonthlyEvolution(months: string[], database?: AppDb) {
  const db = database ?? await getFinanceDatabase();
  return Promise.all(months.map((month) => getMonthlyDashboard(month, db)));
}

export async function getCategorySpendingReport(competenceMonth: string, database?: AppDb) {
  const db = database ?? await getFinanceDatabase();
  const records = await readDashboardRecords([normalizeCompetenceMonth(competenceMonth)], db);
  // Recurrences use this report to match registered categories only.
  return aggregateDashboardCategories(records.expenses, false);
}

export async function getMonthlyExpenseFeed(competenceMonth: string, database?: AppDb) {
  const db = database ?? await getFinanceDatabase();
  const records = await readDashboardRecords([normalizeCompetenceMonth(competenceMonth)], db);
  return records.expenses.sort(sortDashboardExpenses);
}

export async function compareMonths(leftMonth: string, rightMonth: string, database?: AppDb) {
  const db = database ?? await getFinanceDatabase();
  const [left, right] = await Promise.all([getMonthlyDashboard(leftMonth, db), getMonthlyDashboard(rightMonth, db)]);
  return { left, right };
}
