"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { formatCreditCardMonth } from "@/lib/credit-card-view";
import { formatCurrency } from "@/lib/finance-ui";
import type {
  CreditCardTimelineChartProps,
} from "@/lib/interfaces/credit-card-view";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function CreditCardTimelineChart({ points }: CreditCardTimelineChartProps) {
  const data = useMemo(
    () => points.map((point) => ({ month: point.month, amount: point.totalCents / 100 })),
    [points]
  );
  const amounts = data.map((point) => point.amount);
  const minAmount = Math.min(...amounts, 0);
  const maxAmount = Math.max(...amounts, 0);
  const range = Math.max(maxAmount - minAmount, 1);
  const domain: [number, number] = [
    minAmount < 0 ? minAmount - range * 0.12 : 0,
    maxAmount + range * 0.16,
  ];

  return (
    <ChartContainer
      className={cn("h-[226px] w-full", points.length < 2 && "h-[180px]")}
      config={{ amount: { label: "Fatura", color: "var(--chart-brand)" } }}
    >
      <LineChart data={data} margin={{ top: 22, right: 14, bottom: 4, left: 2 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          minTickGap={24}
          tickFormatter={(value) => formatCreditCardMonth(String(value))}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={70}
          domain={domain}
          tickFormatter={(value) => compactCurrencyFormatter.format(Number(value))}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => formatCreditCardMonth(String(value))}
              formatter={(value) => <span>{formatCurrency(Number(value) * 100)}</span>}
            />
          }
        />
        <ReferenceLine y={0} stroke="rgb(var(--content-muted-rgb) / .65)" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="amount"
          name="Fatura"
          stroke="var(--color-amount)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "var(--surface);", stroke: "var(--chart-brand)", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: "var(--brand-strong)", stroke: "var(--content-strong)", strokeWidth: 2 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
