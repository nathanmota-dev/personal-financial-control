import { createHash } from "node:crypto";

import type { PluggyAttentionItem, PluggyLinkRecord, PluggySyncStepContext, PluggySyncStepResult } from "@/lib/interfaces/pluggy";
import type { BankImportRunState, PluggyBankRow } from "@/lib/interfaces/pluggy-bank-import";
import type { CardBillRunState, PluggyBillPaymentEntry, PluggyCardBillTarget } from "@/lib/interfaces/pluggy-card-bills";
import { createCreditCardBillPayment } from "@/lib/server/credit-card-bills";
import { bankImportRunState, readBankRows } from "../bank-import/run-state";
import { bump, dayDistance } from "../bank-import/scope";
import { BILL_ENTRY_WINDOW_DAYS, billPaymentKind, matchBillPayment } from "../match-bill-payment";
import { attentionItem, cardBillRunState, updateBillLedger } from "./run-state";

type PaymentScope = { context: PluggySyncStepContext; link: PluggyLinkRecord; run: BankImportRunState; state: CardBillRunState; counts: Record<string, number>; attention: PluggyAttentionItem[] };
type PaymentWrite = { accountId: string; invoiceMonth: string; kind: "settlement" | "pre_statement" | "unlinked" };

const KEY_PREFIX = "pluggy:bill-payment:";
const MAX_KEY_LENGTH = 255;

export function billPaymentKey(fingerprint: string) {
  const key = `${KEY_PREFIX}${fingerprint}`;
  return key.length <= MAX_KEY_LENGTH ? key : `${KEY_PREFIX}${createHash("sha256").update(fingerprint).digest("hex")}`;
}

function linkLedger(scope: PaymentScope, row: PluggyBankRow, localId: string | null) {
  return updateBillLedger(scope.context, scope.run, { fingerprint: row.fingerprint, outcome: "matched", localTable: "credit_card_bill_payments", localId });
}

function flag(scope: PaymentScope, reason: "card_payment_unlinked" | "card_payment_ambiguous", row: PluggyBankRow) {
  scope.attention.push(attentionItem(reason, scope.link, row.description, row.transactionDate, row.amountCents));
}

/** The payment creates its own transaction, so none is created here. A retry after a failed ledger write finds it by the key. */
async function writePayment(scope: PaymentScope, row: PluggyBankRow, payment: PaymentWrite) {
  const holder: { id?: string } = {};
  await scope.context.write(async (db) => {
    holder.id = (await createCreditCardBillPayment({ ...payment, paymentAccountId: scope.link.accountId, amountCents: row.amountCents, paymentDate: row.transactionDate, idempotencyKey: billPaymentKey(row.fingerprint) }, db)).id;
  });
  await linkLedger(scope, row, holder.id ?? null);
}

/** A payment the user already recorded by hand keeps its transaction, so the bank row must not create a second one. */
function findRecordedByHand({ state, link }: PaymentScope, row: PluggyBankRow) {
  return state.localPayments.find((payment) => !payment.claimed && !payment.idempotencyKey.startsWith("pluggy:") && payment.accountId === link.accountId && payment.amountCents === row.amountCents && dayDistance(payment.paymentDate, row.transactionDate) <= BILL_ENTRY_WINDOW_DAYS);
}

function applySettlement(target: PluggyCardBillTarget, amountCents: number) {
  target.settledCents += amountCents;
  target.paid = target.settledCents >= target.statementTotalCents;
}

function claimEntry(target: PluggyCardBillTarget, entry: PluggyBillPaymentEntry | null, amountCents: number) {
  const claimed = entry ?? target.payments.find((item) => !item.claimed && item.amountCents === amountCents);
  if (claimed) claimed.claimed = true;
}

async function linkToBill(scope: PaymentScope, row: PluggyBankRow, target: PluggyCardBillTarget, entry: PluggyBillPaymentEntry | null) {
  claimEntry(target, entry, row.amountCents);
  const { accountId } = target.link;
  // A paid bill rejects new payments, but the money did leave the account and is not an expense.
  if (target.paid) {
    await writePayment(scope, row, { accountId, invoiceMonth: target.invoiceMonth, kind: "unlinked" });
    bump(scope, "billPaymentsUnlinked");
    return flag(scope, "card_payment_unlinked", row);
  }
  const kind = billPaymentKind(target, row.transactionDate);
  await writePayment(scope, row, { accountId, invoiceMonth: target.invoiceMonth, kind });
  if (kind === "settlement") applySettlement(target, row.amountCents);
  bump(scope, "billPaymentsLinked");
}

/** Without a bill the card is only known when there is a single one. A card whose bills were not read may still hold the match. */
async function handleNoBill(scope: PaymentScope, row: PluggyBankRow) {
  const { creditLinks, targets } = scope.state;
  if (!creditLinks.length || creditLinks.some((link) => !targets.has(link.id))) return bump(scope, "billPaymentsDeferred");
  const cards = new Set(creditLinks.map((link) => link.accountId));
  if (cards.size !== 1) {
    bump(scope, "billPaymentsAmbiguous");
    return flag(scope, "card_payment_ambiguous", row);
  }
  await writePayment(scope, row, { accountId: [...cards][0], invoiceMonth: row.competenceMonth, kind: "unlinked" });
  bump(scope, "billPaymentsUnlinked");
  flag(scope, "card_payment_unlinked", row);
}

async function linkPayment(scope: PaymentScope, row: PluggyBankRow) {
  const recorded = findRecordedByHand(scope, row);
  if (recorded) {
    recorded.claimed = true;
    await linkLedger(scope, row, recorded.id);
    return bump(scope, "billPaymentsLinked");
  }
  const match = matchBillPayment({ amountCents: row.amountCents, date: row.transactionDate }, [...scope.state.targets.values()].flat());
  if (match.outcome === "matched") return linkToBill(scope, row, match.target, match.entry);
  if (match.outcome === "none") return handleNoBill(scope, row);
  bump(scope, "billPaymentsAmbiguous");
  flag(scope, "card_payment_ambiguous", row);
}

export async function linkBankBillPayments(context: PluggySyncStepContext, link: PluggyLinkRecord): Promise<PluggySyncStepResult> {
  const [run, state, { rows }] = await Promise.all([bankImportRunState(context), cardBillRunState(context), readBankRows(context, link)]);
  const scope: PaymentScope = { context, link, run, state, counts: {}, attention: [] };
  for (const row of rows) {
    if (row.status === "posted" && run.ledger.get(row.fingerprint)?.outcome === "pending_card_payment") await linkPayment(scope, row);
  }
  state.processedBankLinks.add(link.id);
  return { counts: scope.counts, attention: scope.attention };
}
