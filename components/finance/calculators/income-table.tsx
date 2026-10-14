import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { IncomeResultProps } from "@/lib/interfaces/income-calculators";
export function IncomeTable({ result }: IncomeResultProps) {
  const { formatCurrency, protect } = useFinancialFormatter();
  return <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><caption className="sr-only">Memória do cálculo mensal</caption>
    <thead><tr><th className="p-3">Item</th><th className="p-3">Base</th><th className="p-3">Alíquota</th><th className="p-3 text-right">Valor</th></tr></thead>
    <tbody>{result.lines.map(line => <tr key={line.label} className="border-t border-border"><th className="p-3 font-normal">{line.label}</th><td className="whitespace-nowrap p-3 tabular-nums">{formatCurrency(line.baseCents)}</td><td className="whitespace-nowrap p-3 tabular-nums">{protect(`${(line.rate * 100).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}%`)}</td><td className="whitespace-nowrap p-3 tabular-nums">{formatCurrency(line.amountCents)}</td></tr>)}</tbody>
  </table></div>;
}
