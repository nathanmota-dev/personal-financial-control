"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency, formatRateFromBps } from "@/lib/finance-ui";

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

type InvestmentGrowthChartProps = {
  currentBalanceCents: number;
  monthlyContributionCents: number;
  expectedMonthlyRateBps: number;
  months: number;
  periodLabel: string;
};

type GrowthPoint = {
  month: number;
  principal: number;
  interest: number;
  total: number;
};

export function InvestmentGrowthChart({
  currentBalanceCents,
  monthlyContributionCents,
  expectedMonthlyRateBps,
  months,
  periodLabel,
}: InvestmentGrowthChartProps) {
  const data = buildGrowthSeries({
    currentBalanceCents,
    monthlyContributionCents,
    expectedMonthlyRateBps,
    months,
  });
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
            Capital aportado x juros
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Composição até {periodLabel} com taxa de {formatRateFromBps(expectedMonthlyRateBps)}.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
          <SummaryMetric
            label="Capital"
            value={formatCurrency(finalPrincipalCents)}
            tone="cyan"
          />
          <SummaryMetric
            label="Juros"
            value={formatCurrency(finalInterestCents)}
            tone="amber"
          />
          <SummaryMetric
            label="Peso dos juros"
            value={interestShare}
            tone="emerald"
          />
        </div>
      </div>

      <ChartContainer
        className="h-[460px] w-full"
        config={{
          principal: { label: "Capital aportado", color: "#38bdf8" },
          interest: { label: "Juros acumulados", color: "#f59e0b" },
        }}
      >
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            minTickGap={30}
            tickFormatter={(value) => formatAxisMonth(Number(value))}
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
                labelFormatter={(value) => formatHorizonLabel(Number(value))}
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
            name="Capital aportado"
            stackId="growth"
            fill="var(--color-principal)"
            fillOpacity={0.34}
            stroke="var(--color-principal)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="interest"
            name="Juros acumulados"
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

function buildGrowthSeries({
  currentBalanceCents,
  monthlyContributionCents,
  expectedMonthlyRateBps,
  months,
}: {
  currentBalanceCents: number;
  monthlyContributionCents: number;
  expectedMonthlyRateBps: number;
  months: number;
}): GrowthPoint[] {
  const rate = expectedMonthlyRateBps / 10_000;
  let balance = currentBalanceCents / 100;
  const points: GrowthPoint[] = [];

  for (let month = 1; month <= months; month += 1) {
    balance = balance * (1 + rate) + monthlyContributionCents / 100;

    const totalCents = Math.round(balance * 100);
    const principalCents = currentBalanceCents + monthlyContributionCents * month;
    const interestCents = Math.max(totalCents - principalCents, 0);

    points.push({
      month,
      principal: principalCents / 100,
      interest: interestCents / 100,
      total: totalCents / 100,
    });
  }

  return points;
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "amber" | "emerald";
}) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-200",
    emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  } as const;

  return (
    <div className={`rounded-2xl border px-3 py-2 ${tones[tone]}`}>
      <p className="text-[0.68rem] uppercase tracking-[0.18em] opacity-75">{label}</p>
      <p className="mt-1 font-heading text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function formatAxisCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}

function formatAxisMonth(month: number) {
  if (month >= 12 && month % 12 === 0) {
    return `${month / 12}a`;
  }

  return `${month}m`;
}

function formatHorizonLabel(month: number) {
  if (month === 1) {
    return "1 mês";
  }

  if (month < 12) {
    return `${month} meses`;
  }

  const years = Math.floor(month / 12);
  const remainingMonths = month % 12;
  const yearsLabel = `${years} ${years === 1 ? "ano" : "anos"}`;

  if (!remainingMonths) {
    return yearsLabel;
  }

  return `${yearsLabel} e ${remainingMonths} ${
    remainingMonths === 1 ? "mês" : "meses"
  }`;
}
