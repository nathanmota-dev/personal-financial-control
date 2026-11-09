import type { PluggyBillPaymentEntry, PluggyBillPaymentMatch, PluggyBillPaymentSubject, PluggyCardBillTarget } from "@/lib/interfaces/pluggy-card-bills";
import { closestByDate, dayDistance } from "./bank-import/scope";

export const BILL_ENTRY_WINDOW_DAYS = 3;
const DUE_DATE_WINDOW_DAYS = 15;

type Candidate = { target: PluggyCardBillTarget; entry: PluggyBillPaymentEntry | null; date: string };

export function billEntryMatches(entry: PluggyBillPaymentEntry, payment: PluggyBillPaymentSubject) {
  return entry.amountCents === payment.amountCents && dayDistance(entry.date, payment.date) <= BILL_ENTRY_WINDOW_DAYS;
}

function entryCandidates(payment: PluggyBillPaymentSubject, targets: PluggyCardBillTarget[]): Candidate[] {
  return targets.flatMap((target) => target.payments
    .filter((entry) => !entry.claimed && billEntryMatches(entry, payment))
    .map((entry) => ({ target, entry, date: entry.date })));
}

function totalCandidates(payment: PluggyBillPaymentSubject, targets: PluggyCardBillTarget[]): Candidate[] {
  return targets
    .filter((target) => !target.paid && target.statementTotalCents === payment.amountCents && dayDistance(target.dueDate, payment.date) <= DUE_DATE_WINDOW_DAYS)
    .map((target) => ({ target, entry: null, date: target.dueDate }));
}

function resolve(candidates: Candidate[], payment: PluggyBillPaymentSubject): PluggyBillPaymentMatch {
  if (new Set(candidates.map((candidate) => candidate.target.link.accountId)).size > 1) return { outcome: "ambiguous" };
  const best = closestByDate(candidates, payment.date, (candidate) => candidate.date)!;
  return { outcome: "matched", target: best.target, entry: best.entry };
}

/** Pure. A payment listed on a bill is stronger evidence than an equal total, and two cards that both fit are never guessed between. */
export function matchBillPayment(payment: PluggyBillPaymentSubject, targets: PluggyCardBillTarget[]): PluggyBillPaymentMatch {
  const listed = entryCandidates(payment, targets);
  if (listed.length) return resolve(listed, payment);
  const byTotal = totalCandidates(payment, targets);
  return byTotal.length ? resolve(byTotal, payment) : { outcome: "none" };
}

/** Before closing the payment reduces the coming statement. A bank that omits the closing date gives no evidence of that. */
export function billPaymentKind(target: PluggyCardBillTarget, date: string) {
  return target.closingDate && date < target.closingDate ? "pre_statement" as const : "settlement" as const;
}
