import { z } from "zod";

import { getFinanceDatabase, type AppDb } from "@/lib/db";
import { isValidMonth } from "@/lib/finance-ui";
import type { SpendingCategoryTotal, SpendingEntry, SpendingSummary, SpendingTotals } from "@/lib/interfaces/spending-summary";
import { isPendingCategory } from "@/lib/pending-category";
import { shiftReportPeriod } from "@/lib/report-periods";
import { readDashboardRecords } from "@/lib/server/dashboard-records";
import { invariant } from "@/lib/server/errors";
import { matchesTextSearch } from "@/lib/text-search";

export const SPENDING_MAX_MONTHS = 60;
export const SPENDING_MAX_ENTRIES = 200;

const month = z.string().refine(isValidMonth, "Use YYYY-MM.");

export const spendingSummaryInputSchema = z.object({
  fromMonth: month,
  toMonth: month.optional(),
  type: z.enum(["income", "expense", "investment_contribution", "investment_withdrawal"]).optional(),
  categoryIds: z.array(z.string().uuid()).min(1).max(50).optional(),
  uncategorized: z.boolean().optional(),
  accountId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(200).optional(),
  includeEntries: z.boolean().optional(),
});

export type SpendingSummaryInput = z.infer<typeof spendingSummaryInputSchema>;

type Records = Awaited<ReturnType<typeof readDashboardRecords>>;
type CategoryRow = { id: string; name: string; group: string } | null | undefined;
type AccountRow = { id: string; name: string } | null | undefined;

function monthRange(fromMonth: string, toMonth: string) {
  invariant(fromMonth <= toMonth, "INVALID_PERIOD", "fromMonth must not be after toMonth.");
  const months = [fromMonth];
  while (months.at(-1)! < toMonth) months.push(shiftReportPeriod("monthly", months.at(-1)!, 1));
  invariant(months.length <= SPENDING_MAX_MONTHS, "INVALID_PERIOD", `The period cannot exceed ${SPENDING_MAX_MONTHS} months.`);
  return months;
}

/** Same rule as the dashboard: an expense outside the fixed and variable groups, or in the placeholder, is uncategorized. */
function isUncategorized(type: string, category: CategoryRow) {
  if (!category || isPendingCategory(category)) return true;
  return type === "expense" && category.group !== "fixed_expense" && category.group !== "variable_expense";
}

function describe(category: CategoryRow, account: AccountRow, type: string) {
  return {
    accountId: account?.id ?? null, accountName: account?.name ?? null,
    categoryId: category?.id ?? null, categoryName: category?.name ?? "Sem categoria",
    categoryGroup: category?.group ?? null, isUncategorized: isUncategorized(type, category),
  };
}

function spendingEntries(records: Records): SpendingEntry[] {
  const fromTransactions = records.activeTransactions.map((row): SpendingEntry => ({
    id: row.id, source: "transaction", month: row.competenceMonth, date: row.transactionDate,
    description: row.description, amountCents: row.amountCents, type: row.type, status: row.status,
    ...describe(row.category, row.account, row.type),
  }));
  const fromInstallments = records.installments.map((row): SpendingEntry => ({
    id: row.id, source: "card_installment", month: row.invoiceMonth, date: row.charge.purchaseDate,
    description: row.charge.description, amountCents: row.amountCents, type: "expense", status: "installment",
    ...describe(row.charge.category, row.charge.account, "expense"),
  }));
  return [...fromTransactions, ...fromInstallments];
}

function matches(entry: SpendingEntry, input: SpendingSummaryInput) {
  if (input.type && entry.type !== input.type) return false;
  if (input.accountId && entry.accountId !== input.accountId) return false;
  if (input.uncategorized && !entry.isUncategorized) return false;
  if (input.categoryIds && !input.categoryIds.includes(entry.categoryId ?? "")) return false;
  return matchesTextSearch(entry.description, input.search);
}

function addToTotals(totals: SpendingTotals, entry: SpendingEntry) {
  totals.entryCount += 1;
  if (entry.type === "income") totals.incomeCents += entry.amountCents;
  if (entry.type === "investment_contribution") totals.investmentContributionCents += entry.amountCents;
  if (entry.type === "investment_withdrawal") totals.investmentWithdrawalCents += entry.amountCents;
  if (entry.type !== "expense") return;
  totals.expenseCents += entry.amountCents;
  if (entry.isUncategorized) totals.uncategorizedExpenseCents += entry.amountCents;
  else if (entry.categoryGroup === "fixed_expense") totals.fixedExpenseCents += entry.amountCents;
  else totals.variableExpenseCents += entry.amountCents;
}

function summarize(entries: SpendingEntry[], months: string[]) {
  const totals: SpendingTotals = { incomeCents: 0, expenseCents: 0, fixedExpenseCents: 0, variableExpenseCents: 0, uncategorizedExpenseCents: 0, investmentContributionCents: 0, investmentWithdrawalCents: 0, entryCount: 0 };
  const categories = new Map<string, SpendingCategoryTotal>();
  const byMonth = new Map(months.map((key) => [key, { month: key, incomeCents: 0, expenseCents: 0 }]));
  for (const entry of entries) {
    addToTotals(totals, entry);
    const key = `${entry.type}:${entry.categoryId ?? "none"}`;
    const category = categories.get(key) ?? { categoryId: entry.categoryId, categoryName: entry.categoryName, categoryGroup: entry.categoryGroup, type: entry.type, amountCents: 0, entryCount: 0 };
    category.amountCents += entry.amountCents;
    category.entryCount += 1;
    categories.set(key, category);
    const monthRow = byMonth.get(entry.month)!;
    if (entry.type === "income") monthRow.incomeCents += entry.amountCents;
    if (entry.type === "expense") monthRow.expenseCents += entry.amountCents;
  }
  const byCategory = [...categories.values()].sort((left, right) => left.type.localeCompare(right.type) || right.amountCents - left.amountCents);
  return { totals, byCategory, byMonth: [...byMonth.values()] };
}

/**
 * Income, expenses and investment flows per category and month, counted like the reports page:
 * cancelled entries and card bill payments are left out, and card purchases count in their invoice month.
 */
export async function getSpendingSummary(input: SpendingSummaryInput, database?: AppDb): Promise<SpendingSummary> {
  const toMonth = input.toMonth ?? input.fromMonth;
  const months = monthRange(input.fromMonth, toMonth);
  const records = await readDashboardRecords(months, database ?? await getFinanceDatabase());
  const entries = spendingEntries(records).filter((entry) => matches(entry, input));
  const summary: SpendingSummary = { fromMonth: input.fromMonth, toMonth, ...summarize(entries, months) };
  if (!input.includeEntries) return summary;
  const largest = [...entries].sort((left, right) => right.amountCents - left.amountCents || right.date.localeCompare(left.date) || left.month.localeCompare(right.month) || left.id.localeCompare(right.id));
  return { ...summary, entries: largest.slice(0, SPENDING_MAX_ENTRIES), entriesTruncated: largest.length > SPENDING_MAX_ENTRIES };
}
