"use client";

import { financeChartSurfaceClassName } from "@/components/finance/finance-styles";
import { CardContent } from "@/components/ui/card";
import {
ChartContainer,
ChartTooltip,
ChartTooltipContent,
} from "@/components/ui/chart";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { DistributionChartCardContent1Props } from "@/lib/interfaces/render/distribution-chart-distribution-chart-card-content1";
import { cn } from "@/lib/utils";
import { DISTRIBUTION_CHART_CONFIG } from "@/lib/utils/components/distribution-chart";
import { Cell,Pie,PieChart } from "recharts";

export function DistributionChartCardContent1({ data, dashboard }: DistributionChartCardContent1Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
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
              <Pie isAnimationActive={false} data={data}
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
          <div className="flex min-h-[236px] items-center justify-center rounded-2xl border border-dashed border-input bg-card px-6 text-center text-sm leading-6 text-content">
            Cadastre um ativo para visualizar a composição patrimonial.
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
          <table className="w-full text-sm">
            <caption className="sr-only">Tabela acessível da distribuição por tipo de ativo</caption>
            <thead className="border-b border-border/80 text-left text-xs font-medium text-content">
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
                  <td className="px-4 py-4 text-content" colSpan={3}>
                    Sem composição cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs leading-5 text-content">
          {dashboard.globalBalanceCents !== null
            ? "Percentuais calculados contra o saldo global projetado."
            : "Sem carteira global: percentuais calculados contra o total cadastrado."}
        </p>
      </CardContent>
  );
}
