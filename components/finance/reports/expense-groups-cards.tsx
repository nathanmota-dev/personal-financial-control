"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { expenseGroupDefinitions, formatExpenseShare } from "@/lib/expense-groups-presentation";
import type { ExpenseGroupCardsProps } from "@/lib/interfaces/expense-groups";

export function ExpenseGroupsCards({ totals }: ExpenseGroupCardsProps) {
  const { formatCurrency, protect, hidden } = useFinancialFormatter();
  return (
    <section aria-label="Totais por grupo de despesa" className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <h2 className="text-sm font-semibold text-content-strong">Totais por grupo de despesa</h2>
      <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-3">
        {expenseGroupDefinitions.map((group) => {
          const share = totals[group.shareKey];
          return (
            <article key={group.key} aria-label={group.label} className="min-w-0">
              <p className="flex items-center gap-2 text-xs text-content">
                <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
                {group.label}
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight break-words tabular-nums text-content-strong">{formatCurrency(totals[group.amountKey])}</p>
              <div aria-hidden className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--chart-rail)]">
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${hidden ? 0 : Math.min(100, Math.max(0, (share ?? 0) * 100))}%`, backgroundColor: group.color }} />
              </div>
              <p className="mt-1.5 text-[11px] text-content-subtle">{protect(formatExpenseShare(share))} do total do período</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
