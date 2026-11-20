"use client";

import type { PredictabilityCalendarDayProps } from "@/app/interfaces/predictability";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel, formatWholeAmount } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import { dayStatusCellClassNames, dayStatusLabels } from "./labels";

export function PredictabilityCalendarDay({ cell, onSelectDay }: PredictabilityCalendarDayProps) {
  const { formatCurrency, formatCurrencyText, protect } = useFinancialFormatter();

  if (!cell.day) {
    return <li aria-hidden="true" className="min-h-20 list-none sm:min-h-24" />;
  }

  const day = cell.day;
  const tone = dayStatusCellClassNames[day.status];

  return (
    <li className="min-h-20 list-none sm:min-h-24">
      <button
        type="button"
        onClick={() => onSelectDay(day)}
        aria-label={`${formatDateLabel(day.date)}. ${dayStatusLabels[day.status]}. Restam ${formatCurrencyText(day.remainingCents)} de ${formatCurrencyText(day.allowanceCents)}.`}
        className={cn(
          "flex h-full min-h-20 w-full flex-col rounded-xl border px-1.5 py-1.5 text-left transition duration-200 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 sm:min-h-24 sm:px-2",
          tone.cell,
          day.isPast && "opacity-60",
          day.isToday && "ring-2 ring-brand"
        )}
      >
        <span className="flex items-center justify-between gap-1 text-[0.62rem] font-medium text-content-muted">
          <span>{day.date.slice(8, 10)}</span>
          {day.isToday ? <span className="font-semibold text-brand">hoje</span> : null}
        </span>
        <span className={cn("mt-auto truncate text-[0.82rem] font-semibold tabular-nums sm:hidden", tone.value)}>
          {protect(formatWholeAmount(day.remainingCents))}
        </span>
        <span className={cn("mt-auto hidden truncate text-[0.98rem] font-semibold tabular-nums sm:block", tone.value)}>
          {formatCurrency(day.remainingCents)}
        </span>
        <span className="hidden truncate text-[0.58rem] text-content-muted sm:block">
          de {formatCurrency(day.allowanceCents)}
        </span>
      </button>
    </li>
  );
}
