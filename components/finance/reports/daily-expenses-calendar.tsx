"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { DailyExpenseCalendarProps, DailyExpenseDay } from "@/lib/interfaces/daily-expenses";
import { formatDateLabel, formatMonthLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

const weekdays = [
  { short: "Seg", full: "Segunda-feira" },
  { short: "Ter", full: "Terça-feira" },
  { short: "Qua", full: "Quarta-feira" },
  { short: "Qui", full: "Quinta-feira" },
  { short: "Sex", full: "Sexta-feira" },
  { short: "Sáb", full: "Sábado" },
  { short: "Dom", full: "Domingo" },
];

const intensityClasses = [
  "border-border bg-card",
  "border-chart-1/30 bg-chart-1/[0.08]",
  "border-chart-1/55 bg-chart-1/[0.18]",
  "border-chart-2/40 bg-chart-2/[0.16]",
  "border-chart-2/60 bg-chart-2/[0.32]",
] as const;

const intensityLabels = ["Sem gastos", "Baixa", "Moderada", "Alta", "Máxima"] as const;

function describeDay(day: DailyExpenseDay, formatCurrencyText: (cents: number) => string) {
  return `${formatDateLabel(day.date)}. Gastos positivos ${formatCurrencyText(day.expenseCents)}. Créditos e estornos ${formatCurrencyText(day.creditCents)}. Líquido ${formatCurrencyText(day.netCents)}. ${day.entries.length} movimentos. Selecione para consultar os itens.`;
}

export function DailyExpensesCalendar({ period, calendar, selectedDate, onSelectDate }: DailyExpenseCalendarProps) {
  const { formatCurrency, formatCurrencyText } = useFinancialFormatter();
  const weeks = Array.from({ length: calendar.length / 7 }, (_, index) => calendar.slice(index * 7, index * 7 + 7));

  return (
    <Card className="shadow-none">
      <CardHeader className="border-b border-border px-4 py-4 sm:px-5">
        <CardTitle><h3>Calendário de {formatMonthLabel(period)}</h3></CardTitle>
        <CardDescription>Selecione qualquer dia com teclado, toque ou ponteiro. A intensidade representa apenas gastos positivos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-3 sm:p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] table-fixed border-separate border-spacing-1" aria-label={`Calendário de despesas de ${formatMonthLabel(period)}`}>
            <thead><tr>{weekdays.map((weekday) => <th key={weekday.short} scope="col" className="p-1 text-center text-xs font-medium text-content-muted"><abbr title={weekday.full} className="no-underline">{weekday.short}</abbr></th>)}</tr></thead>
            <tbody>{weeks.map((week, weekIndex) => <tr key={weekIndex}>
              {week.map((day, columnIndex) => day ? (
                <td key={day.date} className="h-20 align-top sm:h-24">
                  <button
                    type="button"
                    aria-label={describeDay(day, formatCurrencyText)}
                    aria-pressed={selectedDate === day.date}
                    title={describeDay(day, formatCurrencyText)}
                    onClick={() => onSelectDate(day.date)}
                    className={cn(
                      "flex h-full min-h-20 w-full min-w-0 flex-col rounded-lg border p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:min-h-24 sm:p-2",
                      intensityClasses[day.intensity],
                      selectedDate === day.date && "ring-2 ring-brand ring-offset-1"
                    )}
                  >
                    <span className="text-xs font-semibold tabular-nums text-content-strong">{day.dayNumber}</span>
                    <span className="mt-1 block w-full break-all text-[0.58rem] font-semibold leading-tight tabular-nums text-content-strong sm:text-xs">{formatCurrency(day.expenseCents)}</span>
                    {day.creditCents > 0 && <span className="mt-auto block w-full break-all text-[0.55rem] leading-tight text-success sm:text-[0.65rem]">Crédito {formatCurrency(day.creditCents)}</span>}
                    {day.entries.length > 0 && <span className="sr-only">{day.entries.length} movimentos</span>}
                  </button>
                </td>
              ) : <td key={`empty-${weekIndex}-${columnIndex}`} aria-hidden="true" className="h-20 sm:h-24" />)}
            </tr>)}</tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3 text-xs text-content-muted" aria-label="Legenda de intensidade">
          {intensityLabels.map((label, index) => <span key={label} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-3 rounded-sm border", intensityClasses[index])} />{label}
          </span>)}
          <span className="ml-auto">Créditos aparecem à parte e não reduzem a intensidade.</span>
        </div>
      </CardContent>
    </Card>
  );
}
