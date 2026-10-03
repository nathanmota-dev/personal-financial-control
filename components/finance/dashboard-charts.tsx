"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DashboardCategoryCharts } from "@/components/finance/dashboard-category-charts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DashboardChartsProps } from "@/lib/interfaces/dashboard";
import { formatCurrency } from "@/lib/finance-ui";

const series = [
  { key: "income", label: "Receitas", color: "var(--chart-1)" },
  { key: "expenses", label: "Despesas", color: "var(--chart-2)" },
  { key: "investments", label: "Invest. líquidos", color: "var(--chart-3)" },
  { key: "net", label: "Saldo", color: "var(--chart-neutral)" },
];
export function DashboardCharts({
  evolution,
  categorySpending,
}: DashboardChartsProps) {
  const average = evolution.length
    ? evolution.reduce((sum, item) => sum + item.income, 0) / evolution.length
    : 0;
  const first = evolution[0]?.net ?? 0;
  const last = evolution.at(-1)?.net ?? 0;
  const variation = first ? ((last - first) / Math.abs(first)) * 100 : null;
  const accumulated = evolution.reduce((sum, item) => sum + item.net, 0);
  const variationLabel =
    variation === null
      ? "—"
      : `${variation > 0 ? "+" : ""}${variation.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,658fr)_minmax(0,436fr)]">
      <section className="min-w-0 rounded-[20px] border border-border bg-card p-[23px] xl:h-[704px]">
        <h2 className="text-xl leading-[27px] font-semibold">
          Evolução mensal
        </h2>
        <p className="mt-1 text-[13px] text-content-muted">
          Receita, saídas e resultado dos últimos meses
        </p>
        <div className="mt-[18px] grid grid-cols-2 gap-3 sm:grid-cols-4">
          {series.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-[7px] text-[11px] text-content"
            >
              <svg width="9" height="9">
                <circle cx="4.5" cy="4.5" r="4.5" fill={item.color} />
              </svg>
              {item.label}
            </div>
          ))}
        </div>
        <ChartContainer
          className="mt-[17px] h-[320px] w-full rounded-xl bg-[var(--chart-surface)]"
          config={Object.fromEntries(
            series.map((item) => [
              item.key,
              { label: item.label, color: item.color },
            ]),
          )}
        >
          <AreaChart
            data={evolution}
            margin={{ top: 30, right: 29, bottom: 8, left: -18 }}
          >
            <defs>
              <linearGradient
                id="dashboard-income-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tickMargin={16}
              fontSize={10}
              stroke="var(--content-subtle)"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickCount={5}
              fontSize={10}
              stroke="var(--content-subtle)"
              tickFormatter={(value) =>
                Math.abs(value) >= 1000 ? `${value / 1000}k` : String(value)
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <>
                      <span className="text-content">
                        {series.find((item) => item.key === name)?.label ??
                          name}
                      </span>
                      <strong>{formatCurrency(Number(value) * 100)}</strong>
                    </>
                  )}
                />
              }
            />
            {series.map((item) => (
              <Area
                key={item.key}
                type="linear"
                dataKey={item.key}
                stroke={item.color}
                strokeWidth={item.key === "income" ? 3 : 2}
                fill={
                  item.key === "income" ? "url(#dashboard-income-fill)" : "none"
                }
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ChartContainer>
        <div className="mt-[33px]">
          <h3 className="text-sm font-semibold">
            Resultado acumulado {accumulated >= 0 ? "positivo" : "negativo"}
          </h3>
          <p className="mt-[10px] min-h-[40px] text-[13px] leading-[19px] text-content">
            {variation === null
              ? "Acompanhe a evolução das receitas, despesas e investimentos ao longo dos meses."
              : `O saldo livre ${variation >= 0 ? "cresceu" : "diminuiu"} ${Math.abs(variation).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% nos últimos ${evolution.length} meses. O resultado acumulado no período é de ${formatCurrency(accumulated * 100)}.`}
          </p>
        </div>
        <div className="mt-[22px] grid grid-cols-2 gap-6 border-t border-border pt-[24px]">
          <div>
            <p className="text-xs text-content-muted">
              Média mensal de receitas
            </p>
            <p className="mt-2 text-xl font-semibold">
              {formatCurrency(average * 100)}
            </p>
          </div>
          <div>
            <p className="text-xs text-content-muted">Variação do saldo</p>
            <p className="mt-2 text-xl font-semibold text-brand">
              {variationLabel}
            </p>
          </div>
        </div>
      </section>
      <DashboardCategoryCharts categorySpending={categorySpending} />
    </div>
  );
}
