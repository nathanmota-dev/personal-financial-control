import type { AppDb } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import type { ProjectionEvent } from "@/lib/interfaces/projected-balance";
import type { ProjectedBalanceAccountRow } from "@/lib/interfaces/projected-balance-server";
import type {
  PredictabilityBudgetItem,
  PredictabilityCycle,
  PredictabilityExpense,
  PredictabilityRequest,
  PredictabilityResult,
} from "@/lib/interfaces/predictability";
import { calculatePredictability, resolveCycle } from "@/lib/predictability";
import { buildDateInMonth } from "@/lib/utils/finance-month";
import { and, gte, inArray, lte } from "drizzle-orm";
import { resolveProjectionAccounts } from "./projected-balance/accounts";
import { listCreditCardEvents } from "./projected-balance/commitments";
import { resolveDb } from "./projected-balance/filters";
import { listRecurringEvents } from "./projected-balance/recurring";

/** The biggest active recurring income (the salary) sets the cycle's pay day. */
export async function findCycleAnchorDay(db: AppDb, selectedAccounts: ProjectedBalanceAccountRow[]) {
  const accountIds = new Set(selectedAccounts.map((account) => account.id));
  const templates = await db.query.recurringTemplates.findMany();
  const [salary] = templates
    .filter((template) => template.type === "income" && template.status === "active" && accountIds.has(template.accountId))
    .sort((left, right) => right.amountCents - left.amountCents || left.dayOfMonth - right.dayOfMonth);

  return salary?.dayOfMonth ?? null;
}

function eventAccountName(event: ProjectionEvent) {
  return typeof event.metadata?.accountName === "string" ? event.metadata.accountName : null;
}

function toBudgetItem(event: ProjectionEvent): PredictabilityBudgetItem {
  return {
    id: event.id,
    kind: event.source === "credit_card" ? "credit_card" : event.type === "income" ? "income" : "fixed",
    description: event.description,
    date: event.date,
    amountCents: event.amountCents,
    accountName: eventAccountName(event),
  };
}

/**
 * One-off debit, Pix and cash expenses; card purchases, bill payments and recurring items stay out.
 * Contributions stay out too: they move money into investments, like the one-off income they often come from.
 */
export async function listPredictabilityExpenses(
  db: AppDb,
  cycle: PredictabilityCycle,
  selectedAccounts: ProjectedBalanceAccountRow[]
): Promise<PredictabilityExpense[]> {
  const ids = selectedAccounts.map((account) => account.id);

  if (!ids.length) {
    return [];
  }

  const [rows, paymentRows, fundingRows] = await Promise.all([
    db.query.transactions.findMany({
      where: and(
        inArray(transactions.accountId, ids),
        gte(transactions.transactionDate, cycle.start),
        lte(transactions.transactionDate, cycle.end)
      ),
      with: { account: true, category: true },
    }),
    db.query.creditCardBillPayments.findMany({ columns: { transactionId: true } }),
    db.query.transactionFundingLinks.findMany({ columns: { expenseTransactionId: true } }),
  ]);
  const excludedIds = new Set([
    ...paymentRows.map((row) => row.transactionId),
    ...fundingRows.map((row) => row.expenseTransactionId),
  ]);

  return rows
    .filter(
      (row) =>
        row.status !== "cancelled" &&
        row.type === "expense" &&
        !row.recurringTemplateId &&
        !excludedIds.has(row.id)
    )
    .sort(
      (left, right) =>
        left.transactionDate.localeCompare(right.transactionDate) ||
        left.createdAt.getTime() - right.createdAt.getTime() ||
        left.id.localeCompare(right.id)
    )
    .map((row) => ({
      id: row.id,
      date: row.transactionDate,
      description: row.description,
      amountCents: row.amountCents,
      accountName: row.account?.name ?? null,
      categoryName: row.category?.name ?? null,
    }));
}

export async function getPredictability(
  request: PredictabilityRequest,
  database?: AppDb
): Promise<PredictabilityResult> {
  const db = await resolveDb(database);
  const { selectedAccounts, selectedCreditAccounts } = await resolveProjectionAccounts(db, [], []);
  const anchorDay = await findCycleAnchorDay(db, selectedAccounts);
  const reference = request.month ? buildDateInMonth(request.month, anchorDay ?? 1) : request.today;
  const cycle = resolveCycle(anchorDay, reference);
  const [recurringEvents, creditCardEvents, expenses] = await Promise.all([
    listRecurringEvents(db, cycle.start, cycle.end, selectedAccounts, true, { includeMaterialized: true }),
    listCreditCardEvents(db, cycle.start, cycle.end, selectedCreditAccounts),
    listPredictabilityExpenses(db, cycle, selectedAccounts),
  ]);
  const budgetItems = [...recurringEvents, ...creditCardEvents]
    .map(toBudgetItem)
    .sort((left, right) => left.date.localeCompare(right.date) || left.description.localeCompare(right.description));

  return calculatePredictability({ today: request.today, cycle, budgetItems, expenses });
}
