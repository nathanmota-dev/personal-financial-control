"use client";

import { Meter } from "@/components/finance/ds/meter";
import { toneForKey } from "@/lib/finance-tone";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { CreditCardTransactionsPanelProps } from "@/lib/interfaces/credit-card-view";
import { TransactionEmptyState } from "./transaction-empty-state";

export function CategoryBreakdown({
  categoryTotals,
}: {
  categoryTotals: CreditCardTransactionsPanelProps["categoryTotals"];
}) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const largest = Math.max(...categoryTotals.map((category) => Math.abs(category.amountCents)), 1);

  if (!categoryTotals.length) {
    return <TransactionEmptyState query="" />;
  }

  return (
    <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
      {categoryTotals.map((category) => (
        <div key={category.categoryId} className="rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p data-user-content className="truncate font-medium text-content-strong">{category.categoryName}</p>
              <p className="mt-1 text-xs text-content">{category.group === "fixed_expense" ? "Gasto fixo" : "Gasto variável"}</p>
            </div>
            <p className="shrink-0 font-semibold text-content-strong tabular-nums">{formatCurrency(category.amountCents)}</p>
          </div>
          <Meter className="mt-4" tone={toneForKey(category.categoryName)} value={hidden ? 0 : Math.max((Math.abs(category.amountCents) / largest) * 100, 4)} />
        </div>
      ))}
    </div>
  );
}
