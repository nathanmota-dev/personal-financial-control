import { SectionCard } from "@/components/finance/ds/section-card";
import type { BudgetSectionProps } from "@/lib/interfaces/budgets";
import { BudgetCategoryRow } from "./budget-row";

export function BudgetSection({ title, description, rows, month, icon, tone }: BudgetSectionProps) {
  return (
    <SectionCard title={title} description={description} count={rows.length} icon={icon} tone={tone} className="min-w-0">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {rows.map((row) => <BudgetCategoryRow key={`${month}-${row.categoryId}-${row.limit?.amountCents ?? "none"}`} row={row} month={month} />)}
      </div>
    </SectionCard>
  );
}
