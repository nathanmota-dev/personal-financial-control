import { SectionCard } from "@/components/finance/ds/section-card";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
import type { BudgetsViewProps } from "@/lib/interfaces/budgets";
import { CircleDashed, Gauge, Info, Layers } from "lucide-react";
import { BudgetActions } from "./budget-actions";
import { BudgetHero } from "./budget-hero";
import { BudgetSection } from "./budget-section";

export function BudgetsView({ overview }: BudgetsViewProps) {
  const limited = overview.rows.filter((row) => row.limit);
  const unbounded = overview.rows.filter((row) => !row.limit && row.categoryId);
  const uncategorized = overview.rows.filter((row) => !row.categoryId);
  const available = overview.categories.filter((category) => !limited.some((row) => row.categoryId === category.id));
  return <div className="space-y-6 min-[100.0625rem]:space-y-5">
    <PageHeader title="Orçamentos" description="Planeje o mês e acompanhe o consumo dos limites por categoria." actions={<BudgetActions key={overview.month} month={overview.month} categories={available} />} />
    <BudgetHero overview={overview} />
    {limited.length ? (
      <BudgetSection title="Categorias com limite" description="Planejado e comprometido na competência selecionada" rows={limited} month={overview.month} icon={<Gauge />} tone="brand" />
    ) : (
      <SectionCard title="Categorias com limite" description="Planejado e comprometido na competência selecionada" icon={<Gauge />}>
        <FinanceEmptyState title="Nenhum limite definido" description="Use Novo limite ou copie o mês anterior para começar a planejar esta competência." />
      </SectionCard>
    )}
    {unbounded.length > 0 && <BudgetSection title="Despesas sem limite" description="Gastos do mês em categorias que ainda não têm orçamento" rows={unbounded} month={overview.month} icon={<Layers />} tone="violet" />}
    {uncategorized.length > 0 && <BudgetSection title="Despesas sem categoria" description="Valores incluídos no total comprometido, sem um limite associado" rows={uncategorized} month={overview.month} icon={<CircleDashed />} tone="warning" />}
    <details className="group rounded-[20px] border border-border bg-card px-5 py-4 text-sm text-content">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-content-strong [&::-webkit-details-marker]:hidden">
        <Info aria-hidden="true" className="size-4 text-brand" />Como o consumo é calculado
        <span className="ml-auto text-xs font-normal text-content-muted group-open:hidden">Mostrar</span>
        <span className="ml-auto hidden text-xs font-normal text-content-muted group-open:inline">Ocultar</span>
      </summary>
      <div className="mt-4 grid gap-4 leading-6 md:grid-cols-3">
        <div><p className="font-semibold text-content-strong">Realizado</p><p>Despesas efetivadas e parcelas ou ajustes da fatura do mês, independentemente do pagamento.</p></div>
        <div><p className="font-semibold text-content-strong">Comprometido</p><p>Realizado + pendente. Créditos e estornos reduzem o consumo. O saldo considera apenas as categorias com limite.</p></div>
        <p className="text-xs leading-5 text-content-subtle">Cancelados, transferências, aportes, resgates e pagamentos de fatura ficam fora. Despesas sem limite ou categoria aparecem separadamente.</p>
      </div>
    </details>
  </div>;
}
