"use client";

import { useState } from "react";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { DailyExpensesViewProps } from "@/lib/interfaces/daily-expenses";
import { formatMonthLabel } from "@/lib/finance-ui";
import { DailyExpensesCalendar } from "@/components/finance/reports/daily-expenses-calendar";
import { DailyExpensesDetails } from "@/components/finance/reports/daily-expenses-details";
import { DailyExpensesTable } from "@/components/finance/reports/daily-expenses-table";

export function DailyExpensesView({ map }: DailyExpensesViewProps) {
  const { formatCurrency } = useFinancialFormatter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDay = map.days.find((day) => day.date === selectedDate) ?? null;
  const metrics = [
    { label: "Gastos positivos", value: map.expenseCents, tone: "text-destructive" },
    { label: "Créditos e estornos", value: map.creditCents, tone: "text-success" },
    { label: "Líquido deste mapa", value: map.netCents, tone: "text-content-strong" },
  ];

  return (
    <section className="min-w-0 space-y-4" aria-label="Despesas por data da transação ou compra">
      <header className="relative rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
        <DashboardCardIllustration src="/images/bills-calendar.webp" />
        <h2 className="pr-16 text-lg font-semibold leading-[25px]">Despesas por data da transação/compra</h2>
        <p className="mt-1 text-xs text-content-muted">{formatMonthLabel(map.period)}</p>
        <p className="mt-3 max-w-4xl pr-16 text-[13px] leading-5 text-content">
          Este mapa mostra quando a despesa foi comprada ou registrada. Compras no cartão aparecem uma vez pelo valor total na data da compra. O relatório por competência pode divergir; o total abaixo pertence apenas a este mapa.
        </p>
        <dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="min-w-0">
              <dt className="text-xs text-content">{metric.label}</dt>
              <dd className={`mt-1 text-xl font-semibold tabular-nums ${metric.tone}`}>{formatCurrency(metric.value)}</dd>
            </div>
          ))}
        </dl>
        {map.entries.length === 0 && <p className="mt-4 text-[13px] text-content-muted">Nenhuma despesa ou crédito registrado neste mês.</p>}
      </header>
      <DailyExpensesCalendar period={map.period} calendar={map.calendar} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <DailyExpensesDetails key={selectedDay?.date ?? "empty"} day={selectedDay} />
      <DailyExpensesTable days={map.days} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
    </section>
  );
}
