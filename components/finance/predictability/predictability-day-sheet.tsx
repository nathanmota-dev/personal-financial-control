"use client";

import type { PredictabilityDaySheetProps } from "@/app/interfaces/predictability";
import { DetailSheet } from "@/components/finance/detail-sheet";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel } from "@/lib/finance-ui";

import { dayStatusCellClassNames } from "./labels";
import { PredictabilityAllocationRow } from "./predictability-allocation-row";
import { PredictabilityDayMetric } from "./predictability-day-metric";
import { PredictabilityExpenseRow } from "./predictability-expense-row";
import { PredictabilityStatusChip } from "./predictability-status-chip";

export function PredictabilityDaySheet({ day, onOpenChange }: PredictabilityDaySheetProps) {
  const { formatCurrency } = useFinancialFormatter();

  return (
    <DetailSheet
      header={
        day
          ? {
              title: formatDateLabel(day.date),
              addon: <PredictabilityStatusChip status={day.status} />,
              description: <>Restam {formatCurrency(day.remainingCents)} dos {formatCurrency(day.allowanceCents)} deste dia.</>,
            }
          : null
      }
      onOpenChange={onOpenChange}
    >
      {day ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <PredictabilityDayMetric label="Valor do dia" value={formatCurrency(day.allowanceCents)} className="text-xl text-content-strong" />
            <PredictabilityDayMetric label="Consumido" value={formatCurrency(day.consumedCents)} className="text-xl text-danger" />
            <PredictabilityDayMetric label="Restante" value={formatCurrency(day.remainingCents)} className={`text-xl ${dayStatusCellClassNames[day.status].value}`} />
          </div>

          <section className="rounded-2xl border border-border p-4">
            <h3 className="text-base font-semibold text-content-strong">O que consumiu este dia</h3>
            {day.allocations.length ? (
              <ul className="mt-1 divide-y divide-border">
                {day.allocations.map((allocation, index) => (
                  <PredictabilityAllocationRow key={`${allocation.transactionId}-${index}`} allocation={allocation} dayDate={day.date} />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-content">Nenhum gasto usou o valor deste dia.</p>
            )}
          </section>

          <section className="rounded-2xl border border-border p-4">
            <h3 className="text-base font-semibold text-content-strong">Lançamentos do dia</h3>
            {day.expenses.length ? (
              <ul className="mt-3 space-y-3">
                {day.expenses.map((expense) => (
                  <PredictabilityExpenseRow key={expense.id} expense={expense} />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-content">Nenhum lançamento avulso nesta data.</p>
            )}
          </section>
        </>
      ) : null}
    </DetailSheet>
  );
}
