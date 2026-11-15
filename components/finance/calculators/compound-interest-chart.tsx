"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { CompoundInterestChartProps } from "@/lib/interfaces/compound-interest";

const legend = [
  { label: "Patrimônio", color: "var(--chart-1)" },
  { label: "Total investido", color: "var(--chart-2)" },
];

function compactCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(cents / 100);
}

export function CompoundInterestChart({ points }: CompoundInterestChartProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  if (hidden) return <p className="flex h-[320px] items-center justify-center rounded-xl bg-[var(--chart-surface)] text-xs text-content-muted">Gráfico oculto para proteger os valores financeiros.</p>;
  return (
    <div className="space-y-3">
      <ul aria-label="Legenda do gráfico" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {legend.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-[11px] text-content">
            <span aria-hidden className="size-[9px] shrink-0 rounded-full" style={{ backgroundColor: item.color }} />{item.label}
          </li>
        ))}
      </ul>
      <ChartContainer
        className="h-[320px] w-full rounded-xl bg-[var(--chart-surface)] p-2"
        config={{
          balanceCents: { label: "Patrimônio", color: "var(--chart-1)" },
          investedCents: { label: "Total investido", color: "var(--chart-2)" },
        }}
      >
        <LineChart data={points} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="label" minTickGap={34} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--content-subtle)" }} />
          <YAxis width={44} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--content-subtle)" }} tickFormatter={(value) => compactCurrency(Number(value))} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <>
                    <span className="text-content">{String(name)}</span>
                    <span className="font-medium tabular-nums">{formatCurrency(Number(value))}</span>
                  </>
                )}
              />
            }
          />
          <Line type="linear" dataKey="balanceCents" stroke="var(--color-balanceCents)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
          <Line type="linear" dataKey="investedCents" stroke="var(--color-investedCents)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
