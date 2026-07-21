"use client";

import { addMonths, subMonths } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMonthlyCalendar } from "@zach.codes/react-calendar";

import type { ProjectionCalendarNavProps } from "@/app/interfaces/projected-balance";
import { Button } from "@/components/ui/button";
import { formatMonthLabel } from "@/lib/finance-ui";
import { getProjectionMonthFromDate } from "@/lib/projected-balance-calendar";

export function ProjectedBalanceCalendarNav({
  firstMonth,
  lastMonth,
}: ProjectionCalendarNavProps) {
  const { currentMonth, onCurrentMonthChange } = useMonthlyCalendar();
  const month = getProjectionMonthFromDate(currentMonth);
  const canGoPrevious = month > firstMonth;
  const canGoNext = month < lastMonth;

  return (
    <div className="flex flex-col gap-4 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
          <CalendarDays className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-slate-100">
            {formatMonthLabel(month)}
          </p>
          <p className="text-xs text-slate-500">Mapa diário do caixa disponível</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Mês anterior"
          disabled={!canGoPrevious}
          onClick={() => onCurrentMonthChange(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Próximo mês"
          disabled={!canGoNext}
          onClick={() => onCurrentMonthChange(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
