"use client";

import { useMemo } from "react";
import { Pencil } from "lucide-react";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
import { DeleteTransactionDialog, TransferDialog } from "@/components/finance/transaction-actions";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { TransactionFilters } from "@/components/finance/transaction-filters";
import { TransactionSummaryCard } from "@/components/finance/transaction-summary-card";
import {
  CategorySetupDialog,
  SetupCallout,
} from "@/components/finance/setup-dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TransactionsViewProps } from "@/lib/interfaces/transactions";
import {
  formatCurrency,
  formatDateLabel,
  formatMonthLabel,
  getStatusTone,
  getTransactionTone,
  transactionStatusLabels,
  transactionTypeLabels,
} from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lançamentos"
        title={`Movimentações de ${formatMonthLabel(filters.month)}`}
        description="Registre receitas e despesas mesmo quando ainda não souber a categoria. A categorização pode acontecer depois pelo filtro Sem categoria."
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
          <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
            <CardHeader>
              <CardTitle>Lista principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transactions.length ? (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Conta</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDateLabel(transaction.transactionDate)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-slate-100">{transaction.description}</p>
                                {transaction.notes ? <p className="text-xs text-slate-400">{transaction.notes}</p> : null}
                              </div>
                            </TableCell>
                            <TableCell>{transaction.account?.name ?? "-"}</TableCell>
                            <TableCell>{transaction.category?.name ?? "Sem categoria"}</TableCell>
                            <TableCell>
                              <Badge className={cn("ring-1", getTransactionTone(transaction.type))}>
                                {transactionTypeLabels[transaction.type]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("ring-1", getStatusTone(transaction.status))}>
                                {transactionStatusLabels[transaction.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(transaction.amountCents)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <TransactionDialog
                                  accounts={accounts}
                                  categories={categories}
                                  month={filters.month}
                                  transaction={transaction}
                                  trigger={
                                    <Button variant="outline" size="icon-sm" aria-label="Editar lançamento">
                                      <Pencil className="size-4" />
                                    </Button>
                                  }
                                />
                                <DeleteTransactionDialog id={transaction.id} />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid gap-3 md:hidden">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="rounded-2xl border border-slate-800 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-100">{transaction.description}</p>
                            <p className="text-sm text-slate-400">
                              {formatDateLabel(transaction.transactionDate)} • {transaction.account?.name ?? "-"}
                            </p>
                          </div>
                          <p className="font-semibold text-slate-100">{formatCurrency(transaction.amountCents)}</p>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{transaction.category?.name ?? "Sem categoria"}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge className={cn("ring-1", getTransactionTone(transaction.type))}>{transactionTypeLabels[transaction.type]}</Badge>
                          <Badge className={cn("ring-1", getStatusTone(transaction.status))}>{transactionStatusLabels[transaction.status]}</Badge>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <TransactionDialog
                            accounts={accounts}
                            categories={categories}
                            month={filters.month}
                            transaction={transaction}
                            trigger={<Button variant="outline" className="flex-1">Editar</Button>}
                          />
                          <DeleteTransactionDialog id={transaction.id} />
                        </div>
                      </div>
                    ))}
                  </div>
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

        <TabsContent value="transfers">
          <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
            <CardHeader>
              <CardTitle>Transferências do mês</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {transfers.length ? (
                transfers.map((transfer) => (
                  <div key={transfer.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 p-4 md:flex-row md:items-center">
                    <div>
                      <p className="font-medium text-slate-100">{transfer.description}</p>
                      <p className="text-sm text-slate-400">
                        {formatDateLabel(transfer.transferDate)} • {transfer.fromAccount?.name ?? "-"} para {transfer.toAccount?.name ?? "-"}
                      </p>
                    </div>
                    <p className="font-semibold text-cyan-300">{formatCurrency(transfer.amountCents)}</p>
                  </div>
                ))
              ) : (
                <FinanceEmptyState
                  title="Sem transferências"
                  description="Transferências exigem pelo menos duas contas cadastradas."
                  action={
                    accounts.length >= 2 ? (
                      <TransferDialog accounts={accounts} month={filters.month} />
                    ) : (
                      <SetupCallout title="Cadastre duas contas" description="Crie pelo menos duas contas para movimentar saldo entre origem e destino." />
                    )
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
