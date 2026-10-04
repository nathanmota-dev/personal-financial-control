import { DashboardMetric } from "@/components/finance/dashboard-metric";
import {
formatCurrency
} from "@/lib/finance-ui";
import type { DashboardPageSection1Props } from "@/lib/interfaces/render/page-dashboard-page-section1";
import { TrendingDown,TrendingUp } from "lucide-react";

export function DashboardPageSection1({ resolved }: DashboardPageSection1Props) {
  return (
<section className="grid gap-[14px] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <DashboardMetric
          label="Receitas"
          value={formatCurrency(resolved.dashboard.totals.incomeCents)}
          icon={<TrendingUp className="size-[19px]" />}
          accent="text-success"
          description="Entradas confirmadas no mês"
        />
        <DashboardMetric
          label="Gastos fixos"
          value={formatCurrency(resolved.dashboard.totals.fixedExpenseCents)}
          icon={<TrendingDown className="size-[19px]" />}
          accent="text-danger"
          description="Compromissos recorrentes"
        />
        <DashboardMetric
          label="Gastos variáveis"
          value={formatCurrency(resolved.dashboard.totals.variableExpenseCents)}
          icon={<TrendingDown className="size-[19px]" />}
          accent="text-danger"
          description="Despesas flexíveis do período"
        />
        <DashboardMetric
          label="Investimentos líquidos"
          value={formatCurrency(
            resolved.dashboard.totals.netInvestmentFlowCents,
          )}
          icon={<TrendingUp className="size-[19px]" />}
          accent="text-success"
          description="Aportes menos resgates"
        />
        <DashboardMetric
          label="Saldo livre"
          value={formatCurrency(resolved.dashboard.totals.netResultCents)}
          icon={<TrendingUp className="size-[19px]" />}
          accent={
            resolved.dashboard.totals.netResultCents >= 0
              ? "text-success"
              : "text-danger"
          }
          description="Disponível após gastos e aportes"
        />
      </section>
  );
}
