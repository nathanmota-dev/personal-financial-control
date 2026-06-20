"use client";

import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";
import { Plus, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency, formatMonthLabel } from "@/lib/finance-ui";

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

type ContributionHistory = {
  totalContributionCents: number;
  points: Array<{
    month: string;
    monthlyContributionCents: number;
    cumulativeContributionCents: number;
  }>;
};

export function InvestmentContributionChart({
  history,
  canRegisterContribution,
  onRegisterContribution,
}: {
  history: ContributionHistory;
  canRegisterContribution: boolean;
  onRegisterContribution: () => void;
}) {
  const data = history.points.map((point) => ({
    ...point,
    monthlyContribution: point.monthlyContributionCents / 100,
    cumulativeContribution: point.cumulativeContributionCents / 100,
  }));
  const latestPoint = history.points.at(-1);

  return (
    <Card className="h-full overflow-hidden rounded-[1.75rem] border-slate-800 bg-slate-950/75 shadow-[0_24px_80px_rgba(2,6,23,0.28)]">
      <CardHeader className="border-b border-slate-800/80 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-cyan-300">
              <WalletCards className="size-4" />
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]">
                Capital em movimento
              </span>
            </div>
            <h2 className="font-heading text-xl font-semibold text-slate-100">
              Aportes realizados
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Valores mensais e acumulados, sem incluir juros ou valorização.
            </p>
          </div>
          <Button
            type="button"
            disabled={!canRegisterContribution}
            onClick={onRegisterContribution}
            className="shrink-0"
          >
            <Plus className="size-4" />
            Registrar aporte
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <HistoryMetric
            label="Total aportado"
            value={formatCurrency(history.totalContributionCents)}
            tone="cyan"
          />
          <HistoryMetric
            label="Último mês"
            value={formatCurrency(latestPoint?.monthlyContributionCents ?? 0)}
            detail={latestPoint ? formatMonthLabel(latestPoint.month) : "Sem registros"}
            tone="sky"
          />
        </div>

        {data.length ? (
          <ChartContainer
            className="h-[330px] w-full"
            config={{
              monthlyContribution: { label: "Aporte mensal", color: "#38bdf8" },
              cumulativeContribution: { label: "Aportes acumulados", color: "#22d3ee" },
            }}
          >
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="investmentContributionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-cumulativeContribution)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-cumulativeContribution)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                minTickGap={26}
                tickFormatter={(value) => formatMonthLabel(String(value))}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={68}
                tickFormatter={(value) => compactCurrencyFormatter.format(Number(value))}
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
              <Bar
                dataKey="monthlyContribution"
                name="Aporte mensal"
                fill="var(--color-monthlyContribution)"
                fillOpacity={0.72}
                radius={[6, 6, 2, 2]}
                maxBarSize={34}
              />
              <Area
                type="monotone"
                dataKey="cumulativeContribution"
                name="Aportes acumulados"
                fill="url(#investmentContributionGradient)"
                stroke="var(--color-cumulativeContribution)"
                strokeWidth={2.5}
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="flex min-h-[330px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-700 bg-slate-900/35 px-6 text-center">
            <div className="rounded-full border border-cyan-400/15 bg-cyan-400/10 p-3 text-cyan-300">
              <WalletCards className="size-6" />
            </div>
            <p className="mt-4 font-heading text-lg font-semibold text-slate-100">
              Nenhum aporte realizado
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
              Registre o primeiro aporte para acompanhar a evolução mensal do capital investido.
            </p>
          </div>
        )}

        {!canRegisterContribution ? (
          <p className="mt-4 text-xs leading-5 text-amber-200/80">
            Cadastre uma carteira, uma conta de origem e uma categoria de investimento para registrar aportes.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function HistoryMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone: "cyan" | "sky";
}) {
  const styles = {
    cyan: "border-cyan-400/15 bg-cyan-400/8 text-cyan-200",
    sky: "border-sky-400/15 bg-sky-400/8 text-sky-200",
  } as const;

  return (
    <div className={`rounded-2xl border px-4 py-3 ${styles[tone]}`}>
      <p className="text-[0.68rem] uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold tracking-tight">{value}</p>
      {detail ? <p className="mt-1 text-xs opacity-65">{detail}</p> : null}
    </div>
  );
}
