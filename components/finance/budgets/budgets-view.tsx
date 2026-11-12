import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
import type { BudgetsViewProps } from "@/lib/interfaces/budgets";
import { BudgetActions } from "./budget-actions";
import { BudgetCard } from "./budget-card";
import { BudgetRules } from "./budget-rules";
import { BudgetSection } from "./budget-section";
import { BudgetSummary } from "./budget-summary";

export function BudgetsView({ overview }: BudgetsViewProps) {
  const limited = overview.rows.filter((row) => row.limit);
  const unbounded = overview.rows.filter((row) => !row.limit && row.categoryId);
  const uncategorized = overview.rows.filter((row) => !row.categoryId);
  const available = overview.categories.filter((category) => !limited.some((row) => row.categoryId === category.id));
  return <div className="space-y-6 min-[100.0625rem]:space-y-5">
    <PageHeader title="Orçamentos" description="Planeje o mês e acompanhe o consumo dos limites por categoria." actions={<BudgetActions key={overview.month} month={overview.month} categories={available} />} />
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <BudgetSummary overview={overview} />
      <BudgetRules />
    </div>
    {limited.length ? (
      <BudgetSection title="Categorias com limite" description="Planejado e comprometido na competência selecionada" rows={limited} month={overview.month} />
    ) : (
      <BudgetCard title="Categorias com limite" description="Planejado e comprometido na competência selecionada">
        <FinanceEmptyState title="Nenhum limite definido" description="Use Novo limite ou copie o mês anterior para começar a planejar esta competência." />
      </BudgetCard>
    )}
    {unbounded.length > 0 && <BudgetSection title="Despesas sem limite" description="Gastos do mês em categorias que ainda não têm orçamento" rows={unbounded} month={overview.month} />}
    {uncategorized.length > 0 && <BudgetSection title="Despesas sem categoria" description="Valores incluídos no total comprometido, sem um limite associado" rows={uncategorized} month={overview.month} />}
  </div>;
}
