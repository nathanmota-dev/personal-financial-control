import { encryptedBoolean, encryptedText, encryptedTimestamp } from "@/lib/db/encrypted-content";
import { encryptionChecks } from "@/lib/db/encryption-checks";
import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { accounts, timestampColumns } from "./accounts";
import { recordId, referenceColumn } from "./columns";
import { pluggyAccountKinds, pluggyLedgerOutcomes, pluggySyncRunStatuses } from "./enums";

export const pluggyItems = sqliteTable("pluggy_items", {
  id: recordId(),
  externalItemId: encryptedText("external_item_id", "pluggy_items.external_item_id").notNull(),
  externalItemIdHash: text("external_item_id_hash"),
  label: encryptedText("label", "pluggy_items.label").notNull(),
  connectorName: encryptedText("connector_name", "pluggy_items.connector_name").notNull(),
  status: encryptedText("status", "pluggy_items.status").notNull(),
  collectedAt: encryptedTimestamp("collected_at", "pluggy_items.collected_at"),
  nextAutoSyncAt: encryptedTimestamp("next_auto_sync_at", "pluggy_items.next_auto_sync_at"),
  lastSyncedAt: encryptedTimestamp("last_synced_at", "pluggy_items.last_synced_at"),
  lastErrorCode: encryptedText("last_error_code", "pluggy_items.last_error_code"),
  ...timestampColumns("pluggy_items"),
}, (table) => [
  ...encryptionChecks(table),
  uniqueIndex("pluggy_items_external_item_unique").on(table.externalItemIdHash),
]);

export const pluggyAccountLinks = sqliteTable("pluggy_account_links", {
  id: recordId(),
  itemId: referenceColumn("item_id", () => pluggyItems.id, "cascade").notNull(),
  externalAccountId: encryptedText("external_account_id", "pluggy_account_links.external_account_id").notNull(),
  externalAccountIdHash: text("external_account_id_hash"),
  accountId: referenceColumn("account_id", () => accounts.id, "restrict").notNull(),
  remoteName: encryptedText("remote_name", "pluggy_account_links.remote_name").notNull(),
  kind: encryptedText("kind", "pluggy_account_links.kind", { enum: pluggyAccountKinds }).notNull(),
  cutoffDate: encryptedText("cutoff_date", "pluggy_account_links.cutoff_date").notNull(),
  isEnabled: encryptedBoolean("is_enabled", "pluggy_account_links.is_enabled").notNull().$defaultFn(() => true),
  ...timestampColumns("pluggy_account_links"),
}, (table) => [
  ...encryptionChecks(table),
  index("pluggy_account_links_item_idx").on(table.itemId),
  index("pluggy_account_links_account_idx").on(table.accountId),
  uniqueIndex("pluggy_account_links_external_account_unique").on(table.externalAccountIdHash),
]);

export const pluggySyncRuns = sqliteTable("pluggy_sync_runs", {
  id: recordId(),
  startedAt: encryptedTimestamp("started_at", "pluggy_sync_runs.started_at").notNull(),
  finishedAt: encryptedTimestamp("finished_at", "pluggy_sync_runs.finished_at"),
  status: encryptedText("status", "pluggy_sync_runs.status", { enum: pluggySyncRunStatuses }).notNull(),
  summary: encryptedText("summary", "pluggy_sync_runs.summary"),
  errorCode: encryptedText("error_code", "pluggy_sync_runs.error_code"),
  ...timestampColumns("pluggy_sync_runs"),
}, (table) => [...encryptionChecks(table)]);

export const pluggyImportLedger = sqliteTable("pluggy_import_ledger", {
  id: recordId(),
  fingerprint: encryptedText("fingerprint", "pluggy_import_ledger.fingerprint").notNull(),
  fingerprintHash: text("fingerprint_hash"),
  outcome: encryptedText("outcome", "pluggy_import_ledger.outcome", { enum: pluggyLedgerOutcomes }).notNull(),
  localTable: encryptedText("local_table", "pluggy_import_ledger.local_table"),
  localId: encryptedText("local_id", "pluggy_import_ledger.local_id"),
  lastSeenAt: encryptedTimestamp("last_seen_at", "pluggy_import_ledger.last_seen_at").notNull(),
  ...timestampColumns("pluggy_import_ledger"),
}, (table) => [
  ...encryptionChecks(table),
  uniqueIndex("pluggy_import_ledger_fingerprint_unique").on(table.fingerprintHash),
]);
