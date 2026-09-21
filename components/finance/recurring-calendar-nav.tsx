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
    <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand">
          <CalendarDays className="size-5" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-content-strong">
            {formatMonthLabel(month)}
          </p>
          <p className="text-xs text-content-muted">Previsões das recorrências ativas</p>
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
