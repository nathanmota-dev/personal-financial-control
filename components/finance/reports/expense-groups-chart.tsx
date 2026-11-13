"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ReportCard } from "@/components/finance/reports/report-card";
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
  return <ReportCard title="Distribuição dos gastos" illustrationSrc="/images/expenses-pie.webp"
    description={<>Total geral: {formatCurrency(totals.totalCents)}. {mode === "annual" ? "Gastos líquidos por competência." : "Participação de cada grupo no gasto líquido do período."}</>}>
      {totals.totalCents <= 0 || negativeGroup ? <FinanceEmptyState title="Distribuição indisponível"
        description={negativeGroup ? "Há um grupo com créditos líquidos negativos. Confira os valores e percentuais nos cards." : "O gráfico exige um total líquido de despesas maior que zero."} /> : <>
        <div className={mode === "annual" ? "" : "grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"}><ChartContainer config={config} className={mode === "annual" ? "aspect-auto h-[320px] w-full rounded-xl bg-[var(--chart-surface)]" : "aspect-auto h-64 w-full"} aria-label={mode === "annual" ? "Gastos por grupo e competência" : "Participação dos grupos nas despesas"}>
          {mode === "annual" ? <BarChart data={series} stackOffset="sign" accessibilityLayer margin={{ top: 30, right: 29, bottom: 8, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="month" tickFormatter={(month: string) => formatMonthLabel(month).split(" de ")[0].slice(0, 3)} tickLine={false} axisLine={false} tickMargin={16} fontSize={10} stroke="var(--content-subtle)" />
            <YAxis tickFormatter={(value: number) => formatCurrencyText(value)} width={90} tickLine={false} axisLine={false} fontSize={10} stroke="var(--content-subtle)" />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => formatMonthLabel(String(payload[0].payload.month))} formatter={(value, name) => <span>{config[String(name)].label}: {formatCurrency(Number(value))}</span>} />} />
            {expenseGroupDefinitions.map((group) => <Bar key={group.key} dataKey={group.amountKey} stackId="expenses" fill={group.color} maxBarSize={28} isAnimationActive={false} />)}
          </BarChart> : <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value, name) => <span>{name}: {formatCurrency(Number(value))}</span>} />} />
            <Pie data={data} dataKey="amountCents" nameKey="name" innerRadius="57%" outerRadius="89%" paddingAngle={3} stroke="none" isAnimationActive={false}>
              {data.map((item) => <Cell key={item.name} fill={item.fill} />)}
            </Pie>
          </PieChart>}
        </ChartContainer>
        <ul aria-label="Legenda dos grupos" className={mode === "annual" ? "mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-content" : "divide-y divide-border text-[13px]"}>
          {expenseGroupDefinitions.map((group) => <li key={group.key} className={mode === "annual" ? "flex items-center gap-2" : "flex items-center justify-between gap-3 py-3"}><span className="flex items-center gap-2 text-content"><span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: group.color }} />{group.label}</span>{mode !== "annual" && <span className="font-semibold tabular-nums">{formatCurrency(totals[group.amountKey])}</span>}</li>)}
        </ul></div>
      </>}
  </ReportCard>;
}
