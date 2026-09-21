"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { CompoundInterestChartProps } from "@/lib/interfaces/compound-interest";
import { formatCurrency } from "@/lib/finance-ui";

function compactCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

export function CompoundInterestChart({ points }: CompoundInterestChartProps) {
  return (
    <ChartContainer
      className="h-[360px] w-full rounded-2xl bg-surface/35 p-2 md:h-[430px]"
      config={{
        balanceCents: { label: "Patrimônio", color: "var(--chart-brand)" },
        investedCents: { label: "Total investido", color: "var(--chart-success)" },
      }}
    >
      <LineChart data={points} margin={{ top: 12, right: 12, left: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          minTickGap={34}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          width={72}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => compactCurrency(Number(value))}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <>
                  <span className="text-muted-foreground">{String(name)}</span>
                  <span className="font-mono font-medium">{formatCurrency(Number(value))}</span>
                </>
              )}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="balanceCents"
          stroke="var(--color-balanceCents)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="investedCents"
          stroke="var(--color-investedCents)"
          strokeWidth={2}
          strokeDasharray="6 5"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
