"use client";

import { ToneChip } from "@/components/finance/ds/tone-chip";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateLabel } from "@/lib/finance-ui";
import type { RecurringLinkCandidateRowProps } from "@/lib/interfaces/recurring";

export function RecurringLinkCandidateRow({ candidate, checked, onCheckedChange }: RecurringLinkCandidateRowProps) {
  const { formatCurrency } = useFinancialFormatter();
  const id = `recurring-link-${candidate.id}`;

  return (
    <li className="flex items-center gap-3 py-2.5 text-[13px]">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
        <span className="min-w-0 flex-1">
          <span data-user-content className="block truncate font-medium text-content-strong">{candidate.description}</span>
          <span className="block truncate text-[11px] text-content-subtle">
            {formatDateLabel(candidate.date)} · <span data-user-content>{candidate.accountName ?? "—"}</span>
            {candidate.categoryName ? <> · <span data-user-content>{candidate.categoryName}</span></> : null}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-semibold tabular-nums text-content-strong">{formatCurrency(candidate.amountCents)}</span>
          {candidate.kind === "card" || candidate.isSuggested ? (
            <span className="flex gap-1">
              {candidate.kind === "card" ? <ToneChip tone="brand">Cartão</ToneChip> : null}
              {candidate.isSuggested ? <ToneChip tone="success">Sugerido</ToneChip> : null}
            </span>
          ) : null}
        </span>
      </label>
    </li>
  );
}
