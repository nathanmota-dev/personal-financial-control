"use client";

import { useMemo,useState } from "react";
import { SectionCard } from "@/components/finance/ds/section-card";
import { TransactionList } from "@/components/finance/transaction-list";
import { TransactionsHero } from "@/components/finance/transactions-hero";
import { TransferList } from "@/components/finance/transfer-list";
import { ArrowLeftRight, ListFilter, Receipt } from "lucide-react";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
import {
CategorySetupDialog,
SetupCallout,
} from "@/components/finance/setup-dialogs";
import { TransferDialog } from "@/components/finance/transaction-actions";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { TransactionFilters } from "@/components/finance/transaction-filters";
import { Tabs,TabsContent,TabsList,TabsTrigger } from "@/components/ui/tabs";
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
    <div className="space-y-6">
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

      <TransactionsHero month={filters.month} totals={totals} transactions={transactions} />

      <Tabs defaultValue={filters.section === "transfers" ? "transfers" : "transactions"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList variant="line">
            <TabsTrigger value="transactions"><Receipt />Lançamentos</TabsTrigger>
            <TabsTrigger value="transfers"><ArrowLeftRight />Transferências</TabsTrigger>
          </TabsList>
          <p className="flex items-center gap-1.5 text-xs text-content-muted"><ListFilter aria-hidden="true" className="size-3.5" />{transactions.length} lançamento(s) no filtro atual</p>
        </div>

        <TransactionFilters accounts={accounts} categories={categories} filters={filters} />

        <TabsContent value="transactions">
          <SectionCard title="Extrato do período" count={transactions.length} icon={<Receipt />} description={`Agrupados por data em ${formatMonthLabel(filters.month)}.`}>
            {transactions.length ? (
              <TransactionList transactions={transactions} accounts={accounts} categories={categories} filters={filters} afterLastCategorization={afterLastCategorization} />
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
          </SectionCard>
        </TabsContent>

        <TabsContent value="transfers">
          <TransferList transfers={transfers} accounts={accounts} filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
