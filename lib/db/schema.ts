import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { encryptedMoneyColumn } from "@/lib/db/encrypted-money";

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
  "investment_withdrawal",
] as const;

export const recurringTransactionTypes = [
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

export const goalCategories = [
  "housing",
  "vehicle",
  "electronics",
  "travel",
  "education",
  "emergency",
  "other",
] as const;

export const goalStatuses = ["active", "paused", "completed", "archived"] as const;

export const allocationTypes = [
  "initial_allocation",
  "manual_allocation",
  "manual_release",
  "contribution",
  "correction",
] as const;

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
    initialBalanceCents: encryptedMoneyColumn(
      "initial_balance_cents",
      "accounts.initial_balance_cents"
    ).notNull(),
    creditClosingDay: integer("credit_closing_day"),
    creditDueDay: integer("credit_due_day").notNull().default(10),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("accounts_name_unique").on(table.name),
    check(
      "accounts_initial_balance_cents_encrypted",
      sql`typeof(${table.initialBalanceCents}) = 'text' AND ${table.initialBalanceCents} LIKE 'pfc:v1:%'`
    ),
  ]
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
    type: text("type", { enum: recurringTransactionTypes }).notNull(),
    status: text("status", { enum: recurringStatuses }).notNull().default("active"),
    amountCents: encryptedMoneyColumn("amount_cents", "recurring_templates.amount_cents").notNull(),
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
    check(
      "recurring_templates_amount_cents_encrypted",
      sql`typeof(${table.amountCents}) = 'text' AND ${table.amountCents} LIKE 'pfc:v1:%'`
    ),
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
    amountCents: encryptedMoneyColumn("amount_cents", "transactions.amount_cents").notNull(),
    transactionDate: text("transaction_date").notNull(),
    competenceMonth: text("competence_month").notNull(),
    description: text("description").notNull(),
    notes: text("notes"),
    isIncludedInInvestmentCheckpoint: integer("is_included_in_investment_checkpoint", {
      mode: "boolean",
    })
      .notNull()
      .default(true),
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
    check(
      "transactions_amount_cents_encrypted",
      sql`typeof(${table.amountCents}) = 'text' AND ${table.amountCents} LIKE 'pfc:v1:%'`
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
    amountCents: encryptedMoneyColumn("amount_cents", "transfers.amount_cents").notNull(),
    transferDate: text("transfer_date").notNull(),
    competenceMonth: text("competence_month").notNull(),
    description: text("description").notNull(),
    ...timestampColumns(),
  },
  (table) => [
    index("transfers_from_account_idx").on(table.fromAccountId),
    index("transfers_to_account_idx").on(table.toAccountId),
    index("transfers_competence_idx").on(table.competenceMonth),
    check(
      "transfers_amount_cents_encrypted",
      sql`typeof(${table.amountCents}) = 'text' AND ${table.amountCents} LIKE 'pfc:v1:%'`
    ),
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
    totalAmountCents: encryptedMoneyColumn(
      "total_amount_cents",
      "credit_card_charges.total_amount_cents"
    ).notNull(),
    installmentCount: integer("installment_count").notNull(),
    firstInvoiceMonth: text("first_invoice_month").notNull(),
    ...timestampColumns(),
  },
  (table) => [
    index("credit_card_charges_account_idx").on(table.accountId),
    index("credit_card_charges_category_idx").on(table.categoryId),
    index("credit_card_charges_purchase_date_idx").on(table.purchaseDate),
    index("credit_card_charges_first_invoice_idx").on(table.firstInvoiceMonth),
    check(
      "credit_card_charges_total_amount_cents_encrypted",
      sql`typeof(${table.totalAmountCents}) = 'text' AND ${table.totalAmountCents} LIKE 'pfc:v1:%'`
    ),
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
    amountCents: encryptedMoneyColumn(
      "amount_cents",
      "credit_card_installments.amount_cents"
    ).notNull(),
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
    check(
      "credit_card_installments_amount_cents_encrypted",
      sql`typeof(${table.amountCents}) = 'text' AND ${table.amountCents} LIKE 'pfc:v1:%'`
    ),
  ]
);

export const investmentPortfolio = sqliteTable(
  "investment_portfolio",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    checkpointBalanceCents: encryptedMoneyColumn(
      "checkpoint_balance_cents",
      "investment_portfolio.checkpoint_balance_cents"
    ).notNull(),
    expectedMonthlyRateBps: integer("expected_monthly_rate_bps").notNull(),
    checkpointDate: text("checkpoint_date").notNull(),
    ...timestampColumns(),
  },
  (table) => [
    check(
      "investment_portfolio_checkpoint_balance_cents_encrypted",
      sql`typeof(${table.checkpointBalanceCents}) = 'text' AND ${table.checkpointBalanceCents} LIKE 'pfc:v1:%'`
    ),
  ]
);

export const financialGoals = sqliteTable(
  "financial_goals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    category: text("category", { enum: goalCategories }).notNull(),
    targetAmountCents: encryptedMoneyColumn(
      "target_amount_cents",
      "financial_goals.target_amount_cents"
    ).notNull(),
    targetDate: text("target_date"),
    plannedMonthlyContributionCents: encryptedMoneyColumn(
      "planned_monthly_contribution_cents",
      "financial_goals.planned_monthly_contribution_cents"
    ).notNull(),
    priority: integer("priority").notNull().default(1),
    status: text("status", { enum: goalStatuses }).notNull().default("active"),
    color: text("color").notNull().default("#38bdf8"),
    notes: text("notes"),
    ...timestampColumns(),
  },
  (table) => [
    index("financial_goals_status_idx").on(table.status),
    index("financial_goals_priority_idx").on(table.priority),
    check(
      "financial_goals_target_amount_cents_encrypted",
      sql`typeof(${table.targetAmountCents}) = 'text' AND ${table.targetAmountCents} LIKE 'pfc:v1:%'`
    ),
    check(
      "financial_goals_planned_monthly_contribution_cents_encrypted",
      sql`typeof(${table.plannedMonthlyContributionCents}) = 'text' AND ${table.plannedMonthlyContributionCents} LIKE 'pfc:v1:%'`
    ),
  ]
);

export const financialGoalAllocations = sqliteTable(
  "financial_goal_allocations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    goalId: text("goal_id")
      .notNull()
      .references(() => financialGoals.id, { onDelete: "cascade" }),
    transactionId: text("transaction_id").references(() => transactions.id, {
      onDelete: "set null",
    }),
    type: text("type", { enum: allocationTypes }).notNull(),
    amountCents: encryptedMoneyColumn(
      "amount_cents",
      "financial_goal_allocations.amount_cents"
    ).notNull(),
    occurredOn: text("occurred_on").notNull(),
    notes: text("notes"),
    ...timestampColumns(),
  },
  (table) => [
    index("financial_goal_allocations_goal_idx").on(table.goalId),
    index("financial_goal_allocations_transaction_idx").on(table.transactionId),
    index("financial_goal_allocations_occurred_idx").on(table.occurredOn),
    check(
      "financial_goal_allocations_amount_cents_encrypted",
      sql`typeof(${table.amountCents}) = 'text' AND ${table.amountCents} LIKE 'pfc:v1:%'`
    ),
  ]
);

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

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
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
  goalAllocations: many(financialGoalAllocations),
}));

export const financialGoalsRelations = relations(financialGoals, ({ many }) => ({
  allocations: many(financialGoalAllocations),
}));

export const financialGoalAllocationsRelations = relations(
  financialGoalAllocations,
  ({ one }) => ({
    goal: one(financialGoals, {
      fields: [financialGoalAllocations.goalId],
      references: [financialGoals.id],
    }),
    transaction: one(transactions, {
      fields: [financialGoalAllocations.transactionId],
      references: [transactions.id],
    }),
  })
);

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
export type RecurringTransactionType = (typeof recurringTransactionTypes)[number];
export type TransactionStatus = (typeof transactionStatuses)[number];
export type RecurringStatus = (typeof recurringStatuses)[number];
export type GoalCategory = (typeof goalCategories)[number];
export type GoalStatus = (typeof goalStatuses)[number];
export type AllocationType = (typeof allocationTypes)[number];
