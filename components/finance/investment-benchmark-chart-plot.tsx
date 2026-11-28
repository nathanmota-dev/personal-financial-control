"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

import { InvestmentChartTooltipContent } from "@/components/finance/investment-chart-tooltip-content";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip } from "@/components/ui/chart";
import type { InvestmentBenchmarkChartPlotProps } from "@/lib/interfaces/investment-history";
import { INVESTMENT_CHART_MARGIN, investmentMonthAxisProps, investmentValueAxisProps } from "@/lib/utils/components/investment-chart";
import { formatAxisPercent, formatSignedPercent, INVESTMENT_BENCHMARK_LABELS } from "@/lib/utils/components/investment-history";

const SERIES_COLORS = { portfolio: "var(--chart-1)", cdi: "var(--chart-2)", ipca: "var(--chart-3)", ibov: "var(--chart-5)" } as const;

export function InvestmentBenchmarkChartPlot({ points, available }: InvestmentBenchmarkChartPlotProps) {
  const keys = ["portfolio", ...available] as const;
  const config = Object.fromEntries(keys.map((key) => [key, { label: INVESTMENT_BENCHMARK_LABELS[key], color: SERIES_COLORS[key] }]));
  return (
    <ChartContainer className="mt-5 min-h-[260px] w-full flex-1 rounded-xl bg-[var(--chart-surface)]" config={config}>
      <LineChart data={points} margin={INVESTMENT_CHART_MARGIN}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis {...investmentMonthAxisProps} />
        <YAxis {...investmentValueAxisProps} width={52} tickFormatter={(value) => formatAxisPercent(Number(value))} />
        <ReferenceLine y={0} stroke="var(--chart-grid)" />
        <ChartTooltip content={<InvestmentChartTooltipContent renderValue={(value) => formatSignedPercent(value)} />} />
        <ChartLegend content={<ChartLegendContent className="text-[11px] text-content" />} />
        {keys.map((key) => (
          <Line key={key} type="linear" dataKey={key} name={INVESTMENT_BENCHMARK_LABELS[key]} stroke={`var(--color-${key})`} strokeWidth={key === "portfolio" ? 3 : 2} dot={false} connectNulls isAnimationActive={false} />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
