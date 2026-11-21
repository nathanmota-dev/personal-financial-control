"use client";

import type { PredictabilityDayItemProps } from "@/app/interfaces/predictability";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import { dayStatusCellClassNames } from "./labels";
import { PredictabilityDayMetric } from "./predictability-day-metric";
import { PredictabilityStatusChip } from "./predictability-status-chip";

export function PredictabilityMobileDay({ day, onSelectDay, simulatedCents }: PredictabilityDayItemProps) {
  const { formatCurrency } = useFinancialFormatter();

  return (
    <button
      type="button"
      onClick={() => onSelectDay(day)}
      className={cn("rounded-[14px] border border-border p-4 text-left transition-colors hover:bg-muted", day.isToday && "border-brand", simulatedCents && "border-dashed border-brand", day.isPast && "opacity-70")}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-content-strong">
          {formatDateLabel(day.date)}
          {day.isToday ? <span className="ml-2 text-xs font-semibold text-brand">hoje</span> : null}
          {simulatedCents ? <span className="mt-0.5 block text-xs font-medium text-brand">−{formatCurrency(simulatedCents)} simulado</span> : null}
        </p>
        <PredictabilityStatusChip status={day.status} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <PredictabilityDayMetric label="Valor do dia" value={formatCurrency(day.allowanceCents)} className="text-content-strong" />
        <PredictabilityDayMetric label="Gasto" value={formatCurrency(day.spentCents)} className="text-danger" />
        <PredictabilityDayMetric label="Restante" value={formatCurrency(day.remainingCents)} className={dayStatusCellClassNames[day.status].value} />
      </div>
    </button>
  );
}
