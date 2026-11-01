"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { expenseGroupDefinitions } from "@/lib/expense-groups-presentation";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { ExpenseGroupChartProps } from "@/lib/interfaces/expense-groups";

const config = Object.fromEntries(expenseGroupDefinitions.map((group) => [group.amountKey, { label: group.label, color: group.color }]));

export function ExpenseGroupsChart({ totals, series, mode }: ExpenseGroupChartProps) {
  const { formatCurrency, formatCurrencyText } = useFinancialFormatter();
  const negativeGroup = mode === "monthly" && expenseGroupDefinitions.some((group) => totals[group.amountKey] < 0);
  const data = expenseGroupDefinitions.map((group) => ({ name: group.label, amountCents: totals[group.amountKey], fill: group.color }));
  return <Card className="min-w-0 shadow-none">
    <CardHeader><CardTitle><h2>Distribuição dos gastos</h2></CardTitle>
      <CardDescription>Total geral: {formatCurrency(totals.totalCents)}. {mode === "annual" ? "Gastos líquidos por competência." : "Participação de cada grupo no gasto líquido do período."}</CardDescription>
    </CardHeader>
    <CardContent>
      {totals.totalCents <= 0 || negativeGroup ? <FinanceEmptyState title="Distribuição indisponível"
        description={negativeGroup ? "Há um grupo com créditos líquidos negativos. Confira os valores e percentuais nos cards." : "O gráfico exige um total líquido de despesas maior que zero."} /> : <>
        <ChartContainer config={config} className="h-64 w-full aspect-auto" aria-label={mode === "annual" ? "Gastos por grupo e competência" : "Participação dos grupos nas despesas"}>
          {mode === "annual" ? <BarChart data={series} stackOffset="sign" accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickFormatter={(month: string) => formatMonthLabel(month).split(" de ")[0].slice(0, 3)} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(value: number) => formatCurrencyText(value)} width={90} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => formatMonthLabel(String(payload[0].payload.month))} formatter={(value, name) => <span>{config[String(name)].label}: {formatCurrency(Number(value))}</span>} />} />
            {expenseGroupDefinitions.map((group) => <Bar key={group.key} dataKey={group.amountKey} stackId="expenses" fill={group.color} isAnimationActive={false} />)}
          </BarChart> : <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value, name) => <span>{name}: {formatCurrency(Number(value))}</span>} />} />
            <Pie data={data} dataKey="amountCents" nameKey="name" innerRadius="55%" outerRadius="85%" stroke="none" isAnimationActive={false}>
              {data.map((item) => <Cell key={item.name} fill={item.fill} />)}
            </Pie>
          </PieChart>}
        </ChartContainer>
        <ul aria-label="Legenda dos grupos" className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-content">
          {expenseGroupDefinitions.map((group) => <li key={group.key} className="flex items-center gap-2"><span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: group.color }} />{group.label}</li>)}
        </ul>
      </>}
    </CardContent>
  </Card>;
}
