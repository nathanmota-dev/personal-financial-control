"use client";

import { Scale } from "lucide-react";
import { FinanceMetric } from "@/components/finance/finance-metric";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { expenseGroupDefinitions, formatExpenseShare } from "@/lib/expense-groups-presentation";
import type { ExpenseGroupCardsProps } from "@/lib/interfaces/expense-groups";

export function ExpenseGroupsCards({ totals }: ExpenseGroupCardsProps) {
  const { formatCurrency, protect } = useFinancialFormatter();
  return <section aria-label="Totais por grupo de despesa" className="grid gap-4 sm:grid-cols-3">
    {expenseGroupDefinitions.map((group) => <FinanceMetric key={group.key} label={group.label}
      value={formatCurrency(totals[group.amountKey])} icon={<Scale />}
      description={<>{protect(formatExpenseShare(totals[group.shareKey]))} do total do período</>} />)}
  </section>;
}
