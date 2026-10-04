import type { DashboardExpense, DashboardMonth, DashboardTransaction } from "@/lib/interfaces/dashboard";
import type { CategorySpendingItem } from "@/lib/interfaces/recurring";

export function aggregateDashboardMonth(competenceMonth: string, transactions: DashboardTransaction[], expenses: DashboardExpense[]): DashboardMonth {
  const rows = transactions.filter((row) => row.competenceMonth === competenceMonth);
  const entries = expenses.filter((row) => row.competenceMonth === competenceMonth);
  const sumType = (type: DashboardTransaction["type"]) => rows.filter((row) => row.type === type).reduce((sum, row) => sum + row.amountCents, 0);
  const incomeCents = sumType("income");
  const investmentContributionCents = sumType("investment_contribution");
  const investmentWithdrawalCents = sumType("investment_withdrawal");
  const fixedExpenseCents = entries.filter((row) => row.category?.group === "fixed_expense").reduce((sum, row) => sum + row.amountCents, 0);
  const variableExpenseCents = entries.filter((row) => row.category?.group === "variable_expense").reduce((sum, row) => sum + row.amountCents, 0);
  const uncategorizedExpenseCents = entries.filter((row) => !row.category || !["fixed_expense", "variable_expense"].includes(row.category.group)).reduce((sum, row) => sum + row.amountCents, 0);
  const netInvestmentFlowCents = investmentContributionCents - investmentWithdrawalCents;
  return { competenceMonth, hasMovements: rows.length > 0 || entries.length > 0, totals: {
    incomeCents, fixedExpenseCents, variableExpenseCents, uncategorizedExpenseCents,
    investmentContributionCents, investmentWithdrawalCents, netInvestmentFlowCents,
    netResultCents: incomeCents - fixedExpenseCents - variableExpenseCents - uncategorizedExpenseCents - netInvestmentFlowCents,
  } };
}

export function aggregateDashboardCategories(expenses: DashboardExpense[], includeUncategorized = true): CategorySpendingItem[] {
  const report = new Map<string, CategorySpendingItem>();
  for (const row of expenses) {
    if (!row.category && !includeUncategorized) continue;
    const categoryId = row.category?.id ?? "uncategorized";
    const item = report.get(categoryId) ?? { categoryId, categoryName: row.category?.name ?? "Sem categoria", amountCents: 0 };
    item.amountCents += row.amountCents;
    report.set(categoryId, item);
  }
  return [...report.values()].sort((left, right) => right.amountCents - left.amountCents || left.categoryId.localeCompare(right.categoryId));
}

export function sortDashboardExpenses(left: DashboardExpense, right: DashboardExpense) {
  return right.expenseDate.localeCompare(left.expenseDate) || right.amountCents - left.amountCents || left.description.localeCompare(right.description) || left.id.localeCompare(right.id);
}

export function selectDashboardTopExpenses(expenses: DashboardExpense[]) {
  return expenses.filter((row) => row.amountCents > 0).sort((left, right) => right.amountCents - left.amountCents || sortDashboardExpenses(left, right)).slice(0, 5);
}
