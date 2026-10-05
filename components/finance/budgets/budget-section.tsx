import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { financePanelClassName } from "@/components/finance/finance-styles";
import type { BudgetSectionProps } from "@/lib/interfaces/budgets";
import { BudgetCategoryRow } from "./budget-row";

export function BudgetSection({ title, description, rows, month, columns = 1 }: BudgetSectionProps) {
  return <Card className={`${financePanelClassName} min-w-0 rounded-[20px] gap-3`}>
    <CardHeader><CardTitle><h2>{title}</h2></CardTitle><CardDescription className="text-xs">{description}</CardDescription></CardHeader>
    <CardContent className={columns === 2 ? "grid gap-x-8 md:grid-cols-2 [&>article]:border-b [&>article]:border-border" : "divide-y divide-border"}>{rows.map((row) => <BudgetCategoryRow key={`${month}-${row.categoryId}-${row.limit?.amountCents ?? "none"}`} row={row} month={month} />)}</CardContent>
  </Card>;
}
