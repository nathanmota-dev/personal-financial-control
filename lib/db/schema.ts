import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const accountTypes = [
  "checking",
  "savings",
  "cash",
  "credit",
  "investment",
] as const;

export const categoryGroups = [
  "income",
  "fixed_expense",
  "variable_expense",
  "investment",
] as const;

export const transactionTypes = [
  "income",
  "expense",
  "investment_contribution",
] as const;

export const transactionStatuses = [
  "pending",
  "posted",
  "cancelled",
] as const;

export const recurringStatuses = ["active", "paused", "ended"] as const;

function timestampColumns() {
  return {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  };
}

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    type: text("type", { enum: accountTypes }).notNull(),
    initialBalanceCents: integer("initial_balance_cents").notNull().default(0),
    creditClosingDay: integer("credit_closing_day"),
    creditDueDay: integer("credit_due_day").notNull().default(10),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    ...timestampColumns(),
  },
  (table) => [uniqueIndex("accounts_name_unique").on(table.name)]
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    group: text("group", { enum: categoryGroups }).notNull(),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    ...timestampColumns(),
  },
  (table) => [uniqueIndex("categories_name_unique").on(table.name)]
);

export const recurringTemplates = sqliteTable(
  "recurring_templates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    type: text("type", { enum: transactionTypes }).notNull(),
    status: text("status", { enum: recurringStatuses }).notNull().default("active"),
    amountCents: integer("amount_cents").notNull(),
    dayOfMonth: integer("day_of_month").notNull(),
    startMonth: text("start_month").notNull(),
    endMonth: text("end_month"),
    lastGeneratedMonth: text("last_generated_month"),
    description: text("description").notNull(),
    ...timestampColumns(),
  },
  (table) => [
    index("recurring_templates_account_idx").on(table.accountId),
    index("recurring_templates_category_idx").on(table.categoryId),
  ]
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    recurringTemplateId: text("recurring_template_id").references(
      () => recurringTemplates.id,
      { onDelete: "set null" }
    ),
    type: text("type", { enum: transactionTypes }).notNull(),
    status: text("status", { enum: transactionStatuses }).notNull().default("posted"),
    amountCents: integer("amount_cents").notNull(),
    transactionDate: text("transaction_date").notNull(),
    competenceMonth: text("competence_month").notNull(),
    description: text("description").notNull(),
    notes: text("notes"),
    ...timestampColumns(),
  },
  (table) => [
    index("transactions_account_idx").on(table.accountId),
    index("transactions_category_idx").on(table.categoryId),
    index("transactions_competence_idx").on(table.competenceMonth),
    uniqueIndex("transactions_recurring_month_unique").on(
      table.recurringTemplateId,
      table.competenceMonth
    ),
  ]
);

export const transfers = sqliteTable(
  "transfers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    fromAccountId: text("from_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    toAccountId: text("to_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    amountCents: integer("amount_cents").notNull(),
    transferDate: text("transfer_date").notNull(),
    competenceMonth: text("competence_month").notNull(),
    description: text("description").notNull(),
    ...timestampColumns(),
  },
  (table) => [
    index("transfers_from_account_idx").on(table.fromAccountId),
    index("transfers_to_account_idx").on(table.toAccountId),
    index("transfers_competence_idx").on(table.competenceMonth),
  ]
);

export const creditCardCharges = sqliteTable(
  "credit_card_charges",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    description: text("description").notNull(),
    notes: text("notes"),
    purchaseDate: text("purchase_date").notNull(),
    totalAmountCents: integer("total_amount_cents").notNull(),
    installmentCount: integer("installment_count").notNull(),
    firstInvoiceMonth: text("first_invoice_month").notNull(),
    ...timestampColumns(),
  },
  (table) => [
    index("credit_card_charges_account_idx").on(table.accountId),
    index("credit_card_charges_category_idx").on(table.categoryId),
    index("credit_card_charges_purchase_date_idx").on(table.purchaseDate),
    index("credit_card_charges_first_invoice_idx").on(table.firstInvoiceMonth),
  ]
);

export const creditCardInstallments = sqliteTable(
  "credit_card_installments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    chargeId: text("charge_id")
      .notNull()
      .references(() => creditCardCharges.id, { onDelete: "cascade" }),
    installmentNumber: integer("installment_number").notNull(),
    amountCents: integer("amount_cents").notNull(),
    invoiceMonth: text("invoice_month").notNull(),
    ...timestampColumns(),
  },
  (table) => [
    index("credit_card_installments_charge_idx").on(table.chargeId),
    index("credit_card_installments_invoice_month_idx").on(table.invoiceMonth),
    uniqueIndex("credit_card_installments_charge_number_unique").on(
      table.chargeId,
      table.installmentNumber
    ),
  ]
);

export const investmentPortfolio = sqliteTable("investment_portfolio", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  currentBalanceCents: integer("current_balance_cents").notNull(),
  monthlyContributionCents: integer("monthly_contribution_cents").notNull(),
  expectedMonthlyRateBps: integer("expected_monthly_rate_bps").notNull(),
  referenceDate: text("reference_date").notNull(),
  ...timestampColumns(),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
  outgoingTransfers: many(transfers, { relationName: "outgoing_transfers" }),
  incomingTransfers: many(transfers, { relationName: "incoming_transfers" }),
  recurringTemplates: many(recurringTemplates),
  creditCardCharges: many(creditCardCharges),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  recurringTemplates: many(recurringTemplates),
  creditCardCharges: many(creditCardCharges),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  recurringTemplate: one(recurringTemplates, {
    fields: [transactions.recurringTemplateId],
    references: [recurringTemplates.id],
  }),
}));

export const transfersRelations = relations(transfers, ({ one }) => ({
  fromAccount: one(accounts, {
    relationName: "outgoing_transfers",
    fields: [transfers.fromAccountId],
    references: [accounts.id],
  }),
  toAccount: one(accounts, {
    relationName: "incoming_transfers",
    fields: [transfers.toAccountId],
    references: [accounts.id],
  }),
}));

export const recurringTemplatesRelations = relations(
  recurringTemplates,
  ({ one, many }) => ({
    account: one(accounts, {
      fields: [recurringTemplates.accountId],
      references: [accounts.id],
    }),
    category: one(categories, {
      fields: [recurringTemplates.categoryId],
      references: [categories.id],
    }),
    transactions: many(transactions),
  })
);

export const creditCardChargesRelations = relations(creditCardCharges, ({ one, many }) => ({
  account: one(accounts, {
    fields: [creditCardCharges.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [creditCardCharges.categoryId],
    references: [categories.id],
  }),
  installments: many(creditCardInstallments),
}));

export const creditCardInstallmentsRelations = relations(
  creditCardInstallments,
  ({ one }) => ({
    charge: one(creditCardCharges, {
      fields: [creditCardInstallments.chargeId],
      references: [creditCardCharges.id],
    }),
  })
);

export type AccountType = (typeof accountTypes)[number];
export type CategoryGroup = (typeof categoryGroups)[number];
export type TransactionType = (typeof transactionTypes)[number];
export type TransactionStatus = (typeof transactionStatuses)[number];
export type RecurringStatus = (typeof recurringStatuses)[number];
