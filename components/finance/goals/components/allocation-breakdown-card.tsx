"use client";

import { Cell, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/finance-ui";

import { ALLOCATION_BREAKDOWN_CHART_CONFIG } from "../goals-constants";
import type { AllocationBreakdownCardProps } from "../goals-types";

export function AllocationBreakdownCard({
  dashboard,
}: AllocationBreakdownCardProps) {
  const data = dashboard.charts.allocationBreakdown.map((item) => ({
    ...item,
    amount: item.amountCents / 100,
  }));
  const hasData = data.some((item) => item.amount > 0);

  return (
    <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
      <CardHeader>
        <CardTitle>Divisão da carteira</CardTitle>
        <p className="text-sm text-slate-400">Metas visíveis e reserva livre.</p>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer
            className="h-[260px] w-full"
            config={ALLOCATION_BREAKDOWN_CHART_CONFIG}
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => (
                      <>
                        <span className="text-muted-foreground">
                          {String(item.payload.name)}
                        </span>
                        <span>{formatCurrency(Number(value) * 100)}</span>
                      </>
                    )}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                innerRadius={54}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((item) => (
                  <Cell key={item.id} fill={item.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex min-h-[260px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-800 bg-slate-900/35 px-6 text-center text-sm text-slate-400">
            Nenhuma alocação disponível para o gráfico.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
