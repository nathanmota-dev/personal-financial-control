import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { IncomeDeductionsChartProps } from "@/lib/interfaces/income-calculators";

export function IncomeDeductionsChart({ deductions }: IncomeDeductionsChartProps) {
  const { hidden, formatCurrencyText, protect } = useFinancialFormatter();
  if (hidden) return <p className="text-sm text-content-muted">Composição dos descontos oculta para proteger os valores financeiros.</p>;
  const data = deductions.filter(item => item.amountCents > 0);
  if (!data.length) return <p className="text-sm text-content-muted">Nenhum desconto nesta simulação.</p>;
  return <>
    <ChartContainer className="mx-auto h-64 w-full" config={{ amountCents: { label: "Desconto" } }}>
      <PieChart accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent nameKey="label" formatter={(value, name) => <div className="flex w-full items-center justify-between gap-4"><span>{name}</span><span className="font-semibold">{formatCurrencyText(Number(value))}</span></div>} />} />
        <Pie isAnimationActive={false} data={data} dataKey="amountCents" nameKey="label" innerRadius="55%" outerRadius="85%" paddingAngle={3} stroke="none">
          {data.map(item => <Cell key={item.label} fill={item.color} />)}
        </Pie>
      </PieChart>
    </ChartContainer>
    <ul aria-label="Legenda dos descontos" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-content">
      {data.map(item => <li key={item.label} className="flex items-center gap-2"><span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />{item.label} · {protect(`${item.percentage.toFixed(1).replace(".", ",")}%`)}</li>)}
    </ul>
  </>;
}
