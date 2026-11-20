"use client";

import type { PredictabilityDayItemProps } from "@/app/interfaces/predictability";
import { ClickableTableRow } from "@/components/finance/clickable-table-row";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { TableCell } from "@/components/ui/table";
import { formatDateLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import { dayStatusCellClassNames } from "./labels";
import { PredictabilityStatusChip } from "./predictability-status-chip";

export function PredictabilityTableRow({ day, onSelectDay }: PredictabilityDayItemProps) {
  const { formatCurrency } = useFinancialFormatter();

  return (
    <ClickableTableRow
      onActivate={() => onSelectDay(day)}
      className={cn(day.isPast && "text-content-muted", day.isToday && "bg-brand/[0.06]")}
    >
      <TableCell className="font-medium text-content-strong">
        {formatDateLabel(day.date)}
        {day.isToday ? <span className="ml-2 text-xs font-semibold text-brand">hoje</span> : null}
      </TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(day.allowanceCents)}</TableCell>
      <TableCell className="text-right tabular-nums text-danger">{day.spentCents ? formatCurrency(day.spentCents) : "—"}</TableCell>
      <TableCell className="text-right tabular-nums">{day.consumedCents ? formatCurrency(day.consumedCents) : "—"}</TableCell>
      <TableCell className={cn("text-right font-semibold tabular-nums", dayStatusCellClassNames[day.status].value)}>
        {formatCurrency(day.remainingCents)}
      </TableCell>
      <TableCell>
        <PredictabilityStatusChip status={day.status} />
      </TableCell>
    </ClickableTableRow>
  );
}
