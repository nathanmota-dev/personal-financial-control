import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { IncomeTable } from "./income-table";
import { IncomeDeductions } from "./income-deductions";
import { IncomeChart } from "./income-chart";
import type { IncomeResultProps } from "@/lib/interfaces/income-calculators";
export function IncomeResults({ result }: IncomeResultProps) {
  const { formatCurrency, protect } = useFinancialFormatter();
  return <section aria-label="Resultado da simulação" className="space-y-5">
    <div className="grid gap-4 md:grid-cols-3">{[[result.partial ? "Líquido parcial estimado" : "Líquido mensal estimado", result.netCents], ["Proventos / receita bruta", result.proceedsCents], ["Total descontado", result.deductionsCents]].map(([label, amount]) => <Card key={String(label)} className="shadow-none"><CardHeader><CardTitle className="text-sm">{String(label)}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatCurrency(Number(amount))}</CardContent></Card>)}</div>
    <p className="text-sm text-content">Percentual líquido: {protect(`${result.netPercentage.toFixed(2).replace(".", ",")}%`)}</p>
    <IncomeDeductions result={result} />
    <Card className="shadow-none"><CardHeader><CardTitle>Distribuição mensal</CardTitle></CardHeader><CardContent><IncomeChart result={result} /></CardContent></Card>
    <Card className="shadow-none"><CardHeader><CardTitle>Memória do cálculo</CardTitle></CardHeader><CardContent>{result.annualRevenueCents !== undefined && <dl className="mb-5 grid gap-3 text-sm sm:grid-cols-3"><div><dt>Receita anual projetada</dt><dd className="font-semibold">{formatCurrency(result.annualRevenueCents)}</dd></div><div><dt>Pró-labore mensal</dt><dd className="font-semibold">{formatCurrency(result.proLaboreCents ?? 0)}</dd></div><div><dt>Lucro disponível para distribuição</dt><dd className="font-semibold">{formatCurrency(result.dividendsCents ?? 0)}</dd></div></dl>}<IncomeTable result={result} /></CardContent></Card>
    <Card className="shadow-none"><CardHeader><CardTitle>Premissas e observações</CardTitle></CardHeader><CardContent><ul className="space-y-2 text-sm text-content">{result.assumptions.map(note => <li key={note}>{protect(note)}</li>)}</ul></CardContent></Card>
  </section>;
}
