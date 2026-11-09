import type { PluggyLinkRecord, PluggySyncStepContext } from "@/lib/interfaces/pluggy";
import type { PluggyMappedCardBill } from "@/lib/interfaces/pluggy-card-bills";
import { isCardBillPaymentText } from "../classify-bank-transaction";
import { localDay, toAmountCents } from "../mappers/bank-transaction";

const BILLING_CYCLE_MS = 31 * 86_400_000;

async function bankPaymentsBeforeCutoff({ client, db }: PluggySyncStepContext, link: PluggyLinkRecord, closingDate: string) {
  const links = await db.query.pluggyAccountLinks.findMany();
  const from = new Date(Date.parse(closingDate) - BILLING_CYCLE_MS).toISOString().slice(0, 10);
  const banks = links.filter((other) => other.isEnabled && other.kind === "bank" && other.itemId === link.itemId);
  const rows = (await Promise.all(banks.map((bank) => client.listTransactions(bank.externalAccountId, { from, to: link.cutoffDate })))).flat();
  return rows
    .filter((row) => row.amount < 0 && isCardBillPaymentText(row.description ?? "") && (localDay(row.date) ?? link.cutoffDate) < link.cutoffDate)
    .reduce((total, row) => total + toAmountCents(row.amount), 0);
}

/**
 * The oldest bill has no earlier bill listing what was prepaid, and those payments sit before the bank import window.
 * They only count when they explain the whole gap, because an unrelated payment could otherwise hide a real difference.
 */
export async function creditPaymentsBeforeWindow(context: PluggySyncStepContext, link: PluggyLinkRecord, bills: PluggyMappedCardBill[], totals: ReadonlyMap<string, number>) {
  const [first] = bills;
  if (!first?.closingDate || first.invoiceMonth < link.cutoffDate.slice(0, 7)) return;
  const unexplainedCents = (totals.get(first.invoiceMonth) ?? 0) - first.statementTotalCents - first.preStatementPaymentsCents;
  if (unexplainedCents <= 0) return;
  if (await bankPaymentsBeforeCutoff(context, link, first.closingDate) === unexplainedCents) first.preStatementPaymentsCents += unexplainedCents;
}
