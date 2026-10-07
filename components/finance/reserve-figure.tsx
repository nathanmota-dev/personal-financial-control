"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { ReserveFigureProps } from "@/lib/interfaces/investment-reserve";

export function ReserveFigure({ label, value }: ReserveFigureProps) {
  const { formatCurrency } = useFinancialFormatter();
  return <div><p className="text-[10px] font-medium text-content-muted">{label}</p><p className={`mt-1 tabular-nums text-lg ${value < 0 ? "text-danger" : "text-content-strong"}`}>{formatCurrency(value)}</p></div>;
}
