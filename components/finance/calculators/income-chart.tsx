import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { IncomeResultProps } from "@/lib/interfaces/income-calculators";

function compact(cents: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(cents / 100);
}

export function IncomeChart({ result }: IncomeResultProps) {
  const { hidden, formatCurrencyText } = useFinancialFormatter();
  if (hidden) return <p className="text-xs text-content-muted">Gráfico oculto para proteger os valores financeiros.</p>;
  const data = [
    { label: "Proventos", amount: result.proceedsCents, color: "var(--chart-1)" },
    { label: "Descontos", amount: result.deductionsCents, color: "var(--chart-2)" },
    { label: "Líquido", amount: result.netCents, color: "var(--success)" },
  ];
  return <ChartContainer className="h-[240px] w-full rounded-xl bg-[var(--chart-surface)] p-2" config={{ amount: { label: "Valor", color: "var(--chart-1)" } }}>
    <BarChart accessibilityLayer data={data} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
      <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
      <XAxis dataKey="label" interval={0} tickLine={false} axisLine={false} tick={{ fill: "var(--content-subtle)", fontSize: 10 }} />
      <YAxis tickFormatter={value => compact(Number(value))} width={40} tickLine={false} axisLine={false} tick={{ fill: "var(--content-subtle)", fontSize: 10 }} />
      <ChartTooltip content={<ChartTooltipContent formatter={value => formatCurrencyText(Number(value))} />} />
      <Bar isAnimationActive={false} dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={56}>
        {data.map(item => <Cell key={item.label} fill={item.color} />)}
      </Bar>
    </BarChart>
  </ChartContainer>;
}
