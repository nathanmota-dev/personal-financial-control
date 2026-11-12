"use client";

import { useMemo,useState } from "react";
import { DashboardCategoryBars } from "@/components/finance/dashboard-category-bars";
import { TransactionList } from "@/components/finance/transaction-list";
import { TransactionsSummary } from "@/components/finance/transactions-summary";
import { TransferList } from "@/components/finance/transfer-list";
import { ArrowLeftRight, Receipt } from "lucide-react";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
import {
CategorySetupDialog,
SetupCallout,
} from "@/components/finance/setup-dialogs";
import { TransferDialog } from "@/components/finance/transaction-actions";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { TransactionFilters } from "@/components/finance/transaction-filters";
import { Badge } from "@/components/ui/badge";
import { Tabs,TabsContent,TabsList,TabsTrigger } from "@/components/ui/tabs";
import { buildDashboardCategoryDistribution } from "@/lib/dashboard-categories";
import { buildTransactionsSpending } from "@/lib/transactions-summary";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { TransactionsViewProps } from "@/lib/interfaces/transactions";
import type { FinanceCommandIntent } from "@/lib/interfaces/finance-command";
import { TRANSACTION_COMMAND_ACTIONS } from "@/lib/finance-command-catalog";
import { useFinanceCommandIntent } from "@/hooks/finance/use-finance-command-intent";
import { toast } from "sonner";

export function TransactionsView({
  accounts,
  categories,
  transactions,
  transfers,
  filters,
  loadError = false,
}: TransactionsViewProps) {
  const [commandIntent, setCommandIntent] = useState<FinanceCommandIntent | null>(null);
  useFinanceCommandIntent(TRANSACTION_COMMAND_ACTIONS, (intent) => {
    if (loadError) {
      toast.error("Não foi possível carregar contas e categorias. Tente novamente.");
      return;
    }
    setCommandIntent(intent);
  });
  const totals = useMemo(
    () =>
      transactions.reduce(
        (accumulator, item) => {
          if (item.status === "cancelled") {
            return accumulator;
          }

          if (item.type === "income") accumulator.income += item.amountCents;
          if (item.type === "expense") accumulator.expense += item.amountCents;
          if (item.type === "investment_contribution") accumulator.investment += item.amountCents;
          if (item.type === "investment_withdrawal") accumulator.withdrawal += item.amountCents;
          return accumulator;
        },
        { income: 0, expense: 0, investment: 0, withdrawal: 0 }
      ),
    [transactions]
  );
  const hasSetup = accounts.length > 0;
  const afterLastCategorization =
    filters.uncategorized && transactions.length === 1
      ? `/transactions?month=${encodeURIComponent(filters.month)}`
      : undefined;

  return (
    <div className="space-y-6 min-[100.0625rem]:space-y-5">
      <PageHeader
        eyebrow="Lançamentos"
        title="Lançamentos"
        description={`Receitas, despesas e transferências de ${formatMonthLabel(filters.month)}.`}
        actions={
          <>
            <CategorySetupDialog />
            <TransactionDialog
              accounts={accounts}
              categories={categories}
              month={filters.month}
              command={commandIntent}
            />
            <TransferDialog
              accounts={accounts}
              month={filters.month}
              commandId={
                commandIntent?.action === "new-transfer" ? commandIntent.id : null
              }
            />
          </>
        }
      />

      <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
        <TransactionsSummary month={filters.month} totals={totals} />
        <DashboardCategoryBars
          distribution={buildDashboardCategoryDistribution(buildTransactionsSpending(transactions))}
          title="Para onde foi o dinheiro"
          description="Maiores categorias de despesa do período"
          emptyMessage="Nenhuma despesa neste período."
        />
      </div>

      <Tabs defaultValue={filters.section === "transfers" ? "transfers" : "transactions"} className="gap-0">
        <section className="min-w-0 overflow-hidden rounded-[20px] border border-border bg-card">
          <div className="flex flex-wrap items-start justify-between gap-3 px-[22px] pt-5">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold leading-[25px]">Extrato do período</h2>
                <Badge variant="outline" className="border-input text-content">{transactions.length}</Badge>
              </div>
              <p className="mt-1 text-xs text-content-muted">{`Agrupados por data em ${formatMonthLabel(filters.month)}, conforme os filtros.`}</p>
            </div>
            <TabsList variant="line">
              <TabsTrigger value="transactions"><Receipt />Lançamentos</TabsTrigger>
              <TabsTrigger value="transfers"><ArrowLeftRight />Transferências</TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-5">
            <TransactionFilters accounts={accounts} categories={categories} filters={filters} />
          </div>

          <TabsContent value="transactions">
            {transactions.length ? (
              <TransactionList transactions={transactions} accounts={accounts} categories={categories} filters={filters} afterLastCategorization={afterLastCategorization} />
            ) : (
              <div className="px-[22px] py-6">
                <FinanceEmptyState
                  title="Nenhum lançamento encontrado"
                  description="Registre uma receita ou despesa; a categoria pode ser escolhida agora ou adicionada depois."
                  action={
                    hasSetup ? (
                      <TransactionDialog accounts={accounts} categories={categories} month={filters.month} />
                    ) : (
                      <SetupCallout title="Cadastre uma conta" description="Você precisa de ao menos uma conta antes do primeiro lançamento." />
                    )
                  }
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="transfers">
            <TransferList transfers={transfers} accounts={accounts} filters={filters} />
          </TabsContent>
        </section>
      </Tabs>
    </div>
  );
}
