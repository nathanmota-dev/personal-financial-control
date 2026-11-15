"use client";

import { TrendingUp } from "lucide-react";

import { CalculatorSplitBar } from "@/components/finance/calculators/calculator-split-bar";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { CALCULATOR_ILLUSTRATIONS } from "@/lib/calculator-illustrations";
import type { CompoundInterestSummaryProps } from "@/lib/interfaces/compound-interest";

export function CompoundInterestSummary({ simulation }: CompoundInterestSummaryProps) {
  const { protect } = useFinancialFormatter();
  const { input } = simulation;
  const period = `${input.investmentPeriod} ${input.investmentPeriodUnit === "years" ? (input.investmentPeriod === 1 ? "ano" : "anos") : (input.investmentPeriod === 1 ? "mês" : "meses")}`;
  const monthlyRate = `${(simulation.monthlyRate * 100).toFixed(3).replace(".", ",")}% ao mês`;
  const multiple = simulation.totalInvestedCents > 0 ? simulation.totalBalanceCents / simulation.totalInvestedCents : null;
  return (
    <section data-slot="card" aria-label="Valor total final" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] animate-in fade-in duration-500 min-[100.0625rem]:p-5">
      <DashboardCardIllustration src={CALCULATOR_ILLUSTRATIONS.compoundInterest} className="top-4 right-6 size-[80px]" />
      <h2 className="text-sm font-semibold text-content-strong">Valor total final</h2>
      <p className="mt-4 text-xs text-content">{`Patrimônio projetado em ${period}`}</p>
      <DashboardCardsMoney cents={simulation.totalBalanceCents} className="mt-1 block text-[40px] leading-[44px] font-bold text-content-strong" />
      <p className="mt-3 flex items-center gap-1.5 text-xs text-success">
        <TrendingUp aria-hidden className="size-3.5 shrink-0" />
        <span className="font-semibold">{multiple === null ? "Somente juros sobre o saldo" : protect(`${multiple.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}× o valor investido`)}</span>
      </p>
      <CalculatorSplitBar
        segments={[
          { label: "Valor total investido", cents: simulation.totalInvestedCents, colorClassName: "bg-chart-2", hint: "inicial + aportes" },
          { label: "Total em juros", cents: simulation.totalInterestCents, colorClassName: "bg-chart-1", hint: monthlyRate },
        ]}
      />
    </section>
  );
}
