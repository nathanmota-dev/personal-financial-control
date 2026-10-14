import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { IncomeResultProps } from "@/lib/interfaces/income-calculators";
export function IncomeChart({ result }: IncomeResultProps) {
  const { hidden, formatCurrencyText } = useFinancialFormatter();
  if (hidden) return <p className="text-sm text-content-muted">Gráfico oculto para proteger os valores financeiros.</p>;
  return <ChartContainer className="h-64 w-full" config={{ amount: { label: "Valor", color: "var(--chart-brand)" } }}>
    <BarChart accessibilityLayer data={[{ label: "Proventos", amount: result.proceedsCents }, { label: "Descontos", amount: result.deductionsCents }, { label: "Líquido", amount: result.netCents }]}>
      <XAxis dataKey="label" interval={0} tick={{ fill: "var(--content-muted)", fontSize: 11 }} /><YAxis tickFormatter={value => formatCurrencyText(Number(value))} width={90} tick={{ fill: "var(--content-muted)", fontSize: 11 }} />
      <ChartTooltip content={<ChartTooltipContent formatter={value => formatCurrencyText(Number(value))} />} /><Bar isAnimationActive={false} dataKey="amount" fill="var(--color-amount)" radius={4} />
    </BarChart>
  </ChartContainer>;
}
