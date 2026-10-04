"use client";

import { useMemo } from "react";
import { TransactionsViewDiv1 } from "./transactions-view-transactions-view-div1";
import { TransactionsViewDiv2 } from "./transactions-view-transactions-view-div2";
import { TransactionsViewTabsContent3 } from "./transactions-view-transactions-view-tabs-content3";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
import {
CategorySetupDialog,
SetupCallout,
} from "@/components/finance/setup-dialogs";
import { TransferDialog } from "@/components/finance/transaction-actions";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { TransactionFilters } from "@/components/finance/transaction-filters";
import { TransactionSummaryCard } from "@/components/finance/transaction-summary-card";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Tabs,TabsContent,TabsList,TabsTrigger } from "@/components/ui/tabs";
import {
formatCurrency,
formatMonthLabel
} from "@/lib/finance-ui";
import type { TransactionsViewProps } from "@/lib/interfaces/transactions";

export function TransactionsView({
  accounts,
  categories,
  transactions,
  transfers,
  filters,
}: TransactionsViewProps) {
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lançamentos"
        title="Lançamentos"
        description={`Receitas, despesas e transferências de ${formatMonthLabel(filters.month)}.`}
        actions={
          <>
            <CategorySetupDialog />
            <TransactionDialog accounts={accounts} categories={categories} month={filters.month} />
            <TransferDialog accounts={accounts} month={filters.month} />
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TransactionSummaryCard label="Receitas filtradas" value={formatCurrency(totals.income)} tone="cyan" />
        <TransactionSummaryCard label="Despesas filtradas" value={formatCurrency(totals.expense)} tone="blue" />
        <TransactionSummaryCard label="Aportes filtrados" value={formatCurrency(totals.investment)} tone="sky" />
        <TransactionSummaryCard label="Resgates filtrados" value={formatCurrency(totals.withdrawal)} tone="amber" />
      </section>

      <TransactionFilters accounts={accounts} categories={categories} filters={filters} />

      <Tabs defaultValue={filters.section === "transfers" ? "transfers" : "transactions"}>
        <TabsList variant="line">
          <TabsTrigger value="transactions">Lançamentos</TabsTrigger>
          <TabsTrigger value="transfers">Transferências</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card className="rounded-xl border-border bg-card">
            <CardHeader>
              <CardTitle>Lista principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transactions.length ? (
                <>
                  <TransactionsViewDiv1 transactions={transactions} accounts={accounts} categories={categories} filters={filters} afterLastCategorization={afterLastCategorization} />

                  <TransactionsViewDiv2 transactions={transactions} accounts={accounts} categories={categories} filters={filters} afterLastCategorization={afterLastCategorization} />
                </>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TransactionsViewTabsContent3 transfers={transfers} accounts={accounts} filters={filters} />
      </Tabs>
    </div>
  );
}
