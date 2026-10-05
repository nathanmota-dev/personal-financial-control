import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
import { financePanelClassName } from "@/components/finance/finance-styles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BudgetsViewProps } from "@/lib/interfaces/budgets";
import { BudgetActions } from "./budget-actions";
import { BudgetMetrics } from "./budget-metrics";
import { BudgetSection } from "./budget-section";

export function BudgetsView({ overview }: BudgetsViewProps) {
  const limited = overview.rows.filter((row) => row.limit);
  const unbounded = overview.rows.filter((row) => !row.limit && row.categoryId);
  const uncategorized = overview.rows.filter((row) => !row.categoryId);
  const available = overview.categories.filter((category) => !limited.some((row) => row.categoryId === category.id));
  return <div className="space-y-6 min-[100.0625rem]:space-y-5">
    <PageHeader title="Orçamentos" description="Planeje o mês e acompanhe o consumo dos limites por categoria." actions={<BudgetActions key={overview.month} month={overview.month} categories={available} />} />
    <BudgetMetrics overview={overview} />
    <div className="grid items-stretch gap-6 xl:grid-cols-2">
        {limited.length ? <BudgetSection title="Categorias com limite" description="Planejado e comprometido na competência selecionada" rows={limited} month={overview.month} /> : <Card className={`${financePanelClassName} rounded-[20px]`}><CardHeader><CardTitle><h2>Categorias com limite</h2></CardTitle><CardDescription className="text-xs">Planejado e comprometido na competência selecionada</CardDescription></CardHeader><CardContent><FinanceEmptyState title="Nenhum limite definido" description="Use Novo limite ou copie o mês anterior para começar a planejar esta competência." /></CardContent></Card>}
      <Card className={`${financePanelClassName} rounded-[20px]`}>
        <CardHeader><CardTitle><h2>Como o consumo é calculado</h2></CardTitle><CardDescription className="text-xs">Despesas por competência, como no Dashboard</CardDescription></CardHeader>
        <CardContent className="space-y-5 text-sm leading-6 text-content">
          <div><p className="font-semibold text-content-strong">Realizado</p><p>Despesas efetivadas e parcelas ou ajustes da fatura do mês, independentemente do pagamento.</p></div>
          <div><p className="font-semibold text-content-strong">Comprometido</p><p>Realizado + pendente. Créditos e estornos reduzem o consumo. O saldo considera apenas as categorias com limite.</p></div>
          <p className="border-t border-border pt-4 text-xs leading-5 text-content-subtle">Cancelados, transferências, aportes, resgates e pagamentos de fatura ficam fora. Despesas sem limite ou categoria aparecem separadamente.</p>
        </CardContent>
      </Card>
    </div>
        {unbounded.length > 0 && <BudgetSection title="Despesas sem limite" description="Gastos do mês em categorias que ainda não têm orçamento" rows={unbounded} month={overview.month} columns={2} />}
        {uncategorized.length > 0 && <BudgetSection title="Despesas sem categoria" description="Valores incluídos no total comprometido, sem um limite associado" rows={uncategorized} month={overview.month} columns={2} />}
  </div>;
}
