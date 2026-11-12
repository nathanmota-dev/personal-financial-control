import type { BudgetSectionProps } from "@/lib/interfaces/budgets";
import { BudgetCard } from "./budget-card";
import { BudgetCategoryRow } from "./budget-row";

export function BudgetSection({ title, description, rows, month, illustrationSrc }: BudgetSectionProps) {
  return (
    <BudgetCard title={title} description={description} count={rows.length} illustrationSrc={illustrationSrc}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => <BudgetCategoryRow key={`${month}-${row.categoryId}-${row.limit?.amountCents ?? "none"}`} row={row} month={month} />)}
      </div>
    </BudgetCard>
  );
}
