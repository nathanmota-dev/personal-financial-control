"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    { label: "Gastos positivos", value: map.expenseCents, tone: "text-danger" },
    { label: "Créditos e estornos", value: map.creditCents, tone: "text-success" },
    { label: "Líquido deste mapa", value: map.netCents, tone: "text-content-strong" },
  ];

  return (
    <section className="min-w-0 space-y-4" aria-label="Despesas por data da transação ou compra">
      <header>
        <h2 className="text-xl font-semibold">Despesas por data da transação/compra</h2>
        <p className="mt-1 text-sm text-content">{formatMonthLabel(map.period)}</p>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-content">
          Este mapa mostra quando a despesa foi comprada ou registrada. Compras no cartão aparecem uma vez pelo valor total na data da compra. O relatório por competência pode divergir; o total abaixo pertence apenas a este mapa.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="gap-3 py-4 shadow-none">
            <CardHeader className="px-4"><CardTitle><h3 className="text-sm font-medium text-content">{metric.label}</h3></CardTitle></CardHeader>
            <CardContent className={`px-4 text-lg font-semibold tabular-nums ${metric.tone}`}>{formatCurrency(metric.value)}</CardContent>
          </Card>
        ))}
      </div>

      {map.entries.length === 0 && <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-content">Nenhuma despesa ou crédito registrado neste mês.</p>}
      <DailyExpensesCalendar period={map.period} calendar={map.calendar} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <DailyExpensesDetails key={selectedDay?.date ?? "empty"} day={selectedDay} />
      <DailyExpensesTable days={map.days} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
    </section>
  );
}
