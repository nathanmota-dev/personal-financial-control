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

import type {
  ProjectedBalanceChartPoint,
  ProjectedBalanceChartProps,
} from "@/app/interfaces/projected-balance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";

import { statusLabels } from "./labels";

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function ProjectedBalanceChart({
  daily,
  minimumReserveCents,
}: ProjectedBalanceChartProps) {
  const data = useMemo<ProjectedBalanceChartPoint[]>(
    () =>
      daily.map((day) => ({
        date: day.date,
        label: formatDateLabel(day.date),
        balance: day.projectedBalanceCents / 100,
        zero: 0,
        minimumReserve:
          minimumReserveCents > 0 ? minimumReserveCents / 100 : undefined,
        status: day.status,
        statusLabel: statusLabels[day.status],
      })),
    [daily, minimumReserveCents]
  );

  return (
    <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
      <CardHeader>
        <CardTitle>Evolução diária</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="h-[360px] w-full"
          config={{
            balance: { label: "Saldo projetado", color: "#22d3ee" },
            zero: { label: "Zero", color: "#f43f5e" },
            minimumReserve: { label: "Reserva mínima", color: "#f59e0b" },
          }}
        >
          <LineChart data={data} margin={{ top: 12, right: 18, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              minTickGap={30}
              tickFormatter={(value) => formatDateLabel(String(value))}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={78}
              tickFormatter={(value) => formatAxisCurrency(Number(value))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_value, payload) => {
                    const point = payload?.[0]?.payload as
                      | ProjectedBalanceChartPoint
                      | undefined;
                    return point
                      ? `${formatDateLabel(point.date)} · ${point.statusLabel}`
                      : "Saldo projetado";
                  }}
                  formatter={(value, name) => (
                    <>
                      <span className="text-muted-foreground">{String(name)}</span>
                      <span>{formatCurrency(Number(value) * 100)}</span>
                    </>
                  )}
                />
              }
            />
            <ReferenceLine y={0} stroke="var(--color-zero)" strokeDasharray="4 4" />
            {minimumReserveCents > 0 ? (
              <ReferenceLine
                y={minimumReserveCents / 100}
                stroke="var(--color-minimumReserve)"
                strokeDasharray="5 5"
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="balance"
              name="Saldo projetado"
              stroke="var(--color-balance)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function formatAxisCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}
