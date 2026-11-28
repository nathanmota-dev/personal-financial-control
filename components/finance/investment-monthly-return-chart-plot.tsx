"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";

import { InvestmentChartTooltipContent } from "@/components/finance/investment-chart-tooltip-content";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { InvestmentMonthlyReturnChartPlotProps } from "@/lib/interfaces/investment-history";
import { INVESTMENT_CHART_MARGIN, investmentMonthAxisProps, investmentValueAxisProps } from "@/lib/utils/components/investment-chart";
import { formatAxisCurrency } from "@/lib/utils/components/investment-growth-chart";
import { formatSignedPercent } from "@/lib/utils/components/investment-history";

const CONFIG = { gain: { label: "Rendimento", color: "var(--success)" } };

export function InvestmentMonthlyReturnChartPlot({ points }: InvestmentMonthlyReturnChartPlotProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const data = points.map((point) => ({ month: point.month, gain: point.gainCents / 100, returnRate: point.returnRate }));
  return (
    <ChartContainer className="mt-5 min-h-[260px] w-full flex-1 rounded-xl bg-[var(--chart-surface)]" config={CONFIG}>
      <BarChart data={data} margin={INVESTMENT_CHART_MARGIN}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis {...investmentMonthAxisProps} />
        <YAxis {...investmentValueAxisProps} hide={hidden} width={68} tickFormatter={(value) => formatAxisCurrency(Number(value))} />
        <ReferenceLine y={0} stroke="var(--chart-grid)" />
        <ChartTooltip content={<InvestmentChartTooltipContent hideIndicator renderValue={(value, payload) => <>{formatCurrency(Math.round(value * 100))} · {formatSignedPercent(Number(payload.returnRate))}</>} />} />
        <Bar dataKey="gain" name="Rendimento" radius={[6, 6, 2, 2]} maxBarSize={28} isAnimationActive={false}>
          {data.map((point) => <Cell key={point.month} fill={point.gain < 0 ? "var(--destructive)" : "var(--success)"} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
