import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/finance-ui";
import type { BudgetsViewProps } from "@/lib/interfaces/budgets";
import { BudgetCopy } from "./budget-copy";
import { BudgetForm } from "./budget-form";
import { BudgetCategoryRow } from "./budget-row";

export function BudgetsView({ overview }: BudgetsViewProps) {
  const sections = [
    { title: "Categorias com limite", rows: overview.rows.filter((row) => row.limit) },
    { title: "Despesas sem limite", rows: overview.rows.filter((row) => !row.limit && row.categoryId) },
    { title: "Despesas sem categoria", rows: overview.rows.filter((row) => !row.categoryId) },
  ];
  const available = overview.categories.filter((category) => !overview.rows.some((row) => row.limit && row.categoryId === category.id));
  return <div className="space-y-6">
    <PageHeader title="Orçamentos" description="Planeje o mês e acompanhe quanto já está comprometido em cada categoria." actions={<form action="/budgets" className="flex flex-wrap items-end gap-2"><label className="grid gap-1 text-sm">Competência<input aria-label="Competência" name="month" type="month" required defaultValue={overview.month} className="h-10 rounded-lg border border-input bg-card px-3" /></label><Button type="submit" variant="outline">Consultar mês</Button></form>} />
    <div className="space-y-2 rounded-xl border border-border bg-card p-5 text-sm text-content">
      <p>Realizado = despesas efetivadas + parcelas e ajustes da fatura desta competência, independentemente do pagamento.</p>
      <p>Comprometido = realizado + pendente. Cancelados, transferências, aportes, resgates e pagamentos de fatura ficam fora. Créditos reduzem o consumo.</p>
      <p className="pt-2 text-lg font-semibold text-content-strong">Total comprometido: {formatCurrency(overview.committedCents)}</p>
    </div>
    <section aria-label="Definir limites" className="flex flex-wrap justify-between gap-6 rounded-xl border border-border bg-card p-5">
      <div className="space-y-3"><h2 className="font-semibold">Novo limite para o mês</h2><BudgetForm key={overview.month} month={overview.month} categories={available} />{!available.length && <p className="text-sm text-content">Todas as categorias disponíveis já têm limite. Cadastre categorias de despesa em Configurações se necessário.</p>}</div>
      <BudgetCopy key={overview.month} month={overview.month} />
    </section>
    {overview.rows.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-content">Nenhum limite ou despesa nesta competência. Crie um limite ou copie o mês anterior para começar.</p>}
    {sections.map((section) => section.rows.length > 0 && <section key={section.title} className="rounded-xl border border-border bg-card px-5"><h2 className="border-b border-border py-4 text-lg font-semibold">{section.title}</h2>{section.rows.map((row) => <BudgetCategoryRow key={`${overview.month}-${row.categoryId}-${row.limit?.amountCents ?? "none"}`} row={row} month={overview.month} />)}</section>)}
  </div>;
}
