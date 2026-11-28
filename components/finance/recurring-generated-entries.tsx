"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel } from "@/lib/finance-ui";
import type { RecurringGeneratedEntriesProps } from "@/lib/interfaces/recurring";

/** Occurrences the app created from the rule: they already pay it, so nothing else is linked. */
export function RecurringGeneratedEntries({ entries }: RecurringGeneratedEntriesProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <ul aria-label="Gerados pelo app" className="divide-y divide-border text-[13px]">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
          <span className="min-w-0">
            <span data-user-content className="block truncate font-medium text-content-strong">{entry.description}</span>
            <span className="block text-[11px] text-content-subtle">{`${formatDateLabel(entry.date)} · gerado pelo app a partir desta recorrência`}</span>
          </span>
          <span className="shrink-0 font-semibold tabular-nums text-content-strong">{formatCurrency(entry.amountCents)}</span>
        </li>
      ))}
    </ul>
  );
}
