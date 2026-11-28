import { encryptedText } from "@/lib/db/encrypted-content";
import { encryptionChecks } from "@/lib/db/encryption-checks";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestampColumns } from "./accounts";
import { recordId, referenceColumn } from "./columns";
import { creditCardCharges } from "./credit-card";
import { recurringOccurrenceLinkKinds } from "./enums";
import { recurringTemplates, transactions } from "./transactions";

/**
 * Ties a recurring rule's month to what really happened: a bank or manual transaction, or a card purchase.
 * Exactly one of `transactionId` and `creditCardChargeId` is set. An entry pays at most one rule, which the services enforce:
 * a `dismissed` row only records a pair the user undid, so it must not keep the entry from another rule.
 */
export const recurringOccurrenceLinks = sqliteTable(
  "recurring_occurrence_links",
  {
    id: recordId(),
    recurringTemplateId: referenceColumn("recurring_template_id", () => recurringTemplates.id, "cascade").notNull(),
    competenceMonth: encryptedText("competence_month", "recurring_occurrence_links.competence_month").notNull(),
    transactionId: referenceColumn("transaction_id", () => transactions.id, "cascade"),
    creditCardChargeId: referenceColumn("credit_card_charge_id", () => creditCardCharges.id, "cascade"),
    kind: encryptedText("kind", "recurring_occurrence_links.kind", { enum: recurringOccurrenceLinkKinds }).notNull(),
    competenceMonthHash: text("competence_month_hash"),
    ...timestampColumns("recurring_occurrence_links"),
  },
  (table) => [
    ...encryptionChecks(table),
    index("recurring_occurrence_links_template_month_idx").on(table.recurringTemplateId, table.competenceMonthHash),
    index("recurring_occurrence_links_transaction_idx").on(table.transactionId),
    index("recurring_occurrence_links_charge_idx").on(table.creditCardChargeId),
  ]
);
