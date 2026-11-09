import type { BankImportLedgerEntry, BankImportScope, PluggyBankRow } from "@/lib/interfaces/pluggy-bank-import";
import type { PluggyAttentionReason } from "@/lib/interfaces/pluggy";

const DAY_MS = 86_400_000;

export function dayDistance(left: string, right: string) {
  return Math.abs(Date.parse(left) - Date.parse(right)) / DAY_MS;
}

/** The earliest candidate wins a tie, so repeated runs pair the same records. */
export function closestByDate<T>(candidates: T[], date: string, dateOf: (candidate: T) => string) {
  let best: T | null = null;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const distance = dayDistance(dateOf(candidate), date);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

export function bump(scope: BankImportScope, name: string) {
  scope.counts[name] = (scope.counts[name] ?? 0) + 1;
}

export function flagAttention(scope: BankImportScope, row: PluggyBankRow, reason: PluggyAttentionReason) {
  bump(scope, "bankAttention");
  scope.attention.push({ reason, accountLabel: scope.link.remoteName, description: row.description, date: row.transactionDate, amountCents: row.amountCents });
}

export function ledgerValues(entry: BankImportLedgerEntry, now: Date) {
  return { ...entry, lastSeenAt: now, updatedAt: now };
}
