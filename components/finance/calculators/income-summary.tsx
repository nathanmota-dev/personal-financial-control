"use client";

import { Percent, TriangleAlert } from "lucide-react";

import { CalculatorSplitBar } from "@/components/finance/calculators/calculator-split-bar";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { CALCULATOR_ILLUSTRATIONS } from "@/lib/calculator-illustrations";
import type { IncomeSummaryProps } from "@/lib/interfaces/income-calculators";

export function IncomeSummary({ result, pj }: IncomeSummaryProps) {
  const { formatCurrency, protect } = useFinancialFormatter();
  const title = result.partial ? "Líquido parcial estimado" : "Líquido mensal estimado";
  return (
    <section data-slot="card" aria-label={title} className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] animate-in fade-in duration-500 min-[100.0625rem]:p-5">
      <DashboardCardIllustration src={pj ? CALCULATOR_ILLUSTRATIONS.pjIncome : CALCULATOR_ILLUSTRATIONS.netSalary} className="top-4 right-6 size-[80px]" />
      <h2 className="text-sm font-semibold text-content-strong">{title}</h2>
      <p className="mt-4 pr-24 text-xs text-content">{`De ${formatCurrency(result.proceedsCents)} em ${pj ? "receita bruta" : "proventos"} no mês`}</p>
      <DashboardCardsMoney cents={result.netCents} className="mt-1 block text-[40px] leading-[44px] font-bold text-content-strong" />
      <p className="mt-3 flex items-center gap-1.5 text-xs text-content">
        <Percent aria-hidden className="size-3.5 shrink-0" />
        <span>Percentual líquido: <span className="font-semibold text-content-strong">{protect(`${result.netPercentage.toFixed(2).replace(".", ",")}%`)}</span></span>
      </p>
      {result.partial ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-warning">
          <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
          <span>Há tributos fora desta estimativa; veja as premissas abaixo.</span>
        </p>
      ) : null}
      <CalculatorSplitBar
        segments={[
          { label: "Líquido", cents: result.netCents, colorClassName: "bg-success" },
          { label: "Total descontado", cents: result.deductionsCents, colorClassName: "bg-chart-2" },
        ]}
      />
    </section>
  );
}
