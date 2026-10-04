import { requirePageSession } from "@/lib/auth/server";
import { DashboardPageDiv3 } from "./page-dashboard-page-div3";

import {
buildRecentMonths,
isValidMonth
} from "@/lib/finance-ui";
import type {
DashboardData,
DashboardPageProps,
} from "@/lib/interfaces/dashboard";
import {
getCategorySpendingReport,
getMonthlyDashboard,
getMonthlyEvolution,
getMonthlyExpenseFeed,
} from "@/lib/server/dashboard";
import { getFinanceDefaultMonth } from "@/lib/server/runtime";

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  await requirePageSession();
  const params = await searchParams;
  const monthParam =
    typeof params.month === "string" ? params.month : undefined;
  const month = isValidMonth(monthParam)
    ? monthParam
    : getFinanceDefaultMonth();
  let data: DashboardData | undefined;

  try {
    const months = buildRecentMonths(6, month).reverse();
    const [dashboard, evolution, categorySpending, expenses] =
      await Promise.all([
        getMonthlyDashboard(month),
        getMonthlyEvolution(months),
        getCategorySpendingReport(month),
        getMonthlyExpenseFeed(month),
      ]);
    data = { dashboard, evolution, categorySpending, expenses };
  } catch {}

  const resolved = data ?? {
    dashboard: {
      competenceMonth: month,
      totals: {
        incomeCents: 0,
        fixedExpenseCents: 0,
        variableExpenseCents: 0,
        uncategorizedExpenseCents: 0,
        investmentContributionCents: 0,
        investmentWithdrawalCents: 0,
        netInvestmentFlowCents: 0,
        netResultCents: 0,
      },
      accountBalances: [],
      investmentProjection: null,
    },
    evolution: buildRecentMonths(6, month)
      .reverse()
      .map((competenceMonth) => ({
        competenceMonth,
        totals: {
          incomeCents: 0,
          fixedExpenseCents: 0,
          variableExpenseCents: 0,
          uncategorizedExpenseCents: 0,
          investmentContributionCents: 0,
          investmentWithdrawalCents: 0,
          netInvestmentFlowCents: 0,
          netResultCents: 0,
        },
        accountBalances: [],
        investmentProjection: null,
      })),
    categorySpending: [],
    expenses: [],
  };

  return (
    <DashboardPageDiv3  month={month} resolved={resolved} />
  );
}
