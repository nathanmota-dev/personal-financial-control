"use client";

import type { PredictabilityBudgetRowProps } from "@/app/interfaces/predictability";
import { ToneChip } from "@/components/finance/ds/tone-chip";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import { budgetItemLabels } from "./labels";

export function PredictabilityBudgetRow({ item }: PredictabilityBudgetRowProps) {
  const { formatCurrency } = useFinancialFormatter();
  const isIncome = item.kind === "income";

  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
      <div className="min-w-0">
        <p data-user-content className="truncate font-medium text-content-strong">{item.description}</p>
        <p className="mt-0.5 text-xs text-content-muted">
          {formatDateLabel(item.date)}
          {item.accountName ? <span data-user-content>{` · ${item.accountName}`}</span> : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ToneChip tone={isIncome ? "success" : item.kind === "credit_card" ? "brand" : "neutral"}>
          {budgetItemLabels[item.kind]}
        </ToneChip>
        <span className={cn("font-semibold tabular-nums", isIncome ? "text-success" : "text-content-strong")}>
          {isIncome ? "+" : "−"}
          {formatCurrency(item.amountCents)}
        </span>
      </div>
    </li>
  );
}
