import { encryptedInteger,encryptedText,encryptedTimestamp } from "@/lib/db/encrypted-content";
import { encryptionChecks } from "@/lib/db/encryption-checks";
import {
index,
sqliteTable,
uniqueIndex
} from "drizzle-orm/sqlite-core";
import { timestampColumns } from "./accounts";
import { recordId,referenceColumn } from "./columns";
import { investmentReductionEventTypes,investmentReductionSourceTypes,investmentReductionStatuses } from "./enums";
import { investmentHoldings,investmentPurposes } from "./investment-assets";
import { transactions } from "./transactions";

export const investmentPurposeAllocations = sqliteTable(
  "investment_purpose_allocations",
  {
    id: recordId(),
    holdingId: referenceColumn("holding_id", () => investmentHoldings.id, "restrict").notNull(),
    purposeId: referenceColumn("purpose_id", () => investmentPurposes.id, "restrict").notNull(),
    amountCents: encryptedInteger("amount_cents", "investment_purpose_allocations.amount_cents").notNull(),
    allocatedOn: encryptedText("allocated_on", "investment_purpose_allocations.allocated_on").notNull(),
    notes: encryptedText("notes", "investment_purpose_allocations.notes"),
    ...timestampColumns("investment_purpose_allocations"),
  },
  (table) => [
    ...encryptionChecks(table),
    index("investment_purpose_allocations_holding_idx").on(table.holdingId),
    index("investment_purpose_allocations_purpose_idx").on(table.purposeId),
    uniqueIndex("investment_purpose_allocations_holding_purpose_unique").on(
      table.holdingId,
      table.purposeId
    ),
  ]
);

export const investmentReductionEvents = sqliteTable(
  "investment_reduction_events",
  {
    id: recordId(),
    type: encryptedText("type", "investment_reduction_events.type", { enum: investmentReductionEventTypes }).notNull(),
    status: encryptedText("status", "investment_reduction_events.status", { enum: investmentReductionStatuses }).notNull().$defaultFn(() => "active"),
    transactionId: referenceColumn("transaction_id", () => transactions.id, "set null"),
    amountCents: encryptedInteger("amount_cents", "investment_reduction_events.amount_cents").notNull(),
    occurredOn: encryptedText("occurred_on", "investment_reduction_events.occurred_on").notNull(),
    reversedAt: encryptedTimestamp("reversed_at", "investment_reduction_events.reversed_at"),
    ...timestampColumns("investment_reduction_events"),
  },
  (table) => [
    ...encryptionChecks(table),
    index("investment_reduction_events_transaction_idx").on(table.transactionId),
  ]
);

export const investmentReductionSources = sqliteTable(
  "investment_reduction_sources",
  {
    id: recordId(),
    eventId: referenceColumn("event_id", () => investmentReductionEvents.id, "cascade").notNull(),
    sourceType: encryptedText("source_type", "investment_reduction_sources.source_type", { enum: investmentReductionSourceTypes }).notNull(),
    holdingId: referenceColumn("holding_id", () => investmentHoldings.id, "set null"),
    purposeId: referenceColumn("purpose_id", () => investmentPurposes.id, "set null"),
    allocationId: referenceColumn("allocation_id", () => investmentPurposeAllocations.id, "set null"),
    amountCents: encryptedInteger("amount_cents", "investment_reduction_sources.amount_cents").notNull(),
    ...timestampColumns("investment_reduction_sources"),
  },
  (table) => [
    ...encryptionChecks(table),
    index("investment_reduction_sources_event_idx").on(table.eventId),
    index("investment_reduction_sources_holding_idx").on(table.holdingId),
    index("investment_reduction_sources_purpose_idx").on(table.purposeId),
    index("investment_reduction_sources_allocation_idx").on(table.allocationId),
  ]
);
