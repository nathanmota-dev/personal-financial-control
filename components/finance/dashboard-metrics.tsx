import { DashboardMetric } from "@/components/finance/dashboard-metric";
import { formatCurrency } from "@/lib/finance-ui";
import type { DashboardMetricKey, DashboardMetricListProps } from "@/lib/interfaces/dashboard";

const metrics: { key: DashboardMetricKey; label: string }[] = [
  { key: "incomeCents", label: "Receitas" },
  { key: "fixedExpenseCents", label: "Gastos fixos" },
  { key: "variableExpenseCents", label: "Gastos variáveis" },
  { key: "netInvestmentFlowCents", label: "Investimentos líquidos" },
  { key: "netResultCents", label: "Saldo livre" },
];
export function DashboardMetrics({ totals, comparisons }: DashboardMetricListProps) {
  return (
    <section className="grid gap-[14px] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      {metrics.map(({ key, label }) => <DashboardMetric key={key} label={label} value={formatCurrency(totals[key])} comparison={comparisons[key]} />)}
    </section>
  );
}
