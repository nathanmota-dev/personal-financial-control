"use client";

import { addMonths, subMonths } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMonthlyCalendar } from "@zach.codes/react-calendar";
import { formatMonthLabel } from "@/lib/finance-ui";
import { getMonthFromDate } from "@/lib/recurring-calendar";

export function RecurringCalendarNav() {
  const { currentMonth, onCurrentMonthChange } = useMonthlyCalendar();
  const month = getMonthFromDate(currentMonth);

  return (
    <div className="flex flex-col gap-4 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
          <CalendarDays className="size-5" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-slate-100">
            {formatMonthLabel(month)}
          </p>
          <p className="text-xs text-slate-500">Previsões das recorrências ativas</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Mês anterior"
          onClick={() => onCurrentMonthChange(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Próximo mês"
          onClick={() => onCurrentMonthChange(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
