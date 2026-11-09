import type { PluggyCardRow, PluggyCardRowKind } from "@/lib/interfaces/pluggy-card-import";
import type { PluggyRemoteTransaction } from "@/lib/interfaces/pluggy";
import { normalizeOwnerName } from "../classify-bank-transaction";
import { localDay, toAmountCents } from "./bank-transaction";

const FALLBACK_DESCRIPTION = "Compra no cartão";
const ACCOUNT_CURRENCY = "BRL";
const MAX_INSTALLMENTS = 60;
const BILL_PAYMENT = /^PAGAMENTO\b/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}(?:T00:00:00(?:\.0+)?Z)?$/;

/** A value at exactly midnight UTC carries only a date, and converting it would move it to the previous day. */
function calendarDay(value: string) {
  return DATE_ONLY.test(value) ? value.slice(0, 10) : localDay(value);
}

function foreignCurrency(remote: PluggyRemoteTransaction) {
  return Boolean(remote.currencyCode) && remote.currencyCode !== ACCOUNT_CURRENCY;
}

function accountAmount(remote: PluggyRemoteTransaction) {
  return foreignCurrency(remote) ? remote.amountInAccountCurrency ?? null : remote.amount;
}

function creditKind(remote: PluggyRemoteTransaction): PluggyCardRowKind {
  const isPayment = remote.operationType === "PAGAMENTO_FATURA" || BILL_PAYMENT.test(normalizeOwnerName(remote.description ?? ""));
  return isPayment ? "bill_payment" : "refund";
}

/** Anything outside the limits of a local purchase is treated as a single payment. */
function installmentsOf(remote: PluggyRemoteTransaction) {
  const number = remote.creditCardMetadata?.installmentNumber ?? 0;
  const total = remote.creditCardMetadata?.totalInstallments ?? 0;
  return total >= 2 && total <= MAX_INSTALLMENTS && number >= 1 && number <= total ? { number, total } : null;
}

/** Returns null for a record that cannot become a charge. On a card, a positive amount is a purchase. */
export function mapCardTransaction(remote: PluggyRemoteTransaction): PluggyCardRow | null {
  const date = localDay(remote.date);
  const converted = accountAmount(remote);
  const amount = converted ?? remote.amount;
  const amountCents = toAmountCents(amount);
  if (!date || amountCents === 0) return null;
  const installments = installmentsOf(remote);
  const purchaseDate = remote.creditCardMetadata?.purchaseDate;
  return {
    remoteId: remote.providerId || remote.id,
    kind: converted === null ? "unconverted" : amount > 0 ? "purchase" : creditKind(remote),
    status: remote.status === "PENDING" ? "pending" : "posted",
    amountCents,
    date,
    purchaseDate: purchaseDate ? calendarDay(purchaseDate) : null,
    description: remote.description?.trim() || FALLBACK_DESCRIPTION,
    installmentNumber: installments?.number ?? null,
    totalInstallments: installments?.total ?? null,
    billId: remote.creditCardMetadata?.billId ?? null,
  };
}
