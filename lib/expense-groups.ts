import type { CategoryGroup } from "@/lib/db/schema";
import type { ReportRecords } from "@/lib/interfaces/reports";
import type { ExpenseGroupCategory, ExpenseGroupKey, ExpenseGroupItem, ExpenseGroupsReport } from "@/lib/interfaces/expense-groups";
import { isPendingCategory } from "@/lib/pending-category";

export function classifyExpenseGroup(group: CategoryGroup | undefined): ExpenseGroupKey {
  if (group === "fixed_expense") return "fixed";
  if (group === "variable_expense") return "variable";
  return "unclassified";
}

export function buildExpenseGroupsReport(records: ReportRecords, months: string[]): ExpenseGroupsReport {
  const series = [...new Set(months)].sort().map((month) => ({ month, fixedCents: 0, variableCents: 0, unclassifiedCents: 0 }));
  const byMonth = new Map(series.map((item) => [item.month, item]));
  const transactions = new Map(records.activeTransactions.map((row) => [row.id, row]));
  const installments = new Set(records.installments.map((row) => row.id));
  const groups: ExpenseGroupsReport["groups"] = { fixed: [], variable: [], unclassified: [] };
  const amounts = { fixedCents: 0, variableCents: 0, unclassifiedCents: 0 };
  let recurringInVariableCount = 0;
  for (const expense of records.expenses) {
    const month = byMonth.get(expense.competenceMonth);
    if (!month) continue;
    const group = isPendingCategory(expense.category) ? "unclassified" : classifyExpenseGroup(expense.category?.group);
    const isInstallment = installments.has(expense.id);
    const isRecurring = !isInstallment && Boolean(transactions.get(expense.id)?.recurringTemplateId);
    groups[group].push({
      id: expense.id, description: expense.description, amountCents: expense.amountCents,
      expenseDate: expense.expenseDate, competenceMonth: expense.competenceMonth,
      categoryId: expense.category?.id ?? null, categoryName: expense.category?.name ?? "Sem categoria",
      accountName: expense.account?.name ?? "Conta ausente", source: isInstallment ? "installment" : "transaction", isRecurring,
    });
    const key = `${group}Cents` as keyof typeof amounts;
    amounts[key] += expense.amountCents;
    month[key] += expense.amountCents;
    if (group === "variable" && isRecurring) recurringInVariableCount++;
  }
  for (const items of Object.values(groups)) items.sort((a, b) => b.amountCents - a.amountCents || a.expenseDate.localeCompare(b.expenseDate) || a.id.localeCompare(b.id));
  const totalCents = amounts.fixedCents + amounts.variableCents + amounts.unclassifiedCents;
  const share = (amount: number) => totalCents > 0 ? amount / totalCents : null;
  return { groups, series, recurringInVariableCount, totals: { ...amounts, totalCents,
    fixedShare: share(amounts.fixedCents), variableShare: share(amounts.variableCents), unclassifiedShare: share(amounts.unclassifiedCents),
  } };
}

export function summarizeExpenseGroupCategories(items: ExpenseGroupItem[], totalCents: number): ExpenseGroupCategory[] {
  const categories = new Map<string | null, ExpenseGroupCategory>();
  for (const item of items) {
    const category = categories.get(item.categoryId) ?? { id: item.categoryId, name: item.categoryName, count: 0, amountCents: 0, share: null };
    category.count++;
    category.amountCents += item.amountCents;
    categories.set(item.categoryId, category);
  }
  return [...categories.values()].map((category) => ({ ...category, share: totalCents > 0 ? category.amountCents / totalCents : null }))
    .sort((a, b) => b.amountCents - a.amountCents || (a.id ?? "").localeCompare(b.id ?? ""));
}
