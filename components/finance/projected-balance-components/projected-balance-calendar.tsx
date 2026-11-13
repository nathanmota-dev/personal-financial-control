"use client";

import {
MonthlyBody,
MonthlyCalendar,
MonthlyDay,
} from "@zach.codes/react-calendar";
import { isAfter,isBefore,parseISO,startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo,useState } from "react";

import type { ProjectedBalanceCalendarProps } from "@/app/interfaces/projected-balance";
import type { ProjectionCalendarDay } from "@/lib/interfaces/projected-balance";
import {
buildProjectionCalendarDays,
getProjectionMonthFromDate,
getProjectionMonthRange,
} from "@/lib/projected-balance-calendar";

import { ProjectedBalanceCalendarDay } from "./projected-balance-calendar-day";
import { ProjectedBalanceCalendarNav } from "./projected-balance-calendar-nav";

export function ProjectedBalanceCalendar({
  daily,
  onSelectDay,
}: ProjectedBalanceCalendarProps) {
  const { firstMonth, lastMonth } = getProjectionMonthRange(daily);
  const firstDate = startOfMonth(parseISO(`${firstMonth}-01`));
  const lastDate = startOfMonth(parseISO(`${lastMonth}-01`));
  const [monthCursor, setMonthCursor] = useState(firstDate);
  const currentMonth = isBefore(monthCursor, firstDate)
    ? firstDate
    : isAfter(monthCursor, lastDate)
      ? lastDate
      : monthCursor;

  const visibleMonth = getProjectionMonthFromDate(currentMonth);
  const calendarDays = useMemo(
    () => buildProjectionCalendarDays(visibleMonth, daily),
    [daily, visibleMonth]
  );

  function handleMonthChange(nextMonth: Date) {
    const nextMonthStart = startOfMonth(nextMonth);

    if (isBefore(nextMonthStart, firstDate) || isAfter(nextMonthStart, lastDate)) {
      return;
    }

    setMonthCursor(nextMonthStart);
  }

  return (
    <div className="finance-monthly-calendar min-w-0 border-t border-border">
        <MonthlyCalendar
          currentMonth={currentMonth}
          onCurrentMonthChange={handleMonthChange}
          locale={ptBR}
        >
          <ProjectedBalanceCalendarNav firstMonth={firstMonth} lastMonth={lastMonth} />
          <MonthlyBody events={calendarDays}>
            <MonthlyDay<ProjectionCalendarDay>
              renderDay={(dayEvents) => {
                const calendarDay = dayEvents[0];

                return calendarDay ? (
                  <ProjectedBalanceCalendarDay
                    calendarDay={calendarDay}
                    onSelectDay={onSelectDay}
                  />
                ) : null;
              }}
            />
          </MonthlyBody>
        </MonthlyCalendar>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-[22px] py-3 text-xs text-content-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
          Seguro
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
          Abaixo da reserva
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-danger" aria-hidden="true" />
          Saldo negativo
        </span>
        <span className="ml-auto text-content-subtle">Selecione um dia para ver os eventos</span>
      </div>
    </div>
  );
}
