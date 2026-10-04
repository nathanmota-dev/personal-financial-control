import { encryptedInteger,encryptedText } from "@/lib/db/encrypted-content";
import { encryptionChecks } from "@/lib/db/encryption-checks";
import {
index,
sqliteTable,
text,
uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { accounts,categories,timestampColumns } from "./accounts";
import { recordId,referenceColumn } from "./columns";
import { creditCardBillPaymentKinds,creditCardBillStatuses,creditCardChargeKinds } from "./enums";
import { transactions } from "./transactions";

export const creditCardCharges = sqliteTable(
  "credit_card_charges",
  {
    id: recordId(),
    accountId: referenceColumn("account_id", () => accounts.id, "restrict").notNull(),
    categoryId: referenceColumn("category_id", () => categories.id, "restrict").notNull(),
    description: encryptedText("description", "credit_card_charges.description").notNull(),
    notes: encryptedText("notes", "credit_card_charges.notes"),
    purchaseDate: encryptedText("purchase_date", "credit_card_charges.purchase_date").notNull(),
    totalAmountCents: encryptedInteger("total_amount_cents", "credit_card_charges.total_amount_cents").notNull(),
    installmentCount: encryptedInteger("installment_count", "credit_card_charges.installment_count").notNull(),
    kind: encryptedText("kind", "credit_card_charges.kind", { enum: creditCardChargeKinds }).notNull().$defaultFn(() => "purchase"),
    firstInvoiceMonth: encryptedText("first_invoice_month", "credit_card_charges.first_invoice_month").notNull(),
    importFingerprint: encryptedText("import_fingerprint", "credit_card_charges.import_fingerprint"),
    importFingerprintHash: text("import_fingerprint_hash"),
    ...timestampColumns("credit_card_charges"),
  },
  (table) => [
    ...encryptionChecks(table),
    index("credit_card_charges_account_idx").on(table.accountId),
    index("credit_card_charges_category_idx").on(table.categoryId),
    uniqueIndex("credit_card_charges_import_fingerprint_unique").on(table.importFingerprintHash),
  ]
);

export const creditCardBills = sqliteTable(
  "credit_card_bills",
  {
    id: recordId(),
    accountId: referenceColumn("account_id", () => accounts.id, "restrict").notNull(),
    invoiceMonth: encryptedText("invoice_month", "credit_card_bills.invoice_month").notNull(),
    dueDate: encryptedText("due_date", "credit_card_bills.due_date").notNull(),
    statementTotalCents: encryptedInteger("statement_total_cents", "credit_card_bills.statement_total_cents").notNull(),
    currentChargesTotalCents: encryptedInteger("current_charges_total_cents", "credit_card_bills.current_charges_total_cents").notNull(),
    priorBalanceCents: encryptedInteger("prior_balance_cents", "credit_card_bills.prior_balance_cents").notNull(),
    preStatementPaymentsCents: encryptedInteger("pre_statement_payments_cents", "credit_card_bills.pre_statement_payments_cents").notNull(),
    ignoredAmountCents: encryptedInteger("ignored_amount_cents", "credit_card_bills.ignored_amount_cents").notNull(),
    status: encryptedText("status", "credit_card_bills.status", { enum: creditCardBillStatuses }).notNull().$defaultFn(() => "open"),
    paidAt: encryptedText("paid_at", "credit_card_bills.paid_at"),
    invoiceMonthHash: text("invoice_month_hash"),
    ...timestampColumns("credit_card_bills"),
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("credit_card_bills_account_month_unique").on(
      table.accountId,
      table.invoiceMonthHash
    ),
    index("credit_card_bills_account_idx").on(table.accountId),
  ]
);

export const creditCardBillPayments = sqliteTable(
  "credit_card_bill_payments",
  {
    id: recordId(),
    billId: referenceColumn("bill_id", () => creditCardBills.id, "set null"),
    transactionId: referenceColumn("transaction_id", () => transactions.id, "cascade").notNull(),
    paymentDate: encryptedText("payment_date", "credit_card_bill_payments.payment_date").notNull(),
    amountCents: encryptedInteger("amount_cents", "credit_card_bill_payments.amount_cents").notNull(),
    kind: encryptedText("kind", "credit_card_bill_payments.kind", { enum: creditCardBillPaymentKinds }).notNull(),
    idempotencyKey: encryptedText("idempotency_key", "credit_card_bill_payments.idempotency_key").notNull(),
    idempotencyKeyHash: text("idempotency_key_hash"),
    ...timestampColumns("credit_card_bill_payments"),
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("credit_card_bill_payments_transaction_unique").on(table.transactionId),
    uniqueIndex("credit_card_bill_payments_idempotency_unique").on(table.idempotencyKeyHash),
    index("credit_card_bill_payments_bill_idx").on(table.billId),
  ]
);

export const creditCardInstallments = sqliteTable(
  "credit_card_installments",
  {
    id: recordId(),
    chargeId: referenceColumn("charge_id", () => creditCardCharges.id, "cascade").notNull(),
    installmentNumber: encryptedInteger("installment_number", "credit_card_installments.installment_number").notNull(),
    amountCents: encryptedInteger("amount_cents", "credit_card_installments.amount_cents").notNull(),
    invoiceMonth: encryptedText("invoice_month", "credit_card_installments.invoice_month").notNull(),
    installmentNumberHash: text("installment_number_hash"),
    ...timestampColumns("credit_card_installments"),
  },
  (table) => [
    ...encryptionChecks(table),
    index("credit_card_installments_charge_idx").on(table.chargeId),
    uniqueIndex("credit_card_installments_charge_number_unique").on(
      table.chargeId,
      table.installmentNumberHash
    ),
  ]
);
