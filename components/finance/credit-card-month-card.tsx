"use client";
import { formatCreditCardMonth } from "@/lib/credit-card-view";
import { formatCurrency } from "@/lib/finance-ui";
import type {
CreditCardMonthPoint
} from "@/lib/interfaces/credit-card-view";
import { cn } from "@/lib/utils";
import { ArrowDownRight,ArrowUpRight } from "lucide-react";

export function CreditCardMonthCard({
  point,
  previousPoint,
  selected,
  onSelect,
}: {
  point: CreditCardMonthPoint;
  previousPoint?: CreditCardMonthPoint;
  selected: boolean;
  onSelect: () => void;
}) {
  const isIncrease = previousPoint && point.totalCents > previousPoint.totalCents;
  const hasChange = previousPoint && point.totalCents !== previousPoint.totalCents;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "min-w-0 rounded-2xl border px-3 py-3 text-left transition-all duration-200",
        selected
          ? "border-brand/90 bg-brand/10 shadow-none ring-1 ring-brand/25"
          : "border-border bg-muted/30 hover:border-input hover:bg-card"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={cn("truncate text-sm font-medium", selected ? "text-content-strong" : "text-content")}>
          {formatCreditCardMonth(point.month)}
        </span>
        {hasChange ? (
          isIncrease ? <ArrowUpRight className="size-3.5 shrink-0 text-danger" /> : <ArrowDownRight className="size-3.5 shrink-0 text-success" />
        ) : null}
      </div>
      <p className={cn("mt-2 truncate text-lg font-semibold", selected ? "text-brand" : "text-content")}>
        {formatCurrency(point.totalCents)}
      </p>
      <p className="mt-1 truncate text-[0.68rem] text-content">
        {point.billStatus === "paid"
          ? "Paga"
          : point.entryCount
            ? `${point.entryCount} lançamento${point.entryCount === 1 ? "" : "s"}`
            : "Sem parcelas"}
      </p>
    </button>
  );
}
