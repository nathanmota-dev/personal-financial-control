"use client";

import type { PredictabilityExpenseRowProps } from "@/app/interfaces/predictability";
import { financeItemClassName } from "@/components/finance/finance-styles";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { cn } from "@/lib/utils";

export function PredictabilityExpenseRow({ expense }: PredictabilityExpenseRowProps) {
  const { formatCurrency } = useFinancialFormatter();
  const isRefund = expense.amountCents < 0;
  const origin = [expense.categoryName, expense.accountName].filter(Boolean).join(" · ");

  return (
    <li className={cn(financeItemClassName, "flex items-start justify-between gap-3 p-3")}>
      <div className="min-w-0">
        <p data-user-content className="font-medium text-content-strong">{expense.description}</p>
        {origin ? <p data-user-content className="mt-1 text-xs text-content">{origin}</p> : null}
      </div>
      <p className={cn("shrink-0 font-semibold tabular-nums", isRefund ? "text-success" : "text-danger")}>
        {isRefund ? "+" : "−"}
        {formatCurrency(Math.abs(expense.amountCents))}
      </p>
    </li>
  );
}
