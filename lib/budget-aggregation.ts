import type { BudgetCategory, BudgetExpense, BudgetLimit, BudgetRow } from "@/lib/interfaces/budgets";

export function aggregateBudgets(categories: BudgetCategory[], limits: BudgetLimit[], expenses: BudgetExpense[]): BudgetRow[] {
  const rows = new Map<string | null, BudgetRow>();
  function ensure(categoryId: string | null, name: string): BudgetRow {
    let row = rows.get(categoryId);
    if (!row) {
      const category = categories.find((item) => item.id === categoryId);
      row = { categoryId, categoryName: category?.name ?? name, archived: category?.isArchived ?? false,
        limit: null, postedCents: 0, pendingCents: 0, committedCents: 0,
        remainingCents: null, percent: null, state: null, expenses: [] };
      rows.set(categoryId, row);
    }
    return row;
  }
  for (const limit of limits) ensure(limit.categoryId, "Categoria").limit = limit;
  for (const expense of expenses) {
    const row = ensure(expense.categoryId, expense.categoryName);
    row.expenses.push(expense);
    if (expense.pending) row.pendingCents += expense.amountCents;
    else row.postedCents += expense.amountCents;
  }
  for (const row of rows.values()) {
    row.committedCents = row.postedCents + row.pendingCents;
    if (row.limit) {
      row.remainingCents = row.limit.amountCents - row.committedCents;
      row.percent = row.committedCents / row.limit.amountCents * 100;
      row.state = row.percent >= 100 ? "reached" : row.percent >= 80 ? "warning" : "below";
    }
  }
  return [...rows.values()].sort((a, b) => a.categoryName.localeCompare(b.categoryName, "pt-BR"));
}
