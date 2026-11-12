"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatCreditCardMonthShort } from "@/lib/credit-card-view";
import type { CreditCardInvoiceTileProps } from "@/lib/interfaces/credit-card-view";
import { cn } from "@/lib/utils";

const valueTone = { success: "text-success", danger: "text-destructive", neutral: "text-content" } as const;

export function CreditCardInvoiceTile({ node, selected, onSelect }: CreditCardInvoiceTileProps) {
  const { formatCurrency } = useFinancialFormatter();
  const { point, projected, tone } = node;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex h-[132px] w-full min-w-0 flex-col items-center justify-between rounded-[14px] border px-1 py-3.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        selected ? "border-border bg-card shadow-sm" : "border-border/70 hover:bg-card/60",
      )}
    >
      <span className={cn("text-xs font-medium", selected ? "text-content-strong" : "text-content")}>{formatCreditCardMonthShort(point.month)}</span>
      <span className={cn("max-w-full truncate text-[13px] font-semibold", projected ? "text-content-subtle" : valueTone[tone])}>
        {formatCurrency(point.totalCents)}
      </span>
    </button>
  );
}
