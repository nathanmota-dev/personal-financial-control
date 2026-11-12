import type { AppDb } from "@/lib/db";
import {
creditCardBills,
creditCardCharges
} from "@/lib/db/schema";
import { listAccounts } from "@/lib/server/accounts";
import {
normalizeCompetenceMonth
} from "@/lib/server/finance";
import { buildCreditCardTimeline } from "@/lib/server/stages/build-credit-card-timeline";
import { calculateCreditCardInvoiceSummary } from "@/lib/server/stages/calculate-credit-card-invoice-summary";
import { loadCreditCardBillContext } from "@/lib/server/stages/load-credit-card-bill-context";
import { listTransactions } from "@/lib/server/transactions";
import { eq } from "drizzle-orm";
import { listCreditCardExpenseEntries } from "./expenses";
import { resolveDb } from "./validation";

type CreditAccounts = Awaited<ReturnType<typeof listAccounts>>;
type PickedCreditAccount =
  | { early: { state: "no_account"; month: string } | { state: "multiple_accounts"; month: string; accounts: CreditAccounts } }
  | { account: CreditAccounts[number] };

/** With several cards, the detailed view needs the one the caller picked. */
function pickCreditAccount(accounts: CreditAccounts, month: string, accountId?: string): PickedCreditAccount {
  if (!accounts.length) return { early: { state: "no_account", month } };
  const selected = accounts.find((account) => account.id === accountId);
  if (accounts.length > 1 && !selected) return { early: { state: "multiple_accounts", month, accounts } };
  return { account: selected ?? accounts[0] };
}

export async function getCreditCardOverview(invoiceMonth: string, database?: AppDb, options: { accountId?: string } = {}) {
  const db = await resolveDb(database);
  const normalizedMonth = normalizeCompetenceMonth(invoiceMonth);
  const creditAccounts = (await listAccounts(undefined, db)).filter(
    (account) => account.type === "credit"
  );

  const picked = pickCreditAccount(creditAccounts, normalizedMonth, options.accountId);
  if ("early" in picked) return picked.early;
  const { account } = picked;
  const [invoiceEntries, monthTransactions, futureChargeRows, cardTransactions, billRows] = await Promise.all([
    listCreditCardExpenseEntries(normalizedMonth, db, { accountId: account.id }),
    listTransactions({ competenceMonth: normalizedMonth }, db),
    db.query.creditCardCharges.findMany({
      where: eq(creditCardCharges.accountId, account.id),
      with: {
        category: true,
        installments: true,
      },
      orderBy: (table, { desc: orderDesc }) => [
        orderDesc(table.purchaseDate),
        orderDesc(table.createdAt),
      ],
    }),
    listTransactions({ accountId: account.id }, db),
    db.query.creditCardBills.findMany({
      where: eq(creditCardBills.accountId, account.id),
    }),
  ]);

  const { paymentTransactionIds, bill } = await loadCreditCardBillContext({ db, account, normalizedMonth });

  const timelineByMonth = new Map<
    string,
    {
      month: string;
      totalAmountCents: number;
      purchaseCount: number;
      billStatus: "open" | "paid" | null;
    }
  >();

  const { timeline } = buildCreditCardTimeline({ timelineByMonth, futureChargeRows, cardTransactions, billRows });

  const { incomeCents, nonCardExpenseCents, investmentContributionCents, investmentWithdrawalCents, availableForInvoiceCents, invoiceTotalCents, calculatedInvoiceTotalCents, categoryTotals, futureInstallments } = calculateCreditCardInvoiceSummary({ invoiceEntries, monthTransactions, paymentTransactionIds, bill, futureChargeRows, normalizedMonth });

  return {
    state: "ready" as const,
    month: normalizedMonth,
    account,
    needsConfiguration: !account.creditClosingDay,
    timeline,
    budgetSummary: {
      incomeCents,
      nonCardExpenseCents,
      investmentContributionCents,
      investmentWithdrawalCents,
      availableForInvoiceCents,
      invoiceTotalCents,
      remainingAfterInvoiceCents: availableForInvoiceCents - invoiceTotalCents,
    },
    invoice: {
      totalAmountCents: invoiceTotalCents,
      calculatedTotalAmountCents: calculatedInvoiceTotalCents,
      ignoredAmountCents: bill?.ignoredAmountCents ?? 0,
      bill: bill
        ? {
            id: bill.id,
            status: bill.status,
            dueDate: bill.dueDate,
            statementTotalCents: bill.statementTotalCents,
            currentChargesTotalCents: bill.currentChargesTotalCents,
            priorBalanceCents: bill.priorBalanceCents,
            preStatementPaymentsCents: bill.preStatementPaymentsCents,
            ignoredAmountCents: bill.ignoredAmountCents,
            paidAt: bill.paidAt,
          }
        : null,
      purchaseCount: invoiceEntries.length,
      entries: invoiceEntries,
      categoryTotals: Array.from(categoryTotals.values()).sort(
        (left, right) => right.amountCents - left.amountCents
      ),
      futureInstallments,
    },
  };
}
