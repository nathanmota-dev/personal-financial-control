"use client";

import { useState } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MonthlyBody,
  MonthlyCalendar,
  MonthlyDay,
} from "@zach.codes/react-calendar";

import { RecurringCalendarEventItem } from "@/components/finance/recurring-calendar-event";
import { RecurringCalendarNav } from "@/components/finance/recurring-calendar-nav";
import { financeMonthlyCalendarClassName } from "@/components/finance/finance-styles";
import type { RecurringCalendarEvent, RecurringCalendarProps } from "@/lib/interfaces/recurring";
import {
  buildRecurringCalendarEvents,
  getMonthFromDate,
} from "@/lib/recurring-calendar";

export function RecurringCalendar({
  month,
  templates,
}: RecurringCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(parseISO(`${month}-01`))
  );

  const visibleMonth = getMonthFromDate(currentMonth);
  const events = buildRecurringCalendarEvents(visibleMonth, templates);

  return (
    <div className={`recurring-calendar ${financeMonthlyCalendarClassName}`}>
      <MonthlyCalendar
        currentMonth={currentMonth}
        onCurrentMonthChange={setCurrentMonth}
        locale={ptBR}
      >
        <RecurringCalendarNav />
        {!events.length ? (
          <div className="border-b border-border bg-surface/50 px-5 py-3 text-sm text-content">
            Nenhuma recorrência ativa está prevista para este mês.
          </div>
        ) : null}
        <MonthlyBody events={events}>
          <MonthlyDay<RecurringCalendarEvent>
            renderDay={(dayEvents) =>
              dayEvents.map((event) => (
                <RecurringCalendarEventItem key={event.id} event={event} />
              ))
            }
          />
        </MonthlyBody>
      </MonthlyCalendar>
      <p className="border-t border-border px-5 py-3 text-xs text-content-muted">
        Eventos com ✓ já possuem lançamento gerado para a competência exibida.
        <span className="sr-only"> Mês exibido: {format(currentMonth, "yyyy-MM")}</span>
      </p>
    </div>
  );
}
