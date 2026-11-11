"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatCurrency as formatPlainCurrency } from "@/lib/finance-ui";
import { splitCurrency } from "@/lib/dashboard-cards";
import type { DashboardCardsMoneyProps } from "@/lib/interfaces/dashboard-cards";
import { cn } from "@/lib/utils";

export function DashboardCardsMoney({ cents, className }: DashboardCardsMoneyProps) {
  const { hidden, formatCurrency } = useFinancialFormatter();
  if (hidden) return <span className={className}>{formatCurrency(cents)}</span>;
  const { main, cents: decimals } = splitCurrency(formatPlainCurrency(cents).replace(/ /g, " "));
  return (
    <span className={cn("tracking-tight", className)}>
      {main}
      <span className="text-[0.4em] font-semibold">{decimals}</span>
    </span>
  );
}
