import { encryptedBoolean,encryptedInteger,encryptedText } from "@/lib/db/encrypted-content";
import { encryptionChecks } from "@/lib/db/encryption-checks";
import {
index,
sqliteTable,
text,
uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { accounts,categories,timestampColumns } from "./accounts";
import { recordId,referenceColumn } from "./columns";
import { recurringStatuses,recurringTransactionTypes,transactionFundingLinkTypes,transactionStatuses,transactionTypes } from "./enums";

export const recurringTemplates = sqliteTable(
  "recurring_templates",
  {
    id: recordId(),
    accountId: referenceColumn("account_id", () => accounts.id, "restrict").notNull(),
    categoryId: referenceColumn("category_id", () => categories.id, "restrict").notNull(),
    type: encryptedText("type", "recurring_templates.type", { enum: recurringTransactionTypes }).notNull(),
    status: encryptedText("status", "recurring_templates.status", { enum: recurringStatuses }).notNull().$defaultFn(() => "active"),
    amountCents: encryptedInteger("amount_cents", "recurring_templates.amount_cents").notNull(),
    dayOfMonth: encryptedInteger("day_of_month", "recurring_templates.day_of_month").notNull(),
    startMonth: encryptedText("start_month", "recurring_templates.start_month").notNull(),
    endMonth: encryptedText("end_month", "recurring_templates.end_month"),
    lastGeneratedMonth: encryptedText("last_generated_month", "recurring_templates.last_generated_month"),
    description: encryptedText("description", "recurring_templates.description").notNull(),
    ...timestampColumns("recurring_templates"),
  },
  (table) => [
    ...encryptionChecks(table),
    index("recurring_templates_account_idx").on(table.accountId),
    index("recurring_templates_category_idx").on(table.categoryId),
  ]
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: recordId(),
    accountId: referenceColumn("account_id", () => accounts.id, "restrict").notNull(),
    categoryId: referenceColumn("category_id", () => categories.id, "restrict"),
    recurringTemplateId: referenceColumn("recurring_template_id", () => recurringTemplates.id, "set null"),
    type: encryptedText("type", "transactions.type", { enum: transactionTypes }).notNull(),
    status: encryptedText("status", "transactions.status", { enum: transactionStatuses }).notNull().$defaultFn(() => "posted"),
    amountCents: encryptedInteger("amount_cents", "transactions.amount_cents").notNull(),
    transactionDate: encryptedText("transaction_date", "transactions.transaction_date").notNull(),
    competenceMonth: encryptedText("competence_month", "transactions.competence_month").notNull(),
    description: encryptedText("description", "transactions.description").notNull(),
    notes: encryptedText("notes", "transactions.notes"),
    importFingerprint: encryptedText("import_fingerprint", "transactions.import_fingerprint"),
    isIncludedInInvestmentCheckpoint: encryptedBoolean("is_included_in_investment_checkpoint", "transactions.is_included_in_investment_checkpoint")
      .notNull()
      .$defaultFn(() => true),
    importFingerprintHash: text("import_fingerprint_hash"),
    competenceMonthHash: text("competence_month_hash"),
    ...timestampColumns("transactions"),
  },
  (table) => [
    ...encryptionChecks(table),
    index("transactions_account_idx").on(table.accountId),
    index("transactions_category_idx").on(table.categoryId),
    index("transactions_competence_idx").on(table.competenceMonthHash),
    uniqueIndex("transactions_import_fingerprint_unique").on(table.importFingerprintHash),
    uniqueIndex("transactions_recurring_month_unique").on(
      table.recurringTemplateId,
      table.competenceMonthHash
    ),
  ]
);

export const transactionFundingLinks = sqliteTable(
  "transaction_funding_links",
  {
    id: recordId(),
    expenseTransactionId: referenceColumn("expense_transaction_id", () => transactions.id, "cascade").notNull(),
    withdrawalTransactionId: referenceColumn("withdrawal_transaction_id", () => transactions.id, "cascade").notNull(),
    type: encryptedText("type", "transaction_funding_links.type", { enum: transactionFundingLinkTypes }).notNull(),
    ...timestampColumns("transaction_funding_links"),
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("transaction_funding_links_expense_unique").on(table.expenseTransactionId),
    uniqueIndex("transaction_funding_links_withdrawal_unique").on(table.withdrawalTransactionId),
  ]
);

export const transfers = sqliteTable(
  "transfers",
  {
    id: recordId(),
    fromAccountId: referenceColumn("from_account_id", () => accounts.id, "restrict").notNull(),
    toAccountId: referenceColumn("to_account_id", () => accounts.id, "restrict").notNull(),
    amountCents: encryptedInteger("amount_cents", "transfers.amount_cents").notNull(),
    transferDate: encryptedText("transfer_date", "transfers.transfer_date").notNull(),
    competenceMonth: encryptedText("competence_month", "transfers.competence_month").notNull(),
    description: encryptedText("description", "transfers.description").notNull(),
    ...timestampColumns("transfers"),
  },
  (table) => [
    ...encryptionChecks(table),
    index("transfers_from_account_idx").on(table.fromAccountId),
    index("transfers_to_account_idx").on(table.toAccountId),
  ]
);
