import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { DashboardActions } from "@/components/finance/dashboard-actions";
import { DashboardCharts } from "@/components/finance/dashboard-charts";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  accountTypeLabels,
  buildRecentMonths,
  formatCurrency,
  formatDateLabel,
  formatMonthLabel,
  getDefaultMonth,
  isValidMonth,
} from "@/lib/finance-ui";
import {
  getCategorySpendingReport,
  getMonthlyDashboard,
  getMonthlyExpenseFeed,
  getMonthlyEvolution,
} from "@/lib/server/dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const monthParam = typeof params.month === "string" ? params.month : undefined;
  const month = isValidMonth(monthParam) ? monthParam : getDefaultMonth();
  let data:
    | {
        dashboard: Awaited<ReturnType<typeof getMonthlyDashboard>>;
        evolution: Awaited<ReturnType<typeof getMonthlyEvolution>>;
        categorySpending: Awaited<ReturnType<typeof getCategorySpendingReport>>;
        expenses: Awaited<ReturnType<typeof getMonthlyExpenseFeed>>;
      }
    | undefined;

  try {
    const months = buildRecentMonths(6, month).reverse();
    const [dashboard, evolution, categorySpending, expenses] = await Promise.all([
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
        investmentContributionCents: 0,
        investmentWithdrawalCents: 0,
        netInvestmentFlowCents: 0,
        netResultCents: 0,
      },
      accountBalances: [],
      investmentProjection: null,
    },
    evolution: buildRecentMonths(6, month).reverse().map((competenceMonth) => ({
      competenceMonth,
      totals: {
        incomeCents: 0,
        fixedExpenseCents: 0,
        variableExpenseCents: 0,
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

  const topExpenses = resolved.expenses
    .sort((left, right) => right.amountCents - left.amountCents)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={`Visão mensal de ${formatMonthLabel(month)}`}
        description="Resumo consolidado do mês, com receitas, gastos, investimentos, saldo livre, contas, categorias e carteira."
        actions={<DashboardActions month={month} />}
      />

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Receitas"
          value={formatCurrency(resolved.dashboard.totals.incomeCents)}
          icon={<TrendingUp className="size-4" />}
          accent="text-cyan-300"
          description="Entradas ativas do mês."
        />
        <MetricCard
          label="Gastos fixos"
          value={formatCurrency(resolved.dashboard.totals.fixedExpenseCents)}
          icon={<Wallet className="size-4" />}
          accent="text-sky-300"
          description="Compromissos recorrentes e estruturais."
        />
        <MetricCard
          label="Gastos variáveis"
          value={formatCurrency(resolved.dashboard.totals.variableExpenseCents)}
          icon={<TrendingDown className="size-4" />}
          accent="text-blue-300"
          description="Saídas discricionárias no período."
        />
        <MetricCard
          label="Investimentos líquidos"
          value={formatCurrency(resolved.dashboard.totals.netInvestmentFlowCents)}
          icon={<PiggyBank className="size-4" />}
          accent="text-teal-300"
          description="Aportes menos resgates no mês."
        />
        <MetricCard
          label="Saldo livre"
          value={formatCurrency(resolved.dashboard.totals.netResultCents)}
          icon={<TrendingUp className="size-4" />}
          accent={resolved.dashboard.totals.netResultCents >= 0 ? "text-cyan-300" : "text-blue-300"}
          description="Disponível para gastos livres do mês."
        />
      </section>

      <DashboardCharts
        evolution={resolved.evolution.map((item) => ({
          month: item.competenceMonth.slice(5),
          income: item.totals.incomeCents / 100,
          expenses: (item.totals.fixedExpenseCents + item.totals.variableExpenseCents) / 100,
          investments: item.totals.netInvestmentFlowCents / 100,
          net: item.totals.netResultCents / 100,
        }))}
        categorySpending={resolved.categorySpending}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
          <CardHeader>
            <CardTitle>Maiores gastos do mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topExpenses.length ? (
              topExpenses.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-100">{transaction.description}</p>
                    <p className="text-sm text-slate-400">
                      {transaction.category?.name ?? "Sem categoria"} •{" "}
                      {formatDateLabel(transaction.expenseDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-300">
                      {formatCurrency(transaction.amountCents)}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {transaction.account?.name ?? "Conta"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <FinanceEmptyState
                title="Sem despesas relevantes"
                description="Não há gastos lançados para esta competência."
              />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
            <CardHeader>
              <CardTitle>Saldos por conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resolved.dashboard.accountBalances.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-100">{account.name}</p>
                    <p className="text-sm text-slate-400">{accountTypeLabels[account.type]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {account.metricLabel}
                    </p>
                    <p className="font-semibold text-cyan-300">
                    {formatCurrency(account.currentBalanceCents)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-slate-800 bg-[#06152d] text-white">
            <CardHeader>
              <CardTitle>Carteira consolidada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-200">
              {resolved.dashboard.investmentProjection ? (
                <>
                  <p>
                    Saldo estimado hoje:{" "}
                    <span className="font-semibold text-white">
                      {formatCurrency(resolved.dashboard.investmentProjection.currentBalanceCents)}
                    </span>
                  </p>
                  <p>
                    Rendimento estimado:{" "}
                    <span className="font-semibold text-white">
                      {formatCurrency(resolved.dashboard.investmentProjection.estimatedInterestCents)}
                    </span>
                  </p>
                  <p>
                    Desde o checkpoint:{" "}
                    <span className="font-semibold text-white">
                      {formatDateLabel(resolved.dashboard.investmentProjection.checkpointDate)}
                    </span>
                  </p>
                  <p>
                    Taxa esperada:{" "}
                    <span className="font-semibold text-white">
                      {(resolved.dashboard.investmentProjection.expectedMonthlyRateBps / 100).toFixed(2)}%
                    </span>
                  </p>
                  {resolved.dashboard.investmentProjection.nextContributionDate ? (
                    <p>
                      Próximo aporte previsto:{" "}
                      <span className="font-semibold text-white">
                        {formatDateLabel(resolved.dashboard.investmentProjection.nextContributionDate)}
                      </span>
                    </p>
                  ) : null}
                </>
              ) : (
                <p>A carteira ainda não foi configurada.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  accent,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-[1.5rem] border-slate-800 bg-slate-950/75">
      <CardContent className="space-y-3 pt-6">
        <div className={`inline-flex rounded-full bg-slate-900 p-2 ${accent}`}>{icon}</div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className={`font-heading text-3xl font-semibold tracking-tight ${accent}`}>{value}</p>
        </div>
        <p className="text-sm leading-6 text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}
