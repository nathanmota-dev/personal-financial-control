"use client";

import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { InvestmentChartTooltipContent } from "@/components/finance/investment-chart-tooltip-content";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip } from "@/components/ui/chart";
import type { InvestmentEvolutionChartPlotProps } from "@/lib/interfaces/investment-history";
import { INVESTMENT_CHART_MARGIN, investmentMonthAxisProps, investmentValueAxisProps } from "@/lib/utils/components/investment-chart";
import { formatAxisCurrency } from "@/lib/utils/components/investment-growth-chart";

const CONFIG = {
  value: { label: "Patrimônio", color: "var(--chart-1)" },
  invested: { label: "Capital aplicado", color: "var(--chart-2)" },
};

export function InvestmentEvolutionChartPlot({ points }: InvestmentEvolutionChartPlotProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const data = points.map((point) => ({ month: point.month, value: point.valueCents / 100, invested: point.investedCents / 100 }));
  return (
    <ChartContainer className="mt-5 h-[340px] w-full rounded-xl bg-[var(--chart-surface)] min-[100.0625rem]:h-[300px]" config={CONFIG}>
      <ComposedChart data={data} margin={INVESTMENT_CHART_MARGIN}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis {...investmentMonthAxisProps} minTickGap={26} />
        <YAxis {...investmentValueAxisProps} hide={hidden} width={72} domain={[(dataMin: number) => Math.max(0, Math.floor(dataMin * 0.9)), "auto"]} tickFormatter={(value) => formatAxisCurrency(Number(value))} />
        <ChartTooltip content={<InvestmentChartTooltipContent renderValue={(value) => formatCurrency(Math.round(value * 100))} />} />
        <ChartLegend content={<ChartLegendContent className="text-[11px] text-content" />} />
        <Area type="linear" baseValue="dataMin" dataKey="value" name="Patrimônio" fill="var(--color-value)" fillOpacity={0.18} stroke="var(--color-value)" strokeWidth={2} isAnimationActive={false} />
        <Line type="linear" dataKey="invested" name="Capital aplicado" stroke="var(--color-invested)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ChartContainer>
  );
}
