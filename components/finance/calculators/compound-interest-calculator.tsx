"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CompoundInterestForm } from "@/components/finance/calculators/compound-interest-form";
import { CompoundInterestResults } from "@/components/finance/calculators/compound-interest-results";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { calculateCompoundInterest } from "@/lib/compound-interest";
import { formatMoneyInput, moneyInputToCents } from "@/lib/finance-ui";
import type {
  CompoundInterestFormValues,
  CompoundInterestSimulation,
} from "@/lib/interfaces/compound-interest";

const STORAGE_KEY = "personal-financial-control:compound-interest";
const EMPTY_VALUES: CompoundInterestFormValues = {
  initialAmount: "",
  monthlyContribution: "",
  interestRate: "",
  interestRatePeriod: "annual",
  investmentPeriod: "",
  investmentPeriodUnit: "years",
};

function simulate(values: CompoundInterestFormValues) {
  if (
    !values.initialAmount.trim() ||
    !values.monthlyContribution.trim() ||
    !values.interestRate.trim() ||
    !values.investmentPeriod.trim()
  ) {
    throw new Error("Preencha todos os campos para calcular a projeção.");
  }

  const initialAmountCents = moneyInputToCents(values.initialAmount);
  const monthlyContributionCents = moneyInputToCents(values.monthlyContribution);
  const interestRate = Number(values.interestRate.replace(",", "."));
  const investmentPeriod = Number(values.investmentPeriod);
  const maxPeriod = values.investmentPeriodUnit === "years" ? 50 : 600;

  if (initialAmountCents < 0 || monthlyContributionCents < 0) {
    throw new Error("Os valores investidos não podem ser negativos.");
  }
  if (!Number.isFinite(interestRate) || interestRate < 0 || interestRate > 100) {
    throw new Error("Informe uma taxa de juros entre 0% e 100%.");
  }
  if (!Number.isInteger(investmentPeriod) || investmentPeriod < 1 || investmentPeriod > maxPeriod) {
    throw new Error(`Informe um período entre 1 e ${maxPeriod} ${values.investmentPeriodUnit === "years" ? "anos" : "meses"}.`);
  }
  if (initialAmountCents === 0 && monthlyContributionCents === 0) {
    throw new Error("Informe um valor inicial ou um aporte mensal maior que zero.");
  }

  return calculateCompoundInterest({
    initialAmountCents,
    monthlyContributionCents,
    interestRate,
    interestRatePeriod: values.interestRatePeriod,
    investmentPeriod,
    investmentPeriodUnit: values.investmentPeriodUnit,
  });
}

function formatCurrencyValues(
  values: CompoundInterestFormValues
): CompoundInterestFormValues {
  return {
    ...values,
    initialAmount: formatMoneyInput(values.initialAmount),
    monthlyContribution: formatMoneyInput(values.monthlyContribution),
  };
}

export function CompoundInterestCalculator() {
  const [values, setValues] = useState<CompoundInterestFormValues>(EMPTY_VALUES);
  const [simulation, setSimulation] = useState<CompoundInterestSimulation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      try {
        const restored = formatCurrencyValues(
          JSON.parse(saved) as CompoundInterestFormValues
        );
        const restoredSimulation = simulate(restored);
        setValues(restored);
        setSimulation(restoredSimulation);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  function handleSubmit() {
    try {
      const formattedValues = formatCurrencyValues(values);
      const nextSimulation = simulate(formattedValues);
      setValues(formattedValues);
      setSimulation(nextSimulation);
      setError(null);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formattedValues));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível calcular a simulação.");
    }
  }

  function handleClear() {
    setValues(EMPTY_VALUES);
    setSimulation(null);
    setError(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calculadoras · Juros compostos"
        title="Quanto o seu dinheiro pode crescer?"
        description="Combine valor inicial, aportes mensais e taxa de juros para visualizar o efeito do tempo sobre o seu patrimônio."
        actions={
          <Button asChild variant="outline">
            <Link href="/calculators">
              <ArrowLeft className="size-4" />
              Todas as calculadoras
            </Link>
          </Button>
        }
      />

      <CompoundInterestForm
        values={values}
        error={error}
        onChange={setValues}
        onSubmit={handleSubmit}
        onClear={handleClear}
      />

      {simulation ? <CompoundInterestResults simulation={simulation} /> : null}
    </div>
  );
}
