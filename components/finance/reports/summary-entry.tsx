import { ReportEntrySource } from "@/components/finance/reports/entry-source";
import { ReportEntryStatus } from "@/components/finance/reports/entry-status";
import { formatCurrency, formatMonthLabel } from "@/lib/finance-ui";
import type { ReportEntryProps } from "@/lib/interfaces/reports";

export function SummaryEntry({ entry }: ReportEntryProps) {
  return <li className="min-w-0 space-y-2 py-3 first:pt-0 last:pb-0">
    <div className="flex items-start justify-between gap-3"><p className="min-w-0 break-words text-sm font-medium">{entry.description}</p><p className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(entry.amountCents)}</p></div>
    <p className="text-xs leading-5 text-content">{formatMonthLabel(entry.month)} · {entry.account}</p>
    <div className="flex flex-wrap items-center gap-2"><ReportEntryStatus entry={entry} /><ReportEntrySource entry={entry} /></div>
  </li>;
}
