import { requirePageSession } from "@/lib/auth/server";

import { DashboardActions } from "@/components/finance/dashboard-actions";
import { DashboardCharts } from "@/components/finance/dashboard-charts";
import { isValidMonth } from "@/lib/finance-ui";
import type { DashboardPageProps } from "@/lib/interfaces/dashboard";
import { getDashboardData } from "@/lib/server/dashboard";
import { getFinanceDefaultMonth } from "@/lib/server/runtime";
import { DashboardMetrics } from "@/components/finance/dashboard-metrics";
import { DashboardUncategorizedNotice } from "@/components/finance/dashboard-uncategorized-notice";
import { DashboardDetails } from "@/components/finance/dashboard-details";

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
  const resolved = await getDashboardData(month);

  return (
    <div className="dashboard-page space-y-6 min-[100.0625rem]:space-y-5">
      <header className="flex min-h-[104px] flex-wrap items-start justify-between gap-4 pt-[17px] min-[100.0625rem]:min-h-[76px] min-[100.0625rem]:pt-0">
        <div>
          <h1 className="text-[35px] leading-[44px] font-semibold tracking-[-1px]">
            Visão mensal
          </h1>
          <p className="mt-2 text-xs text-content">
            Acompanhe receitas, despesas, investimentos e o saldo disponível do
            período.
          </p>
        </div>
        <div className="pt-[5px]">
          <DashboardActions month={month} />
        </div>
      </header>

      <DashboardMetrics totals={resolved.dashboard.totals} comparisons={resolved.comparisons} />

      <DashboardUncategorizedNotice amountCents={resolved.dashboard.totals.uncategorizedExpenseCents} month={month} />

      <DashboardCharts
        evolution={resolved.evolution.map((item) => ({
          month: new Date(`${item.competenceMonth}-01T12:00:00`)
            .toLocaleDateString("pt-BR", { month: "short" })
            .replace(".", ""),
          income: item.totals.incomeCents / 100,
          expenses:
            (item.totals.fixedExpenseCents +
              item.totals.variableExpenseCents +
              item.totals.uncategorizedExpenseCents) /
            100,
          investments: item.totals.netInvestmentFlowCents / 100,
          net: item.totals.netResultCents / 100,
        }))}
        summary={resolved.chartSummary}
        categorySpending={resolved.categorySpending}
      />

      <DashboardDetails
        dashboard={resolved.dashboard}
        expenses={resolved.expenses}
        investmentOverview={resolved.investmentOverview}
      />
    </div>
  );
}
