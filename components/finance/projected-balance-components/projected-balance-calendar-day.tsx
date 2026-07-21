import type { ProjectionCalendarDayItemProps } from "@/app/interfaces/projected-balance";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import { statusLabels } from "./labels";

const statusTone = {
  safe: {
    cell: "border-emerald-300/35 bg-emerald-400/[0.10]",
    value: "text-emerald-100",
  },
  warning: {
    cell: "border-amber-300/40 bg-amber-400/[0.12]",
    value: "text-amber-100",
  },
  negative: {
    cell: "border-rose-300/45 bg-rose-500/[0.14]",
    value: "text-rose-100",
  },
} as const;

export function ProjectedBalanceCalendarDay({
  calendarDay,
  onSelectDay,
}: ProjectionCalendarDayItemProps) {
  if (!calendarDay.day) {
    return (
      <li className="h-full min-h-24 list-none">
        <div className="flex h-full min-h-24 items-end rounded-xl border border-transparent px-2 py-1.5 text-[0.62rem] text-slate-700">
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
          "flex h-full min-h-24 w-full flex-col rounded-xl border px-2 py-1.5 text-left transition duration-200 focus-visible:border-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/30",
          tone.cell
        )}
        onClick={() => onSelectDay(day)}
        aria-label={`${formatDateLabel(day.date)}. ${statusLabels[day.status]}. Saldo projetado ${formatCurrency(day.projectedBalanceCents)}. Disponível por dia ${formatCurrency(day.availablePerDayCents)}.`}
      >
        <div className="min-w-0">
          <p className="truncate text-[0.58rem] uppercase tracking-[0.13em] text-slate-500">
            Saldo projetado
          </p>
          <p
            className={cn(
              "truncate font-heading text-[1.02rem] font-semibold tabular-nums",
              tone.value
            )}
          >
            {formatCurrency(day.projectedBalanceCents)}
          </p>
        </div>

        <div className="mt-auto border-t border-white/[0.07] pt-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.58rem] text-slate-500">Disponível/dia</span>
            <span
              className={cn(
                "font-mono text-[0.64rem] font-semibold tabular-nums",
                day.availablePerDayCents < 0 ? "text-rose-200" : "text-cyan-200"
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
