"use client";

import { ReportEntrySource } from "@/components/finance/reports/entry-source";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel } from "@/lib/finance-ui";
import type { ExpenseGroupMobileProps } from "@/lib/interfaces/expense-groups";

export function ExpenseGroupMobile({ item }: ExpenseGroupMobileProps) {
  const { formatCurrency } = useFinancialFormatter();
  return <li className="min-w-0 rounded-2xl border border-border p-4">
    <p data-user-content className="break-words font-medium text-content-strong">{item.description}</p>
    <p className="mt-2 font-semibold tabular-nums">{formatCurrency(item.amountCents)}</p>
    <p className="mt-2 break-words text-xs text-content"><span data-user-content>{item.categoryName}</span> · <span data-user-content>{item.accountName}</span></p>
    <p className="my-3 text-xs text-content-muted">{formatDateLabel(item.expenseDate)}</p>
    <ReportEntrySource entry={{ source: item.source, month: item.competenceMonth }} badgeOnly />
  </li>;
}
