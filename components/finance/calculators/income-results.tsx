import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { CALCULATOR_ILLUSTRATIONS } from "@/lib/calculator-illustrations";
import { IncomeTable } from "./income-table";
import { IncomeDeductions } from "./income-deductions";
import { IncomeChart } from "./income-chart";
import type { IncomeResultProps } from "@/lib/interfaces/income-calculators";

const cardClassName = "relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6";

export function IncomeResults({ result }: IncomeResultProps) {
  const { formatCurrency, protect } = useFinancialFormatter();
  const memory = result.annualRevenueCents !== undefined ? [
    ["Receita anual projetada", result.annualRevenueCents],
    ["Pró-labore mensal", result.proLaboreCents ?? 0],
    ["Lucro disponível para distribuição", result.dividendsCents ?? 0],
  ] as const : [];
  return <section aria-label="Resultado da simulação" className="space-y-6 min-[100.0625rem]:space-y-5">
    <IncomeDeductions result={result} />
    <div className="grid items-start gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <section aria-label="Memória do cálculo" className={cardClassName}>
        <DashboardCardIllustration src={CALCULATOR_ILLUSTRATIONS.memory} />
        <h2 className="text-lg font-semibold leading-[25px] text-content-strong">Memória do cálculo</h2>
        <p className="mt-1 pr-20 text-xs text-content-muted">Base, alíquota e valor de cada item do mês.</p>
        {memory.length ? <dl className="mt-5 grid gap-x-6 gap-y-4 border-b border-border pb-5 sm:grid-cols-3">{memory.map(([label, cents]) => <div key={label} className="min-w-0"><dt className="text-xs text-content-muted">{label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums text-content-strong">{formatCurrency(cents)}</dd></div>)}</dl> : null}
        <div className="mt-5"><IncomeTable result={result} /></div>
      </section>
      <div className="grid gap-6 min-[100.0625rem]:gap-5">
        <section aria-label="Distribuição mensal" className={cardClassName}>
          <DashboardCardIllustration src={CALCULATOR_ILLUSTRATIONS.distribution} />
          <h2 className="text-lg font-semibold leading-[25px] text-content-strong">Distribuição mensal</h2>
          <p className="mt-1 pr-20 text-xs text-content-muted">Proventos, descontos e líquido lado a lado.</p>
          <div className="mt-4"><IncomeChart result={result} /></div>
        </section>
        <section aria-label="Premissas e observações" className={cardClassName}>
          <DashboardCardIllustration src={CALCULATOR_ILLUSTRATIONS.assumptions} />
          <h2 className="text-lg font-semibold leading-[25px] text-content-strong">Premissas e observações</h2>
          <p className="mt-1 pr-20 text-xs text-content-muted">O que a simulação considera.</p>
          <ul className="mt-4 divide-y divide-border">{result.assumptions.map(note => <li key={note} className="py-2.5 text-[13px] leading-[19px] text-content">{protect(note)}</li>)}</ul>
        </section>
      </div>
    </div>
  </section>;
}
