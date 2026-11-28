"use client";

import { CheckCircle2, Clock3 } from "lucide-react";
import { useState } from "react";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { RecurringLinkDialog } from "@/components/finance/recurring-link-dialog";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { RecurringOccurrenceStatusProps } from "@/lib/interfaces/recurring";
import { cn } from "@/lib/utils";

/** Whether the rule already happened in the month; it opens the entries that paid it, to link or unlink them. */
export function RecurringOccurrenceStatus({ template, month, isRecorded, occurrence }: RecurringOccurrenceStatusProps) {
  const { formatCurrency } = useFinancialFormatter();
  const [open, setOpen] = useState(false);
  const recordedCents = occurrence?.recordedCents;
  const monthLabel = formatMonthLabel(month);
  const StatusIcon = isRecorded ? CheckCircle2 : Clock3;

  return (
    <>
      <button
        type="button"
        title="Ver ou vincular lançamentos"
        onClick={() => setOpen(true)}
        className={cn(
          "mt-0.5 flex max-w-full items-center gap-1 rounded text-left text-[11px] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/50",
          isRecorded ? "text-success" : "text-content-subtle"
        )}
      >
        <StatusIcon className="size-3 shrink-0" aria-hidden="true" />
        <span className="truncate">
          {isRecorded ? `Lançado em ${monthLabel}` : `Sem lançamento em ${monthLabel}`}
          {recordedCents != null ? ` · ${formatCurrency(recordedCents)}` : ""}
        </span>
        {recordedCents != null && recordedCents !== template.amountCents ? (
          <span className="shrink-0 text-content-subtle">{`· previsto ${formatCurrency(template.amountCents)}`}</span>
        ) : null}
        {isRecorded ? null : <span className="shrink-0 font-medium text-brand">· Vincular</span>}
      </button>
      {open ? <RecurringLinkDialog template={template} month={month} open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
