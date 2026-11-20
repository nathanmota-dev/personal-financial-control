import type { AppDb } from "@/lib/db";
import { listAccounts } from "@/lib/server/accounts";
import { DomainError } from "@/lib/server/errors";
import { getCreditCardOverview } from "./overview";

type Overview = Extract<Awaited<ReturnType<typeof getCreditCardOverview>>, { state: "ready" }>;

/** The invoice without its entries, which list_credit_card_charges already returns. */
function digest({ account, month, needsConfiguration, invoice }: Overview) {
  const { bill } = invoice;
  return {
    accountId: account.id,
    accountName: account.name,
    invoiceMonth: month,
    needsConfiguration,
    totalAmountCents: invoice.totalAmountCents,
    calculatedTotalAmountCents: invoice.calculatedTotalAmountCents,
    purchaseCount: invoice.purchaseCount,
    dueDay: account.creditDueDay,
    bill: bill ? { status: bill.status, dueDate: bill.dueDate, statementTotalCents: bill.statementTotalCents, paidAt: bill.paidAt } : null,
    categoryTotals: invoice.categoryTotals,
  };
}

/** One digest per active card, or only the requested one. */
export async function getCreditCardInvoiceDigests(invoiceMonth: string, accountId: string | undefined, database: AppDb) {
  const cards = (await listAccounts(undefined, database)).filter((account) => account.type === "credit");
  const selected = accountId ? cards.filter((account) => account.id === accountId) : cards;
  if (accountId && !selected.length) throw new DomainError("ACCOUNT_TYPE_MISMATCH", "An active credit account is required.");
  const overviews = await Promise.all(selected.map((account) => getCreditCardOverview(invoiceMonth, database, { accountId: account.id })));
  return overviews.filter((overview): overview is Overview => overview.state === "ready").map(digest);
}
