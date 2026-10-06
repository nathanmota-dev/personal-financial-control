import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import { ReportEntrySource } from "@/components/finance/reports/entry-source";
import { ReportEntryStatus } from "@/components/finance/reports/entry-status";
import { formatCurrency, formatMonthLabel, getTransactionTone, transactionTypeLabels } from "@/lib/finance-ui";
import type { TransactionType } from "@/lib/db/schema";
import type { ReportEntryProps } from "@/lib/interfaces/reports";

export function ReportEntryMobile({ entry }: ReportEntryProps) {
  return <div className="rounded-2xl border border-border p-4">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium text-content-strong">{entry.description}</p><p className="mt-1 text-xs text-content">{formatMonthLabel(entry.month)} · {entry.account}</p></div><p className="shrink-0 font-semibold tabular-nums">{formatCurrency(entry.amountCents)}</p></div>
    <p className="mt-2 text-xs text-content">{entry.category}</p>
    <div className="mt-3 flex flex-wrap gap-2"><StatusDotBadge tone={getTransactionTone(entry.type as TransactionType)}>{transactionTypeLabels[entry.type as TransactionType]}</StatusDotBadge><ReportEntryStatus entry={entry} /></div>
    <div className="mt-4"><ReportEntrySource entry={entry} /></div>
  </div>;
}
