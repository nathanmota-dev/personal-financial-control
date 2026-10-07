"use client";

import { ReceiptText } from "lucide-react";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { financeIconClassName } from "@/components/finance/finance-styles";
import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDateLabel } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { BudgetExpensesProps } from "@/lib/interfaces/budgets";

export function BudgetExpenses({ row }: BudgetExpensesProps) {
  const { formatCurrency } = useFinancialFormatter();
  return <Dialog>
    <DialogTrigger asChild><Button variant="ghost" size="sm" className="px-0 text-content" aria-label={`Conferir despesas de ${row.categoryName} (${row.expenses.length})`}><ReceiptText className="size-4" />{row.expenses.length} despesa(s)</Button></DialogTrigger>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-border bg-card sm:max-w-2xl">
      <DialogHeader><DialogTitle>Despesas de {row.categoryName}</DialogTitle><DialogDescription>Confira os lançamentos, parcelas e créditos que compõem esta categoria.</DialogDescription></DialogHeader>
      {row.expenses.length ? <ul className="divide-y divide-border">{row.expenses.map((expense) => <li key={expense.id} className="flex gap-3 py-4">
        <span className={`${financeIconClassName} size-10 shrink-0`}><ReceiptText className="size-[18px]" /></span>
        <div className="min-w-0 flex-1 space-y-1"><p className="text-sm font-semibold">{expense.description}</p><p className="text-xs text-content-subtle">{expense.accountName} · {expense.origin} · {formatDateLabel(expense.date)}</p><StatusDotBadge tone={expense.pending ? "text-warning" : "text-success"}>{expense.pending ? "Pendente" : "Realizado"}</StatusDotBadge></div>
        <div className="shrink-0 text-right"><p className="text-sm font-semibold tabular-nums">{formatCurrency(expense.amountCents)}</p>{expense.amountCents < 0 && <p className="mt-1 text-xs text-success">Crédito</p>}</div>
      </li>)}</ul> : <FinanceEmptyState title="Nenhuma despesa nesta competência" description="Os lançamentos desta categoria aparecerão aqui quando forem registrados." />}
    </DialogContent>
  </Dialog>;
}
