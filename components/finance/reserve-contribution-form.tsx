"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CurrencyInput } from "@/components/finance/calculators/currency-input";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Button } from "@/components/ui/button";
import type { ReserveContributionFormProps } from "@/lib/interfaces/components/reserve-contribution";
import { RESERVE_CATEGORY_NAME } from "@/lib/reserve-contribution";
import { ReserveContributionSubmit } from "@/lib/utils/component-actions/reserve-contribution-submit";
import { formatReserveInput, parseReserveInput } from "@/lib/utils/components/bank-reserve";

export function ReserveContributionForm({ contribution }: ReserveContributionFormProps) {
  const router = useRouter();
  const { formatCurrency } = useFinancialFormatter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(formatReserveInput(contribution.monthlyCents));
  const cents = parseReserveInput(value);
  const save = (monthlyContributionCents: number | null) => startTransition(() => void ReserveContributionSubmit({ monthlyContributionCents, router }));
  const recurringHint = contribution.hasReserveCategory
    ? `Pelas recorrências da categoria ${RESERVE_CATEGORY_NAME}.`
    : `Sem a categoria ${RESERVE_CATEGORY_NAME}, nada é previsto para a reserva. Informe um valor ou crie a categoria.`;

  return (
    <form
      className="mt-6 space-y-3 border-t border-border pt-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (cents !== null) save(cents);
      }}
    >
      <CurrencyInput id="reserve-monthly-contribution" label="Aporte mensal na reserva" value={value} onValueChange={setValue} />
      <p className="text-[11px] leading-4 text-content-subtle">
        {contribution.source === "custom" ? <>Valor salvo por você, usado no lugar das recorrências ({formatCurrency(contribution.recurringMonthlyCents)} por mês).</> : recurringHint}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="outline" size="sm" className="h-8 rounded-lg text-xs" disabled={isPending || cents === null}>
          {isPending ? "Salvando..." : "Salvar aporte"}
        </Button>
        {contribution.source === "custom" ? (
          <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg text-xs" disabled={isPending} onClick={() => save(null)}>
            Usar recorrências
          </Button>
        ) : null}
      </div>
    </form>
  );
}
