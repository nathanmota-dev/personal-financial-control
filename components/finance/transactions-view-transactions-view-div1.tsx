"use client";

import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import { DeleteTransactionDialog } from "@/components/finance/transaction-actions";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from "@/components/ui/table";
import { formatDateLabel, getStatusTone, getTransactionTone, transactionStatusLabels, transactionTypeLabels } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { TransactionsViewDiv1Props } from "@/lib/interfaces/render/transactions-view-transactions-view-div1";
import { Pencil } from "lucide-react";

export function TransactionsViewDiv1({ transactions, accounts, categories, filters, afterLastCategorization }: TransactionsViewDiv1Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
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
                                <p data-user-content className="font-medium text-content-strong">{transaction.description}</p>
                                {transaction.notes ? <p data-user-content className="text-xs text-content">{transaction.notes}</p> : null}
                                {transaction.isGeneratedByFunding ? (
                                  <p className="mt-1 text-xs font-medium text-warning">Resgate automático</p>
                                ) : transaction.fundingSource === "investments" ? (
                                  <p className="mt-1 text-xs font-medium text-brand">Pago com investimentos</p>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell data-user-content>{transaction.account?.name ?? "-"}</TableCell>
                            <TableCell>{transaction.category ? <span data-user-content>{transaction.category.name}</span> : "Sem categoria"}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <StatusDotBadge tone={getTransactionTone(transaction.type)}>
                                  {transactionTypeLabels[transaction.type]}
                                </StatusDotBadge>
                                {transaction.isGeneratedByFunding ? (
                                  <Badge className="bg-warning/10 text-warning ring-1 ring-warning/20">Automático</Badge>
                                ) : transaction.fundingSource === "investments" ? (
                                  <Badge className="bg-brand/10 text-brand ring-1 ring-brand/20">Investimentos</Badge>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusDotBadge tone={getStatusTone(transaction.status)}>
                                {transactionStatusLabels[transaction.status]}
                              </StatusDotBadge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(transaction.amountCents)}</TableCell>
                            <TableCell className="text-right">
                              {transaction.isGeneratedByFunding ? (
                                <span className="text-xs text-content">Gerenciado pela despesa</span>
                              ) : (
                                <div className="flex justify-end gap-2">
                                  <TransactionDialog
                                    accounts={accounts}
                                    categories={categories}
                                    month={filters.month}
                                    transaction={transaction}
                                    afterCategorization={afterLastCategorization}
                                    trigger={
                                      <Button variant="outline" size="icon-sm" aria-label="Editar lançamento">
                                        <Pencil className="size-4" />
                                      </Button>
                                    }
                                  />
                                  <DeleteTransactionDialog id={transaction.id} />
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
  );
}
