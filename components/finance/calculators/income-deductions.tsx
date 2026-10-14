import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { getIncomeDeductions } from "@/lib/income-deductions";
import type { IncomeResultProps } from "@/lib/interfaces/income-calculators";
import { IncomeDeductionsChart } from "./income-deductions-chart";

export function IncomeDeductions({ result }: IncomeResultProps) {
  const { formatCurrency, protect } = useFinancialFormatter();
  const deductions = getIncomeDeductions(result);
  return <div className="grid items-stretch gap-4 md:grid-cols-2">
    <Card className="min-w-0 shadow-none"><CardHeader><CardTitle role="heading" aria-level={2}>Descontos em detalhe</CardTitle><p className="text-xs text-content-muted">Valores que reduzem sua renda mensal.</p></CardHeader><CardContent>
      <dl className="divide-y divide-border">{deductions.map(item => <div key={item.label} className="flex items-center justify-between gap-4 py-3 first:pt-0"><dt className="flex min-w-0 items-center gap-2 text-sm"><span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</dt><dd className="shrink-0 text-right"><p className="text-lg font-semibold tabular-nums">{formatCurrency(item.amountCents)}</p><p className="text-xs text-content-muted">{protect(`${item.percentage.toFixed(1).replace(".", ",")}% dos descontos`)}</p></dd></div>)}</dl>
      {result.fgtsCents !== undefined && <div className="mt-5 border-t border-border pt-4"><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium">FGTS estimado · 8%</p><p className="text-lg font-semibold tabular-nums">{formatCurrency(result.fgtsCents)}</p></div><p className="mt-1 text-xs leading-5 text-content-muted">Depósito do empregador, sem desconto no seu salário. Estimativa para contrato CLT comum.</p></div>}
    </CardContent></Card>
    <Card className="min-w-0 shadow-none"><CardHeader><CardTitle role="heading" aria-level={2}>Composição dos descontos</CardTitle><p className="text-xs text-content-muted">Participação de cada desconto no total.</p></CardHeader><CardContent><IncomeDeductionsChart deductions={deductions} /></CardContent></Card>
  </div>;
}
