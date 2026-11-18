import type { PluggyAccountKind, PluggyCardLimit, PluggyRemoteAccount, PluggyRemoteAccountView, PluggyRemoteItem } from "@/lib/interfaces/pluggy";
import { toAmountCents } from "./mappers/bank-transaction";

function optionalDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function remoteItemFields(remote: PluggyRemoteItem) {
  return {
    status: remote.status,
    connectorName: remote.connector?.name ?? "Pluggy",
    collectedAt: optionalDate(remote.lastUpdatedAt),
    nextAutoSyncAt: optionalDate(remote.nextAutoSyncAt),
  };
}

export function remoteAccountKind(remote: PluggyRemoteAccount): PluggyAccountKind {
  return remote.type.toUpperCase() === "CREDIT" ? "credit" : "bank";
}

export function remoteAccountName(remote: PluggyRemoteAccount) {
  return remote.marketingName?.trim() || remote.name;
}

export function remoteAccountView(remote: PluggyRemoteAccount): PluggyRemoteAccountView {
  return {
    externalAccountId: remote.id,
    name: remoteAccountName(remote),
    kind: remoteAccountKind(remote),
    numberSuffix: remote.number ? remote.number.slice(-4) : null,
  };
}

/** Null when the bank did not report both the limit and what is still available. */
export function remoteCardLimit(remote: PluggyRemoteAccount, now: Date): PluggyCardLimit | null {
  const limit = remote.creditData?.creditLimit;
  const available = remote.creditData?.availableCreditLimit;
  if (limit == null || available == null || limit <= 0) return null;
  const availableCents = toAmountCents(available);
  return {
    limitCents: toAmountCents(limit),
    // Above the limit the bank reports a negative balance still available.
    availableCents: available < 0 ? -availableCents : availableCents,
    collectedAt: optionalDate(remote.updatedAt) ?? now,
  };
}
