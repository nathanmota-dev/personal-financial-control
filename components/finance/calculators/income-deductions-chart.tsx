import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { IncomeDeductionsChartProps } from "@/lib/interfaces/income-calculators";

export function IncomeDeductionsChart({ deductions }: IncomeDeductionsChartProps) {
  const { hidden, formatCurrencyText, protect } = useFinancialFormatter();
  if (hidden) return <p className="text-xs text-content-muted">Composição dos descontos oculta para proteger os valores financeiros.</p>;
  const data = deductions.filter(item => item.amountCents > 0);
  if (!data.length) return <p className="text-xs text-content-muted">Nenhum desconto nesta simulação.</p>;
  return <div className="space-y-4">
    <ChartContainer className="mx-auto aspect-square h-[200px] min-[100.0625rem]:h-[180px]" config={{ amountCents: { label: "Desconto" } }}>
      <PieChart accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent nameKey="label" formatter={(value, name) => <div className="flex w-full items-center justify-between gap-4"><span>{name}</span><span className="font-semibold">{formatCurrencyText(Number(value))}</span></div>} />} />
        <Pie isAnimationActive={false} data={data} dataKey="amountCents" nameKey="label" innerRadius="57%" outerRadius="89%" paddingAngle={3} stroke="none">
          {data.map(item => <Cell key={item.label} fill={item.color} />)}
        </Pie>
      </PieChart>
    </ChartContainer>
    <ul aria-label="Legenda dos descontos" className="divide-y divide-border">
      {data.map(item => <li key={item.label} className="flex items-center justify-between gap-3 py-2 text-[13px] text-content-strong"><span className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate">{item.label}</span></span><span className="shrink-0 text-[11px] text-content-subtle">{protect(`${item.percentage.toFixed(1).replace(".", ",")}%`)}</span></li>)}
    </ul>
  </div>;
}
