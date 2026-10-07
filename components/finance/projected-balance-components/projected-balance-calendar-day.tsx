"use client";

import type { ProjectionCalendarDayItemProps } from "@/app/interfaces/projected-balance";
import { formatDateLabel } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { cn } from "@/lib/utils";

import { statusLabels } from "./labels";

const statusTone = {
  safe: {
    cell: "border-warning/35 bg-warning/[0.10]",
    value: "text-warning",
  },
  warning: {
    cell: "border-warning/40 bg-warning/[0.12]",
    value: "text-warning",
  },
  negative: {
    cell: "border-danger/45 bg-danger/[0.14]",
    value: "text-danger",
  },
} as const;

export function ProjectedBalanceCalendarDay({
  calendarDay,
  onSelectDay,
}: ProjectionCalendarDayItemProps) {
  const { formatCurrency, formatCurrencyText } = useFinancialFormatter();
  if (!calendarDay.day) {
    return (
      <li className="h-full min-h-24 list-none">
        <div className="flex h-full min-h-24 items-end rounded-xl border border-transparent px-2 py-1.5 text-[0.62rem] text-content-subtle">
          Fora do período
        </div>
      </li>
    );
  }

  const day = calendarDay.day;
  const tone = statusTone[day.status];

  return (
    <li className="h-full min-h-24 list-none">
      <button
        type="button"
        className={cn(
          "flex h-full min-h-24 w-full flex-col rounded-xl border px-2 py-1.5 text-left transition duration-200 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
          tone.cell
        )}
        onClick={() => onSelectDay(day)}
        aria-label={`${formatDateLabel(day.date)}. ${statusLabels[day.status]}. Saldo projetado ${formatCurrencyText(day.projectedBalanceCents)}. Disponível por dia ${formatCurrencyText(day.availablePerDayCents)}.`}
      >
        <div className="min-w-0">
          <p className="truncate text-[0.58rem] font-medium text-content-muted">
            Saldo projetado
          </p>
          <p
            className={cn(
              "truncate text-[1.02rem] font-semibold tabular-nums",
              tone.value
            )}
          >
            {formatCurrency(day.projectedBalanceCents)}
          </p>
        </div>

        <div className="mt-auto border-t border-border/60 pt-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.58rem] text-content-muted">Disponível/dia</span>
            <span
              className={cn(
                "tabular-nums text-[0.64rem] font-semibold tabular-nums",
                day.availablePerDayCents < 0 ? "text-danger" : "text-brand"
              )}
            >
              {formatCurrency(day.availablePerDayCents)}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}
