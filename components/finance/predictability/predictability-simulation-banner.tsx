"use client";

import { X } from "lucide-react";

import type { PredictabilitySimulationBannerProps } from "@/app/interfaces/predictability";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Button } from "@/components/ui/button";
import { formatDateLabel } from "@/lib/finance-ui";

import { PredictabilityDayMetric } from "./predictability-day-metric";

function describeReach(affectedDates: string[]) {
  const count = affectedDates.length;

  if (!count) {
    return "Nenhum dia do ciclo tem valor livre para cobrir a compra.";
  }

  const first = formatDateLabel(affectedDates[0]);
  const last = formatDateLabel(affectedDates[count - 1]);

  return count === 1 ? `Consome 1 dia: ${first}.` : `Consome ${count} dias, de ${first} a ${last}.`;
}

export function PredictabilitySimulationBanner({ impact, onClear }: PredictabilitySimulationBannerProps) {
  const { formatCurrency } = useFinancialFormatter();
  const { purchase } = impact;

  return (
    <section
      aria-label="Resultado da simulação"
      className="rounded-2xl border border-dashed border-brand/60 bg-brand/[0.06] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wider text-brand uppercase">Simulação</p>
          <p className="mt-1 text-sm font-semibold text-content-strong">
            <span data-user-content>{purchase.description}</span> de {formatCurrency(purchase.amountCents)} em {formatDateLabel(purchase.date)}
          </p>
          <p className="mt-0.5 text-sm text-content">{describeReach(impact.affectedDates)}</p>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0 gap-1.5" onClick={onClear}>
          <X className="size-4" aria-hidden="true" />
          Limpar simulação
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <PredictabilityDayMetric
          label="Restante no ciclo"
          value={<>{formatCurrency(impact.remainingBeforeCents)} → {formatCurrency(impact.remainingAfterCents)}</>}
          className="text-content-strong"
        />
        <PredictabilityDayMetric
          label="Dias livres"
          value={`${impact.freeDaysBefore} → ${impact.freeDaysAfter}`}
          className="text-content-strong"
        />
        <PredictabilityDayMetric
          label="Estouro do ciclo"
          value={impact.overflowAddedCents > 0 ? formatCurrency(impact.overflowAddedCents) : "Nenhum"}
          className={impact.overflowAddedCents > 0 ? "text-danger" : "text-success"}
        />
      </div>

      {impact.overflowAddedCents > 0 ? (
        <p className="mt-3 text-xs text-danger">
          A compra passa do orçamento do ciclo em {formatCurrency(impact.overflowAddedCents)}. Esse valor sairia do próximo salário.
        </p>
      ) : null}
    </section>
  );
}
