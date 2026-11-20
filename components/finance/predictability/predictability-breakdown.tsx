"use client";

import type { PredictabilityBreakdownProps } from "@/app/interfaces/predictability";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { cn } from "@/lib/utils";

import { PredictabilityAlerts } from "./predictability-alerts";
import { PredictabilityBudgetRow } from "./predictability-budget-row";

export function PredictabilityBreakdown({ summary, budgetItems }: PredictabilityBreakdownProps) {
  const { formatCurrency } = useFinancialFormatter();
  const steps = [
    { label: "Renda", value: summary.incomeCents, sign: "+" },
    { label: "Fixos", value: summary.fixedCents, sign: "−" },
    { label: "Fatura do cartão", value: summary.creditCardCents, sign: "−" },
  ];

  return (
    <section aria-label="Orçamento do ciclo" className="@container relative flex min-w-0 flex-col rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <h2 className="text-sm font-semibold text-content-strong">Orçamento do ciclo</h2>
      <dl className="mt-4 space-y-2 text-[13px]">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center justify-between gap-3">
            <dt className="text-content">{step.label}</dt>
            <dd className="font-semibold tabular-nums text-content-strong">
              {step.sign}
              {formatCurrency(step.value)}
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
          <dt className="font-semibold text-content-strong">Sobra para o dia a dia</dt>
          <dd className={cn("font-bold tabular-nums", summary.budgetCents < 0 ? "text-destructive" : "text-content-strong")}>
            {formatCurrency(summary.budgetCents)}
          </dd>
        </div>
      </dl>

      <p className="mt-6 text-[10px] font-bold tracking-wider text-content uppercase">Itens do ciclo</p>
      {budgetItems.length ? (
        <ul className="mt-1 divide-y divide-border">
          {budgetItems.map((item) => (
            <PredictabilityBudgetRow key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-content">Nenhuma renda, conta fixa ou fatura neste ciclo.</p>
      )}

      <p className="mt-6 text-[10px] font-bold tracking-wider text-content uppercase">Alertas</p>
      <PredictabilityAlerts alerts={summary.alerts} />
    </section>
  );
}
