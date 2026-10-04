import { DashboardPageSection1 } from "@/app/(finance)/dashboard/page-dashboard-page-section1";
import { DashboardPageSection2 } from "@/app/(finance)/dashboard/page-dashboard-page-section2";
import { DashboardActions } from "@/components/finance/dashboard-actions";
import { DashboardCharts } from "@/components/finance/dashboard-charts";
import { DashboardDetails } from "@/components/finance/dashboard-details";
import type { DashboardPageDiv3Props } from "@/lib/interfaces/render/page-dashboard-page-div3";

export function DashboardPageDiv3({ month, resolved }: DashboardPageDiv3Props) {
  return (
<div className="space-y-6">
      <header className="flex min-h-[104px] flex-wrap items-start justify-between gap-4 pt-[17px]">
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

      <DashboardPageSection1 resolved={resolved} />

      {resolved.dashboard.totals.uncategorizedExpenseCents > 0 ? (
        <DashboardPageSection2 resolved={resolved} month={month} />
      ) : null}

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
        categorySpending={resolved.categorySpending}
      />

      <DashboardDetails
        dashboard={resolved.dashboard}
        expenses={resolved.expenses}
      />
    </div>
  );
}
