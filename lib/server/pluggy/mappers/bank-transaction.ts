import type { PluggyBankRow, PluggyDirection } from "@/lib/interfaces/pluggy-bank-import";
import type { PluggyRemoteTransaction } from "@/lib/interfaces/pluggy";
import { pluggyTimeZone } from "@/lib/pluggy-ui";

const FALLBACK_DESCRIPTION = "Lançamento bancário";
const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: pluggyTimeZone });

/** Banks stamp `date` at varying times near midnight, so the UTC day can be the wrong local day. */
export function localDay(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dayFormatter.format(date);
}

/** Trims binary noise first, so that 1.005 reads as 100.5 cents instead of 100.49999. */
export function toAmountCents(amount: number) {
  return Math.round(Number((Math.abs(amount) * 100).toFixed(6)));
}

function direction(value: string | null | undefined): PluggyDirection | null {
  return value === "DEBIT" || value === "CREDIT" ? value : null;
}

/** Returns null for a record that cannot become a ledger entry. Direction comes from `type`, never from the sign. */
export function mapBankTransaction(remote: PluggyRemoteTransaction): PluggyBankRow | null {
  const remoteDirection = direction(remote.type);
  const transactionDate = localDay(remote.date);
  const amountCents = toAmountCents(remote.amount);
  if (!remoteDirection || !transactionDate || amountCents === 0) return null;
  return {
    fingerprint: `pluggy:bank:${remote.providerId || remote.id}`,
    direction: remoteDirection,
    type: remoteDirection === "DEBIT" ? "expense" : "income",
    status: remote.status === "PENDING" ? "pending" : "posted",
    amountCents,
    transactionDate,
    competenceMonth: transactionDate.slice(0, 7),
    description: remote.description?.trim() || FALLBACK_DESCRIPTION,
    operationType: remote.operationType ?? null,
    paymentData: remote.paymentData ?? null,
  };
}
