"use client";

import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";
import { ArrowDownToLine, ArrowUpFromLine, WalletCards } from "lucide-react";

import { financeChartSurfaceClassName } from "@/components/finance/finance-styles";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InvestmentHistoryMetric } from "@/components/finance/investment-history-metric";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { InvestmentContributionChartProps } from "@/lib/interfaces/investments";
import { formatCurrency, formatMonthLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function InvestmentContributionChart({
  history,
}: InvestmentContributionChartProps) {
  const data = history.points.map((point) => ({
    ...point,
    monthlyContribution: point.monthlyContributionCents / 100,
    monthlyWithdrawal: point.monthlyWithdrawalCents / 100,
    cumulativeNetMovement: point.cumulativeNetMovementCents / 100,
  }));
  const latestPoint = history.points.at(-1);
  const netMovementCents = history.totalContributionCents - history.totalWithdrawalCents;

  return (
    <Card className="h-full overflow-hidden rounded-[1.75rem] border-border bg-surface/75 shadow-[0_24px_80px_rgb(var(--surface-rgb) / .28)]">
      <CardHeader className="border-b border-border/80 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-brand">
              <WalletCards className="size-4" />
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]">
                Movimentações reais
              </span>
            </div>
            <h2 className="font-heading text-xl font-semibold text-content-strong">
              Aportes e resgates
            </h2>
            <p className="mt-1 text-sm leading-6 text-content">
              Histórico dos lançamentos realizados, sem misturar rendimento estimado.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-brand/15 bg-brand/8 px-3 py-2 text-xs text-brand">
            <ArrowUpFromLine className="size-3.5" />
            <span>Ligado a Lançamentos</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <InvestmentHistoryMetric
            label="Total aportado"
            value={formatCurrency(history.totalContributionCents)}
            tone="cyan"
          />
          <InvestmentHistoryMetric
            label="Total resgatado"
            value={formatCurrency(history.totalWithdrawalCents)}
            detail={latestPoint ? formatMonthLabel(latestPoint.month) : "Sem registros"}
            tone="amber"
          />
          <InvestmentHistoryMetric
            label="Movimentação líquida"
            value={formatCurrency(netMovementCents)}
            tone="sky"
          />
        </div>

        {data.length ? (
          <ChartContainer
            className={cn(financeChartSurfaceClassName, "h-[330px] w-full")}
            config={{
              monthlyContribution: { label: "Aportes", color: "var(--chart-brand)" },
              monthlyWithdrawal: { label: "Resgates", color: "var(--chart-warning)" },
              cumulativeNetMovement: { label: "Movimentação líquida", color: "var(--chart-brand)" },
            }}
          >
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="investmentMovementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-cumulativeNetMovement)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-cumulativeNetMovement)" stopOpacity={0.02} />
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
              <ChartLegend content={<ChartLegendContent className="text-content" />} />
              <Bar
                dataKey="monthlyContribution"
                name="Aportes"
                fill="var(--color-monthlyContribution)"
                fillOpacity={0.72}
                radius={[6, 6, 2, 2]}
                maxBarSize={28}
              />
              <Bar
                dataKey="monthlyWithdrawal"
                name="Resgates"
                fill="var(--color-monthlyWithdrawal)"
                fillOpacity={0.72}
                radius={[6, 6, 2, 2]}
                maxBarSize={28}
              />
              <Area
                type="monotone"
                dataKey="cumulativeNetMovement"
                name="Movimentação líquida"
                fill="url(#investmentMovementGradient)"
                stroke="var(--color-cumulativeNetMovement)"
                strokeWidth={2.5}
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="flex min-h-[330px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-input bg-surface-raised/35 px-6 text-center">
            <div className="rounded-full border border-brand/15 bg-brand/10 p-3 text-brand">
              <ArrowDownToLine className="size-6" />
            </div>
            <p className="mt-4 font-heading text-lg font-semibold text-content-strong">
              Nenhuma movimentação realizada
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-content">
              Cadastre aportes ou resgates na tela de Lançamentos para acompanhar o capital em movimento.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
