import { eq } from "drizzle-orm";

import { creditCardBills, creditCardCharges } from "@/lib/db/schema";
import type { PluggyAttentionItem, PluggyLinkRecord, PluggySyncStepContext, PluggySyncStepResult } from "@/lib/interfaces/pluggy";
import type { CardBillRunState, PluggyCardBillTarget, PluggyMappedCardBill } from "@/lib/interfaces/pluggy-card-bills";
import { upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { bump } from "../bank-import/scope";
import { reconcileCardBill } from "../card-bill-reconciliation";
import { billEntryMatches } from "../match-bill-payment";
import { mapCardBills } from "../mappers/card-bill";
import { attentionItem, cardBillRunState } from "./run-state";

type StoredBill = Awaited<ReturnType<typeof loadStoredBills>> extends Map<string, infer T> ? T : never;
type BillScope = { context: PluggySyncStepContext; link: PluggyLinkRecord; counts: Record<string, number>; attention: PluggyAttentionItem[] };

async function loadStoredBills({ db }: PluggySyncStepContext, accountId: string) {
  const rows = await db.query.creditCardBills.findMany({ where: eq(creditCardBills.accountId, accountId), with: { payments: true } });
  return new Map(rows.map((row) => [row.invoiceMonth, row]));
}

/** Read after the purchase step, so it holds this run's purchases. Refunds are negative, so a month can sum below zero. */
async function importedTotals({ db }: PluggySyncStepContext, accountId: string) {
  const charges = await db.query.creditCardCharges.findMany({ where: eq(creditCardCharges.accountId, accountId), with: { installments: true } });
  const totals = new Map<string, number>();
  for (const installment of charges.flatMap((charge) => charge.installments)) totals.set(installment.invoiceMonth, (totals.get(installment.invoiceMonth) ?? 0) + installment.amountCents);
  return totals;
}

function billInput(accountId: string, bill: PluggyMappedCardBill, importedCents: number, ignoredAmountCents: number) {
  return {
    accountId,
    invoiceMonth: bill.invoiceMonth,
    dueDate: bill.dueDate,
    statementTotalCents: bill.statementTotalCents,
    currentChargesTotalCents: Math.max(0, importedCents),
    priorBalanceCents: bill.priorBalanceCents,
    preStatementPaymentsCents: bill.preStatementPaymentsCents,
    ignoredAmountCents,
  };
}

function billChanged(stored: StoredBill, input: ReturnType<typeof billInput>) {
  return stored.dueDate !== input.dueDate || stored.statementTotalCents !== input.statementTotalCents || stored.currentChargesTotalCents !== input.currentChargesTotalCents
    || stored.priorBalanceCents !== input.priorBalanceCents || stored.preStatementPaymentsCents !== input.preStatementPaymentsCents || stored.ignoredAmountCents !== input.ignoredAmountCents;
}

/** A paid bill is never rewritten. The bank's newer values are only reported. */
function reportPaidChange(scope: BillScope, stored: StoredBill, bill: PluggyMappedCardBill) {
  if (stored.statementTotalCents === bill.statementTotalCents && stored.dueDate === bill.dueDate) return;
  bump(scope, "cardBillsLocked");
  scope.attention.push(attentionItem("card_bill_paid_changed", scope.link, `Fatura ${bill.invoiceMonth}`, bill.dueDate, bill.statementTotalCents));
}

async function saveBill(scope: BillScope, stored: StoredBill | undefined, input: ReturnType<typeof billInput>) {
  if (stored && !billChanged(stored, input)) return stored.id;
  const holder: { id?: string } = {};
  await scope.context.write(async (db) => {
    holder.id = (await upsertCreditCardBill(input, db))?.id;
  });
  bump(scope, stored ? "cardBillsUpdated" : "cardBills");
  return holder.id ?? stored?.id ?? null;
}

/** Entries already paired with a local payment must not pair again on a later run. */
function claimRecordedEntries(state: CardBillRunState, target: PluggyCardBillTarget) {
  for (const payment of state.localPayments.filter((item) => item.billId && item.billId === target.billId)) {
    const entry = target.payments.find((item) => !item.claimed && billEntryMatches(item, { amountCents: payment.amountCents, date: payment.paymentDate }));
    if (entry) entry.claimed = true;
  }
}

async function importBill(scope: BillScope, bill: PluggyMappedCardBill, stored: StoredBill | undefined, importedCents: number): Promise<PluggyCardBillTarget> {
  const reconciliation = reconcileCardBill({ ...bill, currentChargesCents: importedCents });
  const paid = stored?.status === "paid";
  if (paid) reportPaidChange(scope, stored!, bill);
  const billId = paid ? stored!.id : await saveBill(scope, stored, billInput(scope.link.accountId, bill, importedCents, reconciliation.ignoredAmountCents));
  const settledCents = (stored?.payments ?? []).filter((payment) => payment.kind === "settlement").reduce((total, payment) => total + payment.amountCents, 0);
  return { ...bill, link: scope.link, billId, paid, settledCents, importedCents, differenceCents: reconciliation.differenceCents };
}

/** Runs after the purchase step, because a bill that becomes paid locks its charges. */
export async function importLinkBills(context: PluggySyncStepContext, link: PluggyLinkRecord): Promise<PluggySyncStepResult> {
  const [state, remote, stored, totals] = await Promise.all([cardBillRunState(context), context.remoteBills(link), loadStoredBills(context, link.accountId), importedTotals(context, link.accountId)]);
  const scope: BillScope = { context, link, counts: {}, attention: [] };
  const { bills, skipped } = mapCardBills(remote);
  for (const bill of skipped) {
    bump(scope, "cardBillsSkipped");
    if (bill.amountCents !== null) scope.attention.push(attentionItem("card_bill_non_positive", link, `Fatura ${bill.invoiceMonth}`, bill.dueDate, bill.amountCents));
  }
  const targets: PluggyCardBillTarget[] = [];
  for (const bill of bills) {
    const target = await importBill(scope, bill, stored.get(bill.invoiceMonth), totals.get(bill.invoiceMonth) ?? 0);
    claimRecordedEntries(state, target);
    targets.push(target);
  }
  state.targets.set(link.id, targets);
  return { counts: scope.counts, attention: scope.attention };
}
