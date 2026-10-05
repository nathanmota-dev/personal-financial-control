import { DashboardMetric } from "@/components/finance/dashboard-metric";
import { formatCurrency } from "@/lib/finance-ui";
import type { BudgetsViewProps } from "@/lib/interfaces/budgets";

export function BudgetMetrics({ overview }: BudgetsViewProps) {
  const limits = overview.rows.filter((row) => row.limit);
  const planned = limits.reduce((sum, row) => sum + row.limit!.amountCents, 0);
  const posted = overview.rows.reduce((sum, row) => sum + row.postedCents, 0);
  const pending = overview.rows.reduce((sum, row) => sum + row.pendingCents, 0);
  const remaining = limits.reduce((sum, row) => sum + row.remainingCents!, 0);
  const metrics = [
    { label: "Limites do mês", value: formatCurrency(planned), description: `${limits.length} categoria(s) com limite definido` },
    { label: "Realizado", value: formatCurrency(posted), description: "Despesas efetivadas e parcelas do mês" },
    { label: "Pendente", value: formatCurrency(pending), description: "Compromissos ainda não efetivados" },
    { label: "Comprometido", value: formatCurrency(overview.committedCents), description: "Realizado + pendente, em todas as categorias" },
    { label: "Saldo dos limites", value: limits.length ? formatCurrency(remaining) : "—", description: "Disponível nas categorias com limite" },
  ];
  return <section aria-label="Resumo dos orçamentos" className="grid gap-[14px] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
    {metrics.map((metric) => <DashboardMetric key={metric.label} label={metric.label} value={metric.value} comparison={{ direction: "stable", tone: "neutral", differenceCents: 0, percentage: null, valueLabel: "", description: metric.description }} />)}
  </section>;
}
