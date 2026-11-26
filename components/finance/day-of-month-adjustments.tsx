"use client";

import { formatDateLabel } from "@/lib/finance-ui";
import type { DayOfMonthAdjustmentsProps } from "@/lib/interfaces/day-of-month";

export function DayOfMonthAdjustments({ day, adjustments }: DayOfMonthAdjustmentsProps) {
  if (!adjustments.length) {
    return <p className="text-xs text-content">{`Todo mês no dia ${day}.`}</p>;
  }

  return (
    <div className="space-y-1.5" aria-live="polite">
      <p className="text-xs text-content">
        {`Nos meses sem o dia ${day}, o lançamento cai no último dia do mês. Próximos ajustes:`}
      </p>
      <ul aria-label="Próximos ajustes de data" className="flex flex-wrap gap-1.5">
        {adjustments.map((adjustment) => (
          <li key={adjustment.month} className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium tabular-nums text-content-strong">
            {formatDateLabel(adjustment.date)}
          </li>
        ))}
      </ul>
    </div>
  );
}
