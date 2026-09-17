import Link from "next/link";
import { CircleAlert, PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { DashboardActions } from "@/components/finance/dashboard-actions";
import { DashboardCharts } from "@/components/finance/dashboard-charts";
import {
  financeHeaderClassName,
  financeItemClassName,
  financeMetricClassName,
  financePanelClassName,
} from "@/components/finance/finance-styles";
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
  isValidMonth,
} from "@/lib/finance-ui";
import type { DashboardPageProps, MetricCardProps } from "@/lib/interfaces/dashboard";
import {
  getCategorySpendingReport,
  getMonthlyDashboard,
  getMonthlyExpenseFeed,
  getMonthlyEvolution,
} from "@/lib/server/dashboard";
import { getFinanceDefaultMonth } from "@/lib/server/runtime";
import { cn } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const monthParam = typeof params.month === "string" ? params.month : undefined;
  const month = isValidMonth(monthParam) ? monthParam : getFinanceDefaultMonth();
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
        uncategorizedExpenseCents: 0,
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
          accent="text-brand"
          description="Entradas ativas do mês."
        />
        <MetricCard
          label="Gastos fixos"
          value={formatCurrency(resolved.dashboard.totals.fixedExpenseCents)}
          icon={<Wallet className="size-4" />}
          accent="text-brand"
          description="Compromissos recorrentes e estruturais."
        />
        <MetricCard
          label="Gastos variáveis"
          value={formatCurrency(resolved.dashboard.totals.variableExpenseCents)}
          icon={<TrendingDown className="size-4" />}
          accent="text-brand"
          description="Saídas discricionárias no período."
        />
        <MetricCard
          label="Investimentos líquidos"
          value={formatCurrency(resolved.dashboard.totals.netInvestmentFlowCents)}
          icon={<PiggyBank className="size-4" />}
          accent="text-warning"
          description="Aportes menos resgates no mês."
        />
        <MetricCard
          label="Saldo livre"
          value={formatCurrency(resolved.dashboard.totals.netResultCents)}
          icon={<TrendingUp className="size-4" />}
          accent={resolved.dashboard.totals.netResultCents >= 0 ? "text-brand" : "text-brand"}
          description="Disponível para gastos livres do mês."
        />
      </section>

      {resolved.dashboard.totals.uncategorizedExpenseCents > 0 ? (
        <Card className="overflow-hidden rounded-[1.75rem] border-warning/20 bg-warning/[0.06] shadow-[0_24px_80px_rgb(var(--warning-rgb) / .14)]">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
                <CircleAlert className="size-5" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-warning">Há despesas sem categoria</p>
                <p className="mt-1 text-sm leading-6 text-warning/70">
                  {formatCurrency(resolved.dashboard.totals.uncategorizedExpenseCents)} em despesas ainda aguardam organização. Elas já reduzem o saldo livre.
                </p>
              </div>
            </div>
            <Link
              href={`/transactions?month=${month}&uncategorized=true`}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-warning/25 bg-warning/10 px-4 text-sm font-semibold text-warning transition-colors hover:bg-warning/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/40"
            >
              Categorizar agora
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <DashboardCharts
        evolution={resolved.evolution.map((item) => ({
          month: item.competenceMonth.slice(5),
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

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className={financePanelClassName}>
          <CardHeader className={financeHeaderClassName}>
            <CardTitle>Maiores gastos do mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topExpenses.length ? (
              topExpenses.map((transaction) => (
                <div
                  key={transaction.id}
                  className={cn(
                    financeItemClassName,
                    "flex items-center justify-between gap-4 px-4 py-3"
                  )}
                >
                  <div>
                    <p className="font-medium text-content-strong">{transaction.description}</p>
                    <p className="text-sm text-content">
                      {transaction.category?.name ?? "Sem categoria"} •{" "}
                      {formatDateLabel(transaction.expenseDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-brand">
                      {formatCurrency(transaction.amountCents)}
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1 border-input bg-surface/50 text-content"
                    >
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
          <Card className={financePanelClassName}>
            <CardHeader className={financeHeaderClassName}>
              <CardTitle>Saldos por conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resolved.dashboard.accountBalances.map((account) => (
                <div
                  key={account.id}
                  className={cn(
                    financeItemClassName,
                    "flex items-center justify-between gap-4 px-4 py-3"
                  )}
                >
                  <div>
                    <p className="font-medium text-content-strong">{account.name}</p>
                    <p className="text-sm text-content">{accountTypeLabels[account.type]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-content-strong0">
                      {account.metricLabel}
                    </p>
                    <p className="font-semibold text-brand">
                    {formatCurrency(account.currentBalanceCents)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={financePanelClassName}>
            <CardHeader className={financeHeaderClassName}>
              <CardTitle>Carteira consolidada</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {resolved.dashboard.investmentProjection ? (
                <>
                  <div
                    className={cn(
                      financeItemClassName,
                      "flex items-center justify-between gap-4 px-4 py-3"
                    )}
                  >
                    <p className="text-content">Saldo estimado hoje</p>
                    <p className="text-right font-semibold text-brand">
                      {formatCurrency(resolved.dashboard.investmentProjection.currentBalanceCents)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      financeItemClassName,
                      "flex items-center justify-between gap-4 px-4 py-3"
                    )}
                  >
                    <p className="text-content">Rendimento estimado</p>
                    <p className="text-right font-semibold text-brand">
                      {formatCurrency(resolved.dashboard.investmentProjection.estimatedInterestCents)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      financeItemClassName,
                      "flex items-center justify-between gap-4 px-4 py-3"
                    )}
                  >
                    <p className="text-content">Desde o checkpoint</p>
                    <p className="text-right font-semibold text-content-strong">
                      {formatDateLabel(resolved.dashboard.investmentProjection.checkpointDate)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      financeItemClassName,
                      "flex items-center justify-between gap-4 px-4 py-3"
                    )}
                  >
                    <p className="text-content">Taxa esperada</p>
                    <p className="text-right font-semibold text-content-strong">
                      {(resolved.dashboard.investmentProjection.expectedMonthlyRateBps / 100).toFixed(2)}%
                    </p>
                  </div>
                  {resolved.dashboard.investmentProjection.nextContributionDate ? (
                    <div
                      className={cn(
                        financeItemClassName,
                        "flex items-center justify-between gap-4 px-4 py-3"
                      )}
                    >
                      <p className="text-content">Próximo aporte previsto</p>
                      <p className="text-right font-semibold text-content-strong">
                        {formatDateLabel(resolved.dashboard.investmentProjection.nextContributionDate)}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className={cn(financeItemClassName, "px-4 py-3")}>
                  <p className="text-content">A carteira ainda não foi configurada.</p>
                </div>
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
}: MetricCardProps) {
  return (
    <Card className={financeMetricClassName}>
      <CardContent className="space-y-3 pt-6">
        <div className={`inline-flex rounded-full border border-input bg-surface-raised p-2 ${accent}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-content">{label}</p>
          <p className={`font-heading text-3xl font-semibold tracking-tight ${accent}`}>{value}</p>
        </div>
        <p className="text-sm leading-6 text-content">{description}</p>
      </CardContent>
    </Card>
  );
}
