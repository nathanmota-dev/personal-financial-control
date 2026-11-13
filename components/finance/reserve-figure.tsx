"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { ReserveFigureProps } from "@/lib/interfaces/investment-reserve";
import { cn } from "@/lib/utils";

export function ReserveFigure({ label, value }: ReserveFigureProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <div className="min-w-0">
      <dt className="text-xs text-content">{label}</dt>
      <dd className={cn("mt-1 text-[15px] font-semibold tabular-nums", value < 0 ? "text-destructive" : "text-content-strong")}>{formatCurrency(value)}</dd>
    </div>
  );
}
