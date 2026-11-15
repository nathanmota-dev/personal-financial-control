import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { CALCULATOR_ILLUSTRATIONS } from "@/lib/calculator-illustrations";
import { getIncomeDeductions } from "@/lib/income-deductions";
import type { IncomeResultProps } from "@/lib/interfaces/income-calculators";
import { IncomeDeductionsChart } from "./income-deductions-chart";

export function IncomeDeductions({ result }: IncomeResultProps) {
  const { formatCurrency, protect } = useFinancialFormatter();
  const deductions = getIncomeDeductions(result);
  return <div className="grid items-stretch gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
    <section aria-label="Descontos em detalhe" className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src={CALCULATOR_ILLUSTRATIONS.deductionList} />
      <h2 className="text-lg font-semibold leading-[25px] text-content-strong">Descontos em detalhe</h2>
      <p className="mt-1 pr-20 text-xs text-content-muted">Valores que reduzem sua renda mensal.</p>
      <dl className="mt-4 divide-y divide-border">{deductions.map(item => <div key={item.label} className="flex items-center justify-between gap-4 py-3">
        <dt className="flex min-w-0 items-center gap-2 text-[13px] text-content-strong"><span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</dt>
        <dd className="shrink-0 text-right"><p className="text-[15px] font-semibold tabular-nums text-content-strong">{formatCurrency(item.amountCents)}</p><p className="text-[11px] text-content-subtle">{protect(`${item.percentage.toFixed(1).replace(".", ",")}% dos descontos`)}</p></dd>
      </div>)}</dl>
      {result.fgtsCents !== undefined && <div className="mt-4 rounded-[14px] bg-primary/10 p-4">
        <div className="flex items-center justify-between gap-4"><p className="text-[13px] font-semibold text-content-strong">FGTS estimado · 8%</p><p className="text-[15px] font-semibold tabular-nums text-content-strong">{formatCurrency(result.fgtsCents)}</p></div>
        <p className="mt-1 text-xs leading-5 text-content">Depósito do empregador, sem desconto no seu salário. Estimativa para contrato CLT comum.</p>
      </div>}
    </section>
    <section aria-label="Composição dos descontos" className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src={CALCULATOR_ILLUSTRATIONS.deductions} />
      <h2 className="text-lg font-semibold leading-[25px] text-content-strong">Composição dos descontos</h2>
      <p className="mt-1 pr-20 text-xs text-content-muted">Participação de cada desconto no total.</p>
      <div className="mt-4"><IncomeDeductionsChart deductions={deductions} /></div>
    </section>
  </div>;
}
