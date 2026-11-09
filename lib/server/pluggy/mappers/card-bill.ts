import type { PluggyRemoteBill } from "@/lib/interfaces/pluggy";
import type { PluggyBillPaymentEntry, PluggyMappedCardBill, PluggyMappedCardBills } from "@/lib/interfaces/pluggy-card-bills";
import { toAmountCents } from "./bank-transaction";

/** Bill dates are date-only values at midnight UTC, and converting them would move them to the previous day. */
function utcDay(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function paymentEntries(bill: PluggyRemoteBill): PluggyBillPaymentEntry[] {
  return (bill.payments ?? []).flatMap((payment) => {
    const date = utcDay(payment.paymentDate);
    const amountCents = toAmountCents(payment.amount ?? 0);
    return date && amountCents ? [{ amountCents, date, claimed: false, mirrored: false }] : [];
  });
}

const sumCents = (entries: PluggyBillPaymentEntry[]) => entries.reduce((total, entry) => total + entry.amountCents, 0);

/** A bank that lists no payments says nothing about the balance, so the previous bill is taken as paid. */
function paidAfterClosing(previous: PluggyMappedCardBill) {
  if (!previous.payments.length) return previous.statementTotalCents;
  const { closingDate } = previous;
  return sumCents(previous.payments.filter((entry) => !closingDate || entry.date >= closingDate));
}

function mapBill(bill: PluggyRemoteBill, dueDate: string, statementTotalCents: number, previous: PluggyMappedCardBill | null): PluggyMappedCardBill {
  const closingDate = utcDay(bill.billClosingDate);
  const payments = paymentEntries(bill);
  return {
    invoiceMonth: dueDate.slice(0, 7),
    dueDate,
    closingDate,
    statementTotalCents,
    priorBalanceCents: previous?.statementTotalCents ?? 0,
    priorPaidCents: previous ? paidAfterClosing(previous) : 0,
    preStatementPaymentsCents: closingDate ? sumCents(payments.filter((entry) => entry.date < closingDate)) : 0,
    payments,
  };
}

/** Pure. Oldest first, and one bill per month: when a month repeats, the bill with the latest due date is kept. */
export function mapCardBills(remote: PluggyRemoteBill[]): PluggyMappedCardBills {
  const dated = remote
    .flatMap((bill) => {
      const dueDate = utcDay(bill.dueDate);
      return dueDate ? [{ bill, dueDate }] : [];
    })
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.bill.id.localeCompare(right.bill.id));
  const result: PluggyMappedCardBills = { bills: [], skipped: [] };
  let previous: PluggyMappedCardBill | null = null;
  for (const { bill, dueDate } of new Map(dated.map((item) => [item.dueDate.slice(0, 7), item])).values()) {
    const total = bill.totalAmount ?? null;
    const statementTotalCents = total !== null && total > 0 ? toAmountCents(total) : 0;
    if (!statementTotalCents) {
      result.skipped.push({ invoiceMonth: dueDate.slice(0, 7), dueDate, amountCents: total === null ? null : toAmountCents(total) });
      previous = null;
      continue;
    }
    previous = mapBill(bill, dueDate, statementTotalCents, previous);
    result.bills.push(previous);
  }
  return result;
}
