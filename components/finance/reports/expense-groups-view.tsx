import { FinanceEmptyState } from "@/components/finance/empty-state";
import { ExpenseGroupsCards } from "@/components/finance/reports/expense-groups-cards";
import { ExpenseGroupsChart } from "@/components/finance/reports/expense-groups-chart";
import { ExpenseGroupTable } from "@/components/finance/reports/expense-group-table";
import { ExpenseGroupsWarning } from "@/components/finance/reports/expense-groups-warning";
import { expenseGroupDefinitions } from "@/lib/expense-groups-presentation";
import type { ExpenseGroupsViewProps } from "@/lib/interfaces/expense-groups";

export function ExpenseGroupsView({ report, mode }: ExpenseGroupsViewProps) {
  const hasExpenses = Object.values(report.groups).some((items) => items.length > 0);
  return <div className="min-w-0 space-y-4">
    <ExpenseGroupsCards totals={report.totals} />
    {hasExpenses ? <>
      <ExpenseGroupsChart totals={report.totals} series={report.series} mode={mode} />
      <ExpenseGroupsWarning count={report.recurringInVariableCount} />
      {expenseGroupDefinitions.filter((group) => group.key !== "unclassified" || report.groups.unclassified.length > 0).map((group) =>
        <ExpenseGroupTable key={group.key} title={group.label} items={report.groups[group.key]} totalCents={report.totals[group.amountKey]} groupByCategory={mode === "annual"} />)}
    </> : <FinanceEmptyState title="Sem despesas no período" description="Escolha outra competência ou registre despesas para acompanhar a divisão entre fixos e variáveis." />}
  </div>;
}
