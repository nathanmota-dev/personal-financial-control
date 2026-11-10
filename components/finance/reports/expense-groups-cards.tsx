"use client";
import { CircleHelp, Home, ShoppingBag } from "lucide-react";
import { Meter } from "@/components/finance/ds/meter";
import { FinanceMetric } from "@/components/finance/finance-metric";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { expenseGroupDefinitions, formatExpenseShare } from "@/lib/expense-groups-presentation";
import type { ExpenseGroupCardsProps } from "@/lib/interfaces/expense-groups";

const presentation = {
  fixed: { tone: "brand", icon: Home },
  variable: { tone: "warning", icon: ShoppingBag },
  unclassified: { tone: "neutral", icon: CircleHelp },
} as const;

export function ExpenseGroupsCards({ totals }: ExpenseGroupCardsProps) {
  const { formatCurrency, protect, hidden } = useFinancialFormatter();
  return <section aria-label="Totais por grupo de despesa" className="grid gap-4 sm:grid-cols-3">
    {expenseGroupDefinitions.map((group) => {
      const { tone, icon: Icon } = presentation[group.key];
      return <FinanceMetric key={group.key} label={group.label} tone={tone}
        value={formatCurrency(totals[group.amountKey])} icon={<Icon />}
        description={<>{protect(formatExpenseShare(totals[group.shareKey]))} do total do período</>}
        footer={<Meter size="sm" tone={tone} value={hidden ? 0 : Math.max(0, (totals[group.shareKey] ?? 0) * 100)} />} />;
    })}
  </section>;
}
