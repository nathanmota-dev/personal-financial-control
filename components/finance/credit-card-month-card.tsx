"use client";
import { formatCreditCardMonth } from "@/lib/credit-card-view";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type {
CreditCardMonthCardProps
} from "@/lib/interfaces/credit-card-view";
import { cn } from "@/lib/utils";
import { ArrowDownRight,ArrowUpRight } from "lucide-react";

export function CreditCardMonthCard({
  point,
  previousPoint,
  selected,
  onSelect,
}: CreditCardMonthCardProps) {
  const { formatCurrency } = useFinancialFormatter();
  const isIncrease = previousPoint && point.totalCents > previousPoint.totalCents;
  const hasChange = previousPoint && point.totalCents !== previousPoint.totalCents;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "min-w-0 rounded-2xl border px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-transparent bg-surface hover:border-border"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={cn("truncate text-sm font-medium", selected ? "text-primary-foreground" : "text-content")}>
          {formatCreditCardMonth(point.month)}
        </span>
        {hasChange ? (
          isIncrease ? <ArrowUpRight className="size-3.5 shrink-0 text-danger" /> : <ArrowDownRight className="size-3.5 shrink-0 text-success" />
        ) : null}
      </div>
      <p className={cn("mt-2 truncate text-lg font-semibold", selected ? "text-primary-foreground" : "text-content-strong")}>
        {formatCurrency(point.totalCents)}
      </p>
      <p className={cn("mt-1 truncate text-[11px]", selected ? "text-primary-foreground/80" : "text-content-subtle")}>
        {point.billStatus === "paid"
          ? "Paga"
          : point.entryCount
            ? `${point.entryCount} lançamento${point.entryCount === 1 ? "" : "s"}`
            : "Sem parcelas"}
      </p>
    </button>
  );
}
