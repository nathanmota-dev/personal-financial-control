"use client";

import { addMonths,subMonths } from "date-fns";
import { CalendarDays,ChevronLeft,ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMonthLabel } from "@/lib/finance-ui";
import { getMonthFromDate } from "@/lib/recurring-calendar";
import { useMonthlyCalendar } from "@zach.codes/react-calendar";

export function RecurringCalendarNav() {
  const { currentMonth, onCurrentMonthChange } = useMonthlyCalendar();
  const month = getMonthFromDate(currentMonth);

  return (
    <div className="flex flex-col gap-4 border-b border-border px-[22px] pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarDays className="size-[18px]" />
        </div>
        <div>
          <p className="text-lg leading-[25px] font-semibold text-content-strong">
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
          className="rounded-full"
          aria-label="Mês anterior"
          onClick={() => onCurrentMonthChange(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="rounded-full"
          aria-label="Próximo mês"
          onClick={() => onCurrentMonthChange(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
