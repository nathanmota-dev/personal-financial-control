"use client";

import { Cell, Pie, PieChart } from "recharts";
import { BarChart3 } from "lucide-react";

import { financeChartSurfaceClassName, financePanelClassName } from "@/components/finance/finance-styles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DistributionChartProps } from "@/lib/interfaces/investment-portfolio";
import { formatCurrency } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

const DISTRIBUTION_CHART_CONFIG = {
  amount: {
    label: "Patrimônio",
    color: "var(--chart-brand)",
  },
};

export function DistributionChart({ dashboard }: DistributionChartProps) {
  const data = dashboard.distribution.map((item) => ({
    ...item,
    amount: item.amountCents / 100,
  }));

  return (
    <Card className={financePanelClassName + " h-full"}>
      <CardHeader>
        <div className="mb-2 flex items-center gap-2 text-brand">
          <BarChart3 className="size-4" />
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]">
            Composição
          </span>
        </div>
        <CardTitle className="text-xl text-content-strong">Distribuição por tipo de ativo</CardTitle>
        <p className="mt-1 text-sm leading-6 text-content">
          Veja onde o patrimônio está concentrado antes de decidir os próximos movimentos.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {data.length ? (
          <ChartContainer
            className={cn(financeChartSurfaceClassName, "h-[236px] w-full")}
            config={DISTRIBUTION_CHART_CONFIG}
            aria-label="Distribuição patrimonial por tipo de ativo"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => (
                      <>
                        <span className="text-muted-foreground">{String(item.payload.label)}</span>
                        <span>{formatCurrency(Number(value) * 100)}</span>
                      </>
                    )}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="amount"
                nameKey="label"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={3}
                stroke="rgb(var(--surface-rgb) / .8)"
                strokeWidth={2}
              >
                {data.map((item) => (
                  <Cell key={item.assetClass} fill={item.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex min-h-[236px] items-center justify-center rounded-2xl border border-dashed border-input bg-surface-raised/35 px-6 text-center text-sm leading-6 text-content">
            Cadastre um ativo para visualizar a composição patrimonial.
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface-raised/35">
          <table className="w-full text-sm">
            <caption className="sr-only">Tabela acessível da distribuição por tipo de ativo</caption>
            <thead className="border-b border-border/80 text-left text-xs uppercase tracking-[0.14em] text-content-strong0">
              <tr>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {data.length ? (
                data.map((item) => (
                  <tr key={item.assetClass} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 text-content">
                      <span className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-content-strong">
                      {formatCurrency(item.amountCents)}
                    </td>
                    <td className="px-4 py-3 text-right text-content">
                      {item.percentage.toFixed(1).replace(".", ",")}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-content-strong0" colSpan={3}>
                    Sem composição cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs leading-5 text-content-strong0">
          {dashboard.globalBalanceCents !== null
            ? "Percentuais calculados contra o saldo global projetado."
            : "Sem carteira global: percentuais calculados contra o total cadastrado."}
        </p>
      </CardContent>
    </Card>
  );
}
