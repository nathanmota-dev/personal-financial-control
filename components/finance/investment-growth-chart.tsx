"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { financeChartSurfaceClassName } from "@/components/finance/finance-styles";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { InvestmentGrowthSummaryMetric } from "@/components/finance/investment-growth-summary-metric";
import type { InvestmentGrowthChartProps } from "@/lib/interfaces/investments";
import { formatCurrency, formatMonthLabel, formatRateFromBps } from "@/lib/finance-ui";
import { buildInvestmentGrowthSeries } from "@/lib/investment-projection";
import { cn } from "@/lib/utils";

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function InvestmentGrowthChart({
  currentBalanceCents,
  expectedMonthlyRateBps,
  referenceDate,
  movements,
  months,
  periodLabel,
}: InvestmentGrowthChartProps) {
  const data = buildInvestmentGrowthSeries({
    currentBalanceCents,
    expectedMonthlyRateBps,
    referenceDate,
    movements,
    months,
  }).map((point) => ({
    ...point,
    principal: point.principalCents / 100,
    interest: point.interestCents / 100,
    total: point.balanceCents / 100,
  }));
  const finalPoint = data[data.length - 1];
  const finalPrincipalCents = Math.round((finalPoint?.principal ?? 0) * 100);
  const finalInterestCents = Math.round((finalPoint?.interest ?? 0) * 100);
  const finalTotalCents = Math.round((finalPoint?.total ?? 0) * 100);
  const interestShare =
    finalTotalCents > 0
      ? `${Math.round((finalInterestCents / finalTotalCents) * 100)}%`
      : "0%";

  if (!data.length) {
    return null;
  }

  return (
    <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/75 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.35)]">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-slate-100">
            Saldo estimado e movimentações
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Composição até {periodLabel} com taxa de {formatRateFromBps(expectedMonthlyRateBps)} e os lançamentos previstos.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
          <InvestmentGrowthSummaryMetric
            label="Saldo + movimentos"
            value={formatCurrency(finalPrincipalCents)}
            tone="cyan"
          />
          <InvestmentGrowthSummaryMetric
            label="Rendimento"
            value={formatCurrency(finalInterestCents)}
            tone="amber"
          />
          <InvestmentGrowthSummaryMetric
            label="Peso dos juros"
            value={interestShare}
            tone="emerald"
          />
        </div>
      </div>

      <ChartContainer
        className={cn(financeChartSurfaceClassName, "h-[460px] w-full")}
        config={{
          principal: { label: "Saldo + movimentos", color: "#38bdf8" },
          interest: { label: "Rendimento estimado", color: "#f59e0b" },
        }}
      >
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="competenceMonth"
            axisLine={false}
            tickLine={false}
            minTickGap={30}
            tickFormatter={(value) => formatMonthLabel(String(value))}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={72}
            tickFormatter={(value) => formatAxisCurrency(Number(value))}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => formatMonthLabel(String(value))}
                formatter={(value, name) => (
                  <>
                    <span className="text-muted-foreground">{String(name)}</span>
                    <span>{formatCurrency(Number(value) * 100)}</span>
                  </>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent className="text-slate-300" />} />
          <Area
            type="monotone"
            dataKey="principal"
            name="Saldo + movimentos"
            stackId="growth"
            fill="var(--color-principal)"
            fillOpacity={0.34}
            stroke="var(--color-principal)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="interest"
            name="Rendimento estimado"
            stackId="growth"
            fill="var(--color-interest)"
            fillOpacity={0.42}
            stroke="var(--color-interest)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function formatAxisCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}
