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

export const creditCardBillStatuses = ["open", "paid"] as const;

export const creditCardBillPaymentKinds = [
  "pre_statement",
  "settlement",
  "unlinked",
] as const;

export const creditCardChargeKinds = ["purchase", "adjustment"] as const;

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

export const investmentReductionEventTypes = ["withdrawal", "reconciliation"] as const;

export const investmentReductionSourceTypes = [
  "allocation",
  "holding_free",
  "not_registered",
] as const;

export const investmentReductionStatuses = ["active", "reversed"] as const;

export const transactionFundingLinkTypes = ["investment_funded_expense"] as const;

export const investmentAssetClasses = [
  "fixed_income",
  "equities",
  "funds",
  "real_estate",
  "crypto",
  "cash",
  "other",
] as const;

export const investmentInstrumentTypes = [
  "treasury",
  "cdb",
  "lci_lca",
  "debenture",
  "stock",
  "etf",
  "investment_fund",
  "real_estate_fund",
  "crypto_asset",
  "cash",
  "other",
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

export const transactionFundingLinks = sqliteTable(
  "transaction_funding_links",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    expenseTransactionId: text("expense_transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    withdrawalTransactionId: text("withdrawal_transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    type: text("type", { enum: transactionFundingLinkTypes }).notNull(),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("transaction_funding_links_expense_unique").on(table.expenseTransactionId),
    uniqueIndex("transaction_funding_links_withdrawal_unique").on(table.withdrawalTransactionId),
    index("transaction_funding_links_type_idx").on(table.type),
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
    kind: text("kind", { enum: creditCardChargeKinds }).notNull().default("purchase"),
    firstInvoiceMonth: text("first_invoice_month").notNull(),
    importFingerprint: text("import_fingerprint"),
    ...timestampColumns(),
  },
  (table) => [
    index("credit_card_charges_account_idx").on(table.accountId),
    index("credit_card_charges_category_idx").on(table.categoryId),
    index("credit_card_charges_purchase_date_idx").on(table.purchaseDate),
    index("credit_card_charges_first_invoice_idx").on(table.firstInvoiceMonth),
    uniqueIndex("credit_card_charges_import_fingerprint_unique").on(table.importFingerprint),
    check(
      "credit_card_charges_total_amount_cents_encrypted",
      sql`typeof(${table.totalAmountCents}) = 'text' AND ${table.totalAmountCents} LIKE 'pfc:v1:%'`
    ),
  ]
);

export const creditCardBills = sqliteTable(
  "credit_card_bills",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    invoiceMonth: text("invoice_month").notNull(),
    dueDate: text("due_date").notNull(),
    statementTotalCents: encryptedMoneyColumn(
      "statement_total_cents",
      "credit_card_bills.statement_total_cents"
    ).notNull(),
    currentChargesTotalCents: encryptedMoneyColumn(
      "current_charges_total_cents",
      "credit_card_bills.current_charges_total_cents"
    ).notNull(),
    priorBalanceCents: encryptedMoneyColumn(
      "prior_balance_cents",
      "credit_card_bills.prior_balance_cents"
    ).notNull(),
    preStatementPaymentsCents: encryptedMoneyColumn(
      "pre_statement_payments_cents",
      "credit_card_bills.pre_statement_payments_cents"
    ).notNull(),
    ignoredAmountCents: encryptedMoneyColumn(
      "ignored_amount_cents",
      "credit_card_bills.ignored_amount_cents"
    ).notNull(),
    status: text("status", { enum: creditCardBillStatuses }).notNull().default("open"),
    paidAt: text("paid_at"),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("credit_card_bills_account_month_unique").on(
      table.accountId,
      table.invoiceMonth
    ),
    index("credit_card_bills_account_idx").on(table.accountId),
    index("credit_card_bills_status_idx").on(table.status),
    check(
      "credit_card_bills_statement_total_cents_encrypted",
      sql`typeof(${table.statementTotalCents}) = 'text' AND ${table.statementTotalCents} LIKE 'pfc:v1:%'`
    ),
    check(
      "credit_card_bills_current_charges_total_cents_encrypted",
      sql`typeof(${table.currentChargesTotalCents}) = 'text' AND ${table.currentChargesTotalCents} LIKE 'pfc:v1:%'`
    ),
    check(
      "credit_card_bills_prior_balance_cents_encrypted",
      sql`typeof(${table.priorBalanceCents}) = 'text' AND ${table.priorBalanceCents} LIKE 'pfc:v1:%'`
    ),
    check(
      "credit_card_bills_pre_statement_payments_cents_encrypted",
      sql`typeof(${table.preStatementPaymentsCents}) = 'text' AND ${table.preStatementPaymentsCents} LIKE 'pfc:v1:%'`
    ),
    check(
      "credit_card_bills_ignored_amount_cents_encrypted",
      sql`typeof(${table.ignoredAmountCents}) = 'text' AND ${table.ignoredAmountCents} LIKE 'pfc:v1:%'`
    ),
  ]
);

export const creditCardBillPayments = sqliteTable(
  "credit_card_bill_payments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    billId: text("bill_id").references(() => creditCardBills.id, { onDelete: "set null" }),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    paymentDate: text("payment_date").notNull(),
    amountCents: encryptedMoneyColumn(
      "amount_cents",
      "credit_card_bill_payments.amount_cents"
    ).notNull(),
    kind: text("kind", { enum: creditCardBillPaymentKinds }).notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("credit_card_bill_payments_transaction_unique").on(table.transactionId),
    uniqueIndex("credit_card_bill_payments_idempotency_unique").on(table.idempotencyKey),
    index("credit_card_bill_payments_bill_idx").on(table.billId),
    index("credit_card_bill_payments_date_idx").on(table.paymentDate),
    check(
      "credit_card_bill_payments_amount_cents_encrypted",
      sql`typeof(${table.amountCents}) = 'text' AND ${table.amountCents} LIKE 'pfc:v1:%'`
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

export const investmentHoldings = sqliteTable(
  "investment_holdings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    ticker: text("ticker"),
    institutionName: text("institution_name"),
    assetClass: text("asset_class", { enum: investmentAssetClasses }).notNull(),
    instrumentType: text("instrument_type", { enum: investmentInstrumentTypes }).notNull(),
    currentValueCents: encryptedMoneyColumn(
      "current_value_cents",
      "investment_holdings.current_value_cents"
    ).notNull(),
    valueAsOf: text("value_as_of").notNull(),
    notes: text("notes"),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    ...timestampColumns(),
  },
  (table) => [
    index("investment_holdings_class_idx").on(table.assetClass),
    index("investment_holdings_archived_idx").on(table.isArchived),
    check(
      "investment_holdings_current_value_cents_encrypted",
      sql`typeof(${table.currentValueCents}) = 'text' AND ${table.currentValueCents} LIKE 'pfc:v1:%'`
    ),
  ]
);

export const investmentPurposes = sqliteTable(
  "investment_purposes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    targetAmountCents: encryptedMoneyColumn(
      "target_amount_cents",
      "investment_purposes.target_amount_cents"
    ),
    color: text("color").notNull().default("#22d3ee"),
    notes: text("notes"),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    ...timestampColumns(),
  },
  (table) => [
    index("investment_purposes_archived_idx").on(table.isArchived),
    check(
      "investment_purposes_target_amount_cents_encrypted",
      sql`${table.targetAmountCents} IS NULL OR (typeof(${table.targetAmountCents}) = 'text' AND ${table.targetAmountCents} LIKE 'pfc:v1:%')`
    ),
  ]
);

export const investmentPurposeAllocations = sqliteTable(
  "investment_purpose_allocations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    holdingId: text("holding_id")
      .notNull()
      .references(() => investmentHoldings.id, { onDelete: "restrict" }),
    purposeId: text("purpose_id")
      .notNull()
      .references(() => investmentPurposes.id, { onDelete: "restrict" }),
    amountCents: encryptedMoneyColumn(
      "amount_cents",
      "investment_purpose_allocations.amount_cents"
    ).notNull(),
    allocatedOn: text("allocated_on").notNull(),
    notes: text("notes"),
    ...timestampColumns(),
  },
  (table) => [
    index("investment_purpose_allocations_holding_idx").on(table.holdingId),
    index("investment_purpose_allocations_purpose_idx").on(table.purposeId),
    index("investment_purpose_allocations_allocated_idx").on(table.allocatedOn),
    uniqueIndex("investment_purpose_allocations_holding_purpose_unique").on(
      table.holdingId,
      table.purposeId
    ),
    check(
      "investment_purpose_allocations_amount_cents_encrypted",
      sql`typeof(${table.amountCents}) = 'text' AND ${table.amountCents} LIKE 'pfc:v1:%'`
    ),
  ]
);

export const investmentReductionEvents = sqliteTable(
  "investment_reduction_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    type: text("type", { enum: investmentReductionEventTypes }).notNull(),
    status: text("status", { enum: investmentReductionStatuses }).notNull().default("active"),
    transactionId: text("transaction_id").references(() => transactions.id, {
      onDelete: "set null",
    }),
    amountCents: encryptedMoneyColumn(
      "amount_cents",
      "investment_reduction_events.amount_cents"
    ).notNull(),
    occurredOn: text("occurred_on").notNull(),
    reversedAt: integer("reversed_at", { mode: "timestamp_ms" }),
    ...timestampColumns(),
  },
  (table) => [
    index("investment_reduction_events_transaction_idx").on(table.transactionId),
    index("investment_reduction_events_status_idx").on(table.status),
    index("investment_reduction_events_occurred_idx").on(table.occurredOn),
    check(
      "investment_reduction_events_amount_cents_encrypted",
      sql`typeof(${table.amountCents}) = 'text' AND ${table.amountCents} LIKE 'pfc:v1:%'`
    ),
  ]
);

export const investmentReductionSources = sqliteTable(
  "investment_reduction_sources",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    eventId: text("event_id")
      .notNull()
      .references(() => investmentReductionEvents.id, { onDelete: "cascade" }),
    sourceType: text("source_type", { enum: investmentReductionSourceTypes }).notNull(),
    holdingId: text("holding_id").references(() => investmentHoldings.id, {
      onDelete: "set null",
    }),
    purposeId: text("purpose_id").references(() => investmentPurposes.id, {
      onDelete: "set null",
    }),
    allocationId: text("allocation_id").references(() => investmentPurposeAllocations.id, {
      onDelete: "set null",
    }),
    amountCents: encryptedMoneyColumn(
      "amount_cents",
      "investment_reduction_sources.amount_cents"
    ).notNull(),
    ...timestampColumns(),
  },
  (table) => [
    index("investment_reduction_sources_event_idx").on(table.eventId),
    index("investment_reduction_sources_holding_idx").on(table.holdingId),
    index("investment_reduction_sources_purpose_idx").on(table.purposeId),
    index("investment_reduction_sources_allocation_idx").on(table.allocationId),
    check(
      "investment_reduction_sources_amount_cents_encrypted",
      sql`typeof(${table.amountCents}) = 'text' AND ${table.amountCents} LIKE 'pfc:v1:%'`
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
  fundingLinkAsExpense: one(transactionFundingLinks, {
    relationName: "funding_expense_transaction",
    fields: [transactions.id],
    references: [transactionFundingLinks.expenseTransactionId],
  }),
  fundingLinkAsWithdrawal: one(transactionFundingLinks, {
    relationName: "funding_withdrawal_transaction",
    fields: [transactions.id],
    references: [transactionFundingLinks.withdrawalTransactionId],
  }),
}));

export const transactionFundingLinksRelations = relations(
  transactionFundingLinks,
  ({ one }) => ({
    expenseTransaction: one(transactions, {
      relationName: "funding_expense_transaction",
      fields: [transactionFundingLinks.expenseTransactionId],
      references: [transactions.id],
    }),
    withdrawalTransaction: one(transactions, {
      relationName: "funding_withdrawal_transaction",
      fields: [transactionFundingLinks.withdrawalTransactionId],
      references: [transactions.id],
    }),
  })
);

export const financialGoalsRelations = relations(financialGoals, ({ many }) => ({
  allocations: many(financialGoalAllocations),
}));

export const investmentHoldingsRelations = relations(investmentHoldings, ({ many }) => ({
  allocations: many(investmentPurposeAllocations),
}));

export const investmentPurposesRelations = relations(investmentPurposes, ({ many }) => ({
  allocations: many(investmentPurposeAllocations),
}));

export const investmentPurposeAllocationsRelations = relations(
  investmentPurposeAllocations,
  ({ one }) => ({
    holding: one(investmentHoldings, {
      fields: [investmentPurposeAllocations.holdingId],
      references: [investmentHoldings.id],
    }),
    purpose: one(investmentPurposes, {
      fields: [investmentPurposeAllocations.purposeId],
      references: [investmentPurposes.id],
    }),
  })
);

export const investmentReductionEventsRelations = relations(
  investmentReductionEvents,
  ({ one, many }) => ({
    transaction: one(transactions, {
      fields: [investmentReductionEvents.transactionId],
      references: [transactions.id],
    }),
    sources: many(investmentReductionSources),
  })
);

export const investmentReductionSourcesRelations = relations(
  investmentReductionSources,
  ({ one }) => ({
    event: one(investmentReductionEvents, {
      fields: [investmentReductionSources.eventId],
      references: [investmentReductionEvents.id],
    }),
    holding: one(investmentHoldings, {
      fields: [investmentReductionSources.holdingId],
      references: [investmentHoldings.id],
    }),
    purpose: one(investmentPurposes, {
      fields: [investmentReductionSources.purposeId],
      references: [investmentPurposes.id],
    }),
    allocation: one(investmentPurposeAllocations, {
      fields: [investmentReductionSources.allocationId],
      references: [investmentPurposeAllocations.id],
    }),
  })
);

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

export const creditCardBillsRelations = relations(creditCardBills, ({ one, many }) => ({
  account: one(accounts, {
    fields: [creditCardBills.accountId],
    references: [accounts.id],
  }),
  payments: many(creditCardBillPayments),
}));

export const creditCardBillPaymentsRelations = relations(
  creditCardBillPayments,
  ({ one }) => ({
    bill: one(creditCardBills, {
      fields: [creditCardBillPayments.billId],
      references: [creditCardBills.id],
    }),
    transaction: one(transactions, {
      fields: [creditCardBillPayments.transactionId],
      references: [transactions.id],
    }),
  })
);

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
export type InvestmentReductionEventType = (typeof investmentReductionEventTypes)[number];
export type InvestmentReductionSourceType = (typeof investmentReductionSourceTypes)[number];
export type InvestmentReductionStatus = (typeof investmentReductionStatuses)[number];
export type TransactionFundingLinkType = (typeof transactionFundingLinkTypes)[number];
export type TransactionStatus = (typeof transactionStatuses)[number];
export type CreditCardBillStatus = (typeof creditCardBillStatuses)[number];
export type CreditCardBillPaymentKind = (typeof creditCardBillPaymentKinds)[number];
export type CreditCardChargeKind = (typeof creditCardChargeKinds)[number];
export type RecurringStatus = (typeof recurringStatuses)[number];
export type GoalCategory = (typeof goalCategories)[number];
export type GoalStatus = (typeof goalStatuses)[number];
export type AllocationType = (typeof allocationTypes)[number];
export type InvestmentAssetClass = (typeof investmentAssetClasses)[number];
export type InvestmentInstrumentType = (typeof investmentInstrumentTypes)[number];
