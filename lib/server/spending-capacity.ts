import { z } from "zod";

import { getFinanceDatabase, type AppDb } from "@/lib/db";
import { isValidMonth } from "@/lib/finance-ui";
import type { SpendingCapacity } from "@/lib/interfaces/spending-capacity";
import { getBudgetOverview } from "@/lib/server/budgets";
import { getCreditCardInvoiceDigests } from "@/lib/server/credit-card/invoice-digest";
import { getProjectedBalance } from "@/lib/server/projected-balance";
import { getFinanceToday } from "@/lib/server/runtime";

export const spendingCapacityInputSchema = z.object({
  competenceMonth: z.string().refine(isValidMonth, "Use YYYY-MM.").optional(),
  minimumReserveCents: z.number().int().min(0).optional(),
});

export type SpendingCapacityInput = z.infer<typeof spendingCapacityInputSchema>;

/**
 * Composes the projected balance, the budget and the card invoices of the month. It adds no rule of its own:
 * every number comes from the function the matching page uses, so the answer matches what the screens show.
 */
export async function getSpendingCapacity(input: SpendingCapacityInput = {}, database?: AppDb): Promise<SpendingCapacity> {
  const db = database ?? await getFinanceDatabase();
  const today = getFinanceToday();
  const month = input.competenceMonth ?? today.slice(0, 7);
  const [projection, budget, digests] = await Promise.all([
    getProjectedBalance({
      period: "next_income", startDate: today, accountIds: [], creditAccountIds: [],
      minimumReserveCents: input.minimumReserveCents ?? 0,
      includeCreditCard: true, includeInvestments: true, includeTransfers: true,
    }, db),
    getBudgetOverview(month, db),
    getCreditCardInvoiceDigests(month, undefined, db),
  ]);
  const { summary } = projection;
  const limited = budget.rows.filter((row) => row.limit);
  const items = digests.filter((digest) => digest.bill?.status !== "paid").map((digest) => ({
    accountName: digest.accountName, invoiceMonth: digest.invoiceMonth, totalAmountCents: digest.totalAmountCents,
    dueDate: digest.bill?.dueDate ?? null, status: digest.bill?.status ?? null,
  }));
  return {
    today, month,
    projection: {
      status: summary.status, endDate: summary.endDate, balanceNowCents: summary.initialBalanceCents,
      minimumProjectedBalanceCents: summary.minimumProjectedBalanceCents,
      minimumProjectedBalanceDate: summary.minimumProjectedBalanceDate,
      finalProjectedBalanceCents: summary.finalProjectedBalanceCents,
      availablePerDayCents: summary.availablePerDayCents, nextIncomeDate: summary.nextIncomeDate,
      firstNegativeDate: summary.firstNegativeDate, alerts: summary.alerts.map((alert) => alert.message),
    },
    budget: {
      limitTotalCents: limited.reduce((sum, row) => sum + (row.limit?.amountCents ?? 0), 0),
      committedCents: budget.committedCents,
      overBudget: limited.filter((row) => row.state === "reached" && row.remainingCents !== null && row.remainingCents <= 0)
        .map((row) => ({ categoryName: row.categoryName, limitCents: row.limit!.amountCents, committedCents: row.committedCents })),
    },
    invoices: { totalOpenCents: items.reduce((sum, item) => sum + item.totalAmountCents, 0), items },
  };
}
