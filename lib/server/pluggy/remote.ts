import type { PluggyAccountKind, PluggyRemoteAccount, PluggyRemoteAccountView, PluggyRemoteItem } from "@/lib/interfaces/pluggy";

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
