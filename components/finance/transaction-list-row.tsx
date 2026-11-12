"use client";

import { CategoryChip } from "@/components/finance/ds/category-chip";
import { IconTile } from "@/components/finance/ds/icon-tile";
import { ToneChip } from "@/components/finance/ds/tone-chip";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { DeleteTransactionDialog } from "@/components/finance/transaction-actions";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { Button } from "@/components/ui/button";
import { toneClass, toneForStatus, toneForTransactionType } from "@/lib/finance-tone";
import { transactionStatusLabels, transactionTypeLabels } from "@/lib/finance-ui";
import type { TransactionListRowProps } from "@/lib/interfaces/transactions";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Pencil, TrendingDown, TrendingUp } from "lucide-react";

const typeIcons = {
  income: TrendingUp,
  expense: TrendingDown,
  investment_contribution: ArrowUpRight,
  investment_withdrawal: ArrowDownLeft,
};
const typeSigns = { income: "+", expense: "−", investment_contribution: "", investment_withdrawal: "" };

export function TransactionListRow({ transaction, accounts, categories, filters, afterLastCategorization }: TransactionListRowProps) {
  const { formatCurrency } = useFinancialFormatter();
  const Icon = typeIcons[transaction.type];
  const tone = toneForTransactionType(transaction.type);
  const cancelled = transaction.status === "cancelled";
  return (
    <div
      role="row"
      className="group/row grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-[22px] py-3.5 transition-colors hover:bg-muted/40 md:grid-cols-[auto_minmax(0,2.4fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(7.5rem,auto)_auto] md:gap-x-4"
    >
      <span role="cell"><IconTile tone={tone}><Icon /></IconTile></span>
      <div role="cell" className="min-w-0">
        <p data-user-content className={cn("truncate text-[13px] font-semibold text-content-strong", cancelled && "line-through opacity-60")}>{transaction.description}</p>
        <p className="truncate text-xs text-content-muted">
          {transactionTypeLabels[transaction.type]} · {transaction.account ? <span data-user-content>{transaction.account.name}</span> : "-"}
          {transaction.notes ? <> · <span data-user-content>{transaction.notes}</span></> : null}
        </p>
        {transaction.isGeneratedByFunding ? (
          <p className="mt-0.5 text-xs font-medium text-warning">Resgate automático</p>
        ) : transaction.fundingSource === "investments" ? (
          <p className="mt-0.5 text-xs font-medium text-brand">Pago com investimentos</p>
        ) : null}
      </div>
      <p role="cell" className={cn("text-right text-[13px] font-semibold whitespace-nowrap tabular-nums md:order-5", toneClass(tone), transaction.type === "income" ? "tone-text" : "text-content-strong", cancelled && "opacity-60")}>
        {typeSigns[transaction.type]}{formatCurrency(transaction.amountCents)}
      </p>
      <div role="cell" className="col-span-2 col-start-2 flex min-w-0 flex-wrap items-center gap-1.5 md:col-span-1 md:col-start-auto">
        <CategoryChip name={transaction.category?.name} />
        {transaction.isGeneratedByFunding ? <ToneChip tone="warning">Automático</ToneChip> : transaction.fundingSource === "investments" ? <ToneChip tone="brand">Investimentos</ToneChip> : null}
      </div>
      <div role="cell" className="col-start-2 md:col-start-auto">
        <ToneChip tone={toneForStatus(transaction.status)} dot>{transactionStatusLabels[transaction.status]}</ToneChip>
      </div>
      <div role="cell" className="col-start-3 flex justify-end gap-1 md:order-6 md:col-start-auto md:min-w-[4.5rem]">
        {transaction.isGeneratedByFunding ? (
          <span className="max-w-[7rem] text-right text-[11px] leading-4 text-content-muted">Gerenciado pela despesa</span>
        ) : (
          <>
            <TransactionDialog
              accounts={accounts}
              categories={categories}
              month={filters.month}
              transaction={transaction}
              afterCategorization={afterLastCategorization}
              trigger={<Button variant="ghost" size="icon-sm" aria-label="Editar lançamento"><Pencil className="size-4" /></Button>}
            />
            <DeleteTransactionDialog id={transaction.id} />
          </>
        )}
      </div>
    </div>
  );
}
