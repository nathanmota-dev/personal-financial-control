"use client";

import { BarChart3 } from "lucide-react";
import { DistributionChartCardContent1 } from "./distribution-chart-distribution-chart-card-content1";

import { financePanelClassName } from "@/components/finance/finance-styles";
import { Card,CardHeader,CardTitle } from "@/components/ui/card";
import type { DistributionChartProps } from "@/lib/interfaces/investment-portfolio";

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
          <span className="text-[0.68rem] font-semibold">
            Composição
          </span>
        </div>
        <CardTitle className="text-xl text-content-strong">Distribuição por tipo de ativo</CardTitle>
        <p className="mt-1 text-sm leading-6 text-content">
          Veja onde o patrimônio está concentrado antes de decidir os próximos movimentos.
        </p>
      </CardHeader>

      <DistributionChartCardContent1 data={data} dashboard={dashboard} />
    </Card>
  );
}
