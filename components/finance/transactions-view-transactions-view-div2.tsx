"use client";

import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import { DeleteTransactionDialog } from "@/components/finance/transaction-actions";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateLabel, getStatusTone, getTransactionTone, transactionStatusLabels, transactionTypeLabels } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { TransactionsViewDiv2Props } from "@/lib/interfaces/render/transactions-view-transactions-view-div2";

export function TransactionsViewDiv2({ transactions, accounts, categories, filters, afterLastCategorization }: TransactionsViewDiv2Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
<div className="grid gap-3 md:hidden">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="rounded-2xl border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-content-strong">{transaction.description}</p>
                            <p className="text-sm text-content">
                              {formatDateLabel(transaction.transactionDate)} • {transaction.account?.name ?? "-"}
                            </p>
                            {transaction.isGeneratedByFunding ? (
                              <p className="mt-1 text-xs font-medium text-warning">Resgate automático</p>
                            ) : transaction.fundingSource === "investments" ? (
                              <p className="mt-1 text-xs font-medium text-brand">Pago com investimentos</p>
                            ) : null}
                          </div>
                          <p className="font-semibold text-content-strong">{formatCurrency(transaction.amountCents)}</p>
                        </div>
                        <p className="mt-2 text-xs text-content">{transaction.category?.name ?? "Sem categoria"}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusDotBadge tone={getTransactionTone(transaction.type)}>{transactionTypeLabels[transaction.type]}</StatusDotBadge>
                          {transaction.isGeneratedByFunding ? (
                            <Badge className="bg-warning/10 text-warning ring-1 ring-warning/20">Automático</Badge>
                          ) : transaction.fundingSource === "investments" ? (
                            <Badge className="bg-brand/10 text-brand ring-1 ring-brand/20">Investimentos</Badge>
                          ) : null}
                          <StatusDotBadge tone={getStatusTone(transaction.status)}>{transactionStatusLabels[transaction.status]}</StatusDotBadge>
                        </div>
                        {transaction.isGeneratedByFunding ? (
                          <p className="mt-4 text-xs text-content">Gerenciado pela despesa vinculada</p>
                        ) : (
                          <div className="mt-4 flex gap-2">
                            <TransactionDialog
                              accounts={accounts}
                              categories={categories}
                              month={filters.month}
                              transaction={transaction}
                              afterCategorization={afterLastCategorization}
                              trigger={<Button variant="outline" className="flex-1">Editar</Button>}
                            />
                            <DeleteTransactionDialog id={transaction.id} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
  );
}
