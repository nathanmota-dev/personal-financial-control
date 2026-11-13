"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

import type { ProjectedBalanceChartPoint, ProjectedBalanceChartPlotProps } from "@/app/interfaces/projected-balance";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatDateLabel } from "@/lib/finance-ui";

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function ProjectedBalanceChartPlot({ data, minimumReserveCents }: ProjectedBalanceChartPlotProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <ChartContainer
      className="mt-[17px] min-h-[320px] w-full flex-1 rounded-xl bg-[var(--chart-surface)] min-[100.0625rem]:min-h-[280px]"
      config={{
        balance: { label: "Saldo projetado", color: "var(--chart-1)" },
        zero: { label: "Zero", color: "var(--destructive)" },
        minimumReserve: { label: "Reserva mínima", color: "var(--warning)" },
      }}
    >
      <LineChart data={data} margin={{ top: 30, right: 29, bottom: 8, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tickMargin={16}
          minTickGap={30}
          fontSize={10}
          stroke="var(--content-subtle)"
          tickFormatter={(value) => formatDateLabel(String(value)).slice(0, 5)}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tickCount={5}
          width={64}
          fontSize={10}
          stroke="var(--content-subtle)"
          tickFormatter={(value) => compactCurrencyFormatter.format(Number(value))}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_value, payload) => {
                const point = payload?.[0]?.payload as ProjectedBalanceChartPoint | undefined;
                return point ? `${formatDateLabel(point.date)} · ${point.statusLabel}` : "Saldo projetado";
              }}
              formatter={(value, name) => (
                <>
                  <span className="text-content">{String(name)}</span>
                  <strong>{formatCurrency(Number(value) * 100)}</strong>
                </>
              )}
            />
          }
        />
        <ReferenceLine y={0} stroke="var(--color-zero)" strokeDasharray="4 4" />
        {minimumReserveCents > 0 ? (
          <ReferenceLine y={minimumReserveCents / 100} stroke="var(--color-minimumReserve)" strokeDasharray="5 5" />
        ) : null}
        <Line
          type="linear"
          dataKey="balance"
          name="Saldo projetado"
          stroke="var(--color-balance)"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
