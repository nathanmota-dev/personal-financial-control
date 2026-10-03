import { requirePageSession } from "@/lib/auth/server";
import Link from "next/link";
import { CircleAlert, TrendingDown, TrendingUp } from "lucide-react";

import { DashboardActions } from "@/components/finance/dashboard-actions";
import { DashboardCharts } from "@/components/finance/dashboard-charts";
import {
  buildRecentMonths,
  formatCurrency,
  isValidMonth,
} from "@/lib/finance-ui";
import type {
  DashboardPageProps,
  DashboardData,
} from "@/lib/interfaces/dashboard";
import {
  getCategorySpendingReport,
  getMonthlyDashboard,
  getMonthlyExpenseFeed,
  getMonthlyEvolution,
} from "@/lib/server/dashboard";
import { getFinanceDefaultMonth } from "@/lib/server/runtime";
import { DashboardMetric } from "@/components/finance/dashboard-metric";
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

      <section className="grid gap-[14px] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <DashboardMetric
          label="Receitas"
          value={formatCurrency(resolved.dashboard.totals.incomeCents)}
          icon={<TrendingUp className="size-[19px]" />}
          accent="text-success"
          description="Entradas confirmadas no mês"
        />
        <DashboardMetric
          label="Gastos fixos"
          value={formatCurrency(resolved.dashboard.totals.fixedExpenseCents)}
          icon={<TrendingDown className="size-[19px]" />}
          accent="text-danger"
          description="Compromissos recorrentes"
        />
        <DashboardMetric
          label="Gastos variáveis"
          value={formatCurrency(resolved.dashboard.totals.variableExpenseCents)}
          icon={<TrendingDown className="size-[19px]" />}
          accent="text-danger"
          description="Despesas flexíveis do período"
        />
        <DashboardMetric
          label="Investimentos líquidos"
          value={formatCurrency(
            resolved.dashboard.totals.netInvestmentFlowCents,
          )}
          icon={<TrendingUp className="size-[19px]" />}
          accent="text-success"
          description="Aportes menos resgates"
        />
        <DashboardMetric
          label="Saldo livre"
          value={formatCurrency(resolved.dashboard.totals.netResultCents)}
          icon={<TrendingUp className="size-[19px]" />}
          accent={
            resolved.dashboard.totals.netResultCents >= 0
              ? "text-success"
              : "text-danger"
          }
          description="Disponível após gastos e aportes"
        />
      </section>

      {resolved.dashboard.totals.uncategorizedExpenseCents > 0 ? (
        <section className="rounded-[20px] border border-warning/20 bg-warning-soft">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
                <CircleAlert className="size-5" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-warning">
                  Há despesas sem categoria
                </p>
                <p className="mt-1 text-sm leading-6 text-warning/70">
                  {formatCurrency(
                    resolved.dashboard.totals.uncategorizedExpenseCents,
                  )}{" "}
                  em despesas ainda aguardam organização. Elas já reduzem o
                  saldo livre.
                </p>
              </div>
            </div>
            <Link
              href={`/transactions?month=${month}&uncategorized=true`}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-warning/25 bg-warning/10 px-4 text-sm font-semibold text-warning transition-colors hover:bg-warning/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/40"
            >
              Categorizar agora
            </Link>
          </div>
        </section>
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
