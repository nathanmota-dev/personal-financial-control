"use client";

import {
ChartContainer,
ChartTooltip,
ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/finance-ui";
import type { DashboardChartsChartContainer1Props } from "@/lib/interfaces/render/dashboard-charts-dashboard-charts-chart-container1";
import { series } from "@/lib/utils/components/dashboard-charts";
import { Area,AreaChart,CartesianGrid,XAxis,YAxis } from "recharts";

export function DashboardChartsChartContainer1({ evolution }: DashboardChartsChartContainer1Props) {
  return (
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
  );
}
