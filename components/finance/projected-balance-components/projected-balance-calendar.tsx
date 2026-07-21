"use client";

import { useMemo, useState } from "react";
import { isAfter, isBefore, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MonthlyBody,
  MonthlyCalendar,
  MonthlyDay,
} from "@zach.codes/react-calendar";

import type { ProjectedBalanceCalendarProps } from "@/app/interfaces/projected-balance";
import { financeMonthlyCalendarClassName } from "@/components/finance/finance-styles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMonthLabel } from "@/lib/finance-ui";
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
    <Card className={financeMonthlyCalendarClassName}>
      <CardHeader className="border-b border-slate-800 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Calendário do caixa</CardTitle>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Cada dia mostra o saldo projetado e quanto permanece sustentável para gastar.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            {formatMonthLabel(firstMonth)} até {formatMonthLabel(lastMonth)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
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
      </CardContent>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-800 px-5 py-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
          Seguro
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-300" aria-hidden="true" />
          Abaixo da reserva
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-rose-300" aria-hidden="true" />
          Saldo negativo
        </span>
        <span className="ml-auto text-slate-600">Selecione um dia para ver os eventos</span>
      </div>
    </Card>
  );
}
