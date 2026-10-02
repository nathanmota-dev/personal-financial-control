import { relations } from "drizzle-orm";
import {
  index,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { encryptedBoolean, encryptedInteger, encryptedText, encryptedTimestamp } from "@/lib/db/encrypted-content";
import { encryptionChecks } from "@/lib/db/encryption-checks";

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

export const investmentValuationModes = [
  "market_quote",
  "manual_balance",
  "contract_estimate",
] as const;
export const investmentPurposeKinds = ["general", "emergency_reserve"] as const;
export const investmentOperationTypes = [
  "buy",
  "sell",
  "application",
  "redemption",
  "correction",
] as const;
export const fixedIncomeSubtypes = [
  "treasury",
  "cdb",
  "lci_lca",
  "debenture",
  "other",
] as const;
export const fixedIncomeIndexers = ["pre", "cdi", "ipca", "selic", "other"] as const;
export const investmentQuoteProviders = ["manual", "brapi"] as const;
export const investmentMarketStates = ["regular", "closed", "delayed", "unknown"] as const;
export const investmentValuationSources = ["market_quote", "manual_balance"] as const;

function timestampColumns(table: string) {
  return {
    createdAt: encryptedTimestamp("created_at", `${table}.created_at`).notNull().$defaultFn(() => new Date()),
    updatedAt: encryptedTimestamp("updated_at", `${table}.updated_at`).notNull().$defaultFn(() => new Date()),
  };
}

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: encryptedText("name", "accounts.name").notNull(),
    type: encryptedText("type", "accounts.type", { enum: accountTypes }).notNull(),
    initialBalanceCents: encryptedInteger("initial_balance_cents", "accounts.initial_balance_cents").notNull(),
    creditClosingDay: encryptedInteger("credit_closing_day", "accounts.credit_closing_day"),
    creditDueDay: encryptedInteger("credit_due_day", "accounts.credit_due_day").notNull().$defaultFn(() => 10),
    isArchived: encryptedBoolean("is_archived", "accounts.is_archived").notNull().$defaultFn(() => false),
    nameHash: text("name_hash"),
    ...timestampColumns("accounts"),
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("accounts_name_unique").on(table.nameHash),
  ]
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: encryptedText("name", "categories.name").notNull(),
    group: encryptedText("group", "categories.group", { enum: categoryGroups }).notNull(),
    isArchived: encryptedBoolean("is_archived", "categories.is_archived").notNull().$defaultFn(() => false),
    nameHash: text("name_hash"),
    ...timestampColumns("categories"),
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("categories_name_unique").on(table.nameHash)]
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
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    expenseTransactionId: text("expense_transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    withdrawalTransactionId: text("withdrawal_transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
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
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    fromAccountId: text("from_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    toAccountId: text("to_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
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
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
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
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    billId: text("bill_id").references(() => creditCardBills.id, { onDelete: "set null" }),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
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
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    chargeId: text("charge_id")
      .notNull()
      .references(() => creditCardCharges.id, { onDelete: "cascade" }),
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

export const investmentPortfolio = sqliteTable(
  "investment_portfolio",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    checkpointBalanceCents: encryptedInteger("checkpoint_balance_cents", "investment_portfolio.checkpoint_balance_cents").notNull(),
    expectedMonthlyRateBps: encryptedInteger("expected_monthly_rate_bps", "investment_portfolio.expected_monthly_rate_bps").notNull(),
    checkpointDate: encryptedText("checkpoint_date", "investment_portfolio.checkpoint_date").notNull(),
    ...timestampColumns("investment_portfolio"),
  },
  (table) => [
    ...encryptionChecks(table),
  ]
);

export const investmentHoldings = sqliteTable(
  "investment_holdings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: encryptedText("name", "investment_holdings.name").notNull(),
    ticker: encryptedText("ticker", "investment_holdings.ticker"),
    institutionName: encryptedText("institution_name", "investment_holdings.institution_name"),
    assetClass: encryptedText("asset_class", "investment_holdings.asset_class", { enum: investmentAssetClasses }).notNull(),
    instrumentType: encryptedText("instrument_type", "investment_holdings.instrument_type", { enum: investmentInstrumentTypes }).notNull(),
    valuationMode: encryptedText("valuation_mode", "investment_holdings.valuation_mode", { enum: investmentValuationModes })
      .notNull()
      .$defaultFn(() => "manual_balance"),
    currency: encryptedText("currency", "investment_holdings.currency").notNull().$defaultFn(() => "BRL"),
    quoteSymbol: encryptedText("quote_symbol", "investment_holdings.quote_symbol"),
    externalProvider: encryptedText("external_provider", "investment_holdings.external_provider"),
    externalAssetId: encryptedText("external_asset_id", "investment_holdings.external_asset_id"),
    currentValueCents: encryptedInteger("current_value_cents", "investment_holdings.current_value_cents").notNull(),
    valueAsOf: encryptedText("value_as_of", "investment_holdings.value_as_of").notNull(),
    notes: encryptedText("notes", "investment_holdings.notes"),
    isArchived: encryptedBoolean("is_archived", "investment_holdings.is_archived").notNull().$defaultFn(() => false),
    activeQuoteSymbolHash: text("active_quote_symbol_hash"),
    ...timestampColumns("investment_holdings"),
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("investment_holdings_active_quote_symbol_unique").on(table.activeQuoteSymbolHash),
  ]
);

export const investmentPurposes = sqliteTable(
  "investment_purposes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: encryptedText("name", "investment_purposes.name").notNull(),
    kind: encryptedText("kind", "investment_purposes.kind", { enum: investmentPurposeKinds }).notNull().$defaultFn(() => "general"),
    targetAmountCents: encryptedInteger("target_amount_cents", "investment_purposes.target_amount_cents"),
    color: encryptedText("color", "investment_purposes.color").notNull().$defaultFn(() => "#22d3ee"),
    notes: encryptedText("notes", "investment_purposes.notes"),
    isArchived: encryptedBoolean("is_archived", "investment_purposes.is_archived").notNull().$defaultFn(() => false),
    activeEmergencyHash: text("active_emergency_hash"),
    ...timestampColumns("investment_purposes"),
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("investment_purposes_active_emergency_unique").on(table.activeEmergencyHash),
  ]
);

export const investmentOperations = sqliteTable(
  "investment_operations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    holdingId: text("holding_id")
      .notNull()
      .references(() => investmentHoldings.id, { onDelete: "restrict" }),
    type: encryptedText("type", "investment_operations.type", { enum: investmentOperationTypes }).notNull(),
    operatedOn: encryptedText("operated_on", "investment_operations.operated_on").notNull(),
    settledOn: encryptedText("settled_on", "investment_operations.settled_on"),
    quantityUnits: encryptedInteger("quantity_units", "investment_operations.quantity_units").notNull().$defaultFn(() => 0),
    unitPriceCents: encryptedInteger("unit_price_cents", "investment_operations.unit_price_cents"),
    grossAmountCents: encryptedInteger("gross_amount_cents", "investment_operations.gross_amount_cents").notNull(),
    feesCents: encryptedInteger("fees_cents", "investment_operations.fees_cents").notNull().$defaultFn(() => 0),
    targetCostCents: encryptedInteger("target_cost_cents", "investment_operations.target_cost_cents"),
    notes: encryptedText("notes", "investment_operations.notes"),
    ...timestampColumns("investment_operations"),
  },
  (table) => [
    ...encryptionChecks(table),
    index("investment_operations_holding_idx").on(table.holdingId),
  ]
);

export const investmentQuotes = sqliteTable(
  "investment_quotes",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    holdingId: text("holding_id")
      .notNull()
      .references(() => investmentHoldings.id, { onDelete: "cascade" }),
    quotedOn: encryptedText("quoted_on", "investment_quotes.quoted_on").notNull(),
    unitPriceCents: encryptedInteger("unit_price_cents", "investment_quotes.unit_price_cents").notNull(),
    source: encryptedText("source", "investment_quotes.source").notNull().$defaultFn(() => "manual"),
    provider: encryptedText("provider", "investment_quotes.provider", { enum: investmentQuoteProviders }).notNull().$defaultFn(() => "manual"),
    symbol: encryptedText("symbol", "investment_quotes.symbol"),
    currency: encryptedText("currency", "investment_quotes.currency").notNull().$defaultFn(() => "BRL"),
    quotedAt: encryptedTimestamp("quoted_at", "investment_quotes.quoted_at"),
    fetchedAt: encryptedTimestamp("fetched_at", "investment_quotes.fetched_at"),
    marketState: encryptedText("market_state", "investment_quotes.market_state", { enum: investmentMarketStates }).notNull().$defaultFn(() => "unknown"),
    isStale: encryptedBoolean("is_stale", "investment_quotes.is_stale").notNull().$defaultFn(() => false),
    quotedOnHash: text("quoted_on_hash"),
    ...timestampColumns("investment_quotes"),
  },
  (table) => [
    ...encryptionChecks(table),
    index("investment_quotes_holding_idx").on(table.holdingId),
    uniqueIndex("investment_quotes_holding_date_unique").on(table.holdingId, table.quotedOnHash),
  ]
);

export const fixedIncomeTerms = sqliteTable(
  "fixed_income_terms",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    holdingId: text("holding_id")
      .notNull()
      .unique()
      .references(() => investmentHoldings.id, { onDelete: "cascade" }),
    subtype: encryptedText("subtype", "fixed_income_terms.subtype", { enum: fixedIncomeSubtypes }).notNull(),
    issuer: encryptedText("issuer", "fixed_income_terms.issuer"),
    indexer: encryptedText("indexer", "fixed_income_terms.indexer"),
    indexerPercentageBps: encryptedInteger("indexer_percentage_bps", "fixed_income_terms.indexer_percentage_bps"),
    rateBps: encryptedInteger("rate_bps", "fixed_income_terms.rate_bps"),
    maturityDate: encryptedText("maturity_date", "fixed_income_terms.maturity_date"),
    liquidity: encryptedText("liquidity", "fixed_income_terms.liquidity"),
    ...timestampColumns("fixed_income_terms"),
  },
  (table) => encryptionChecks(table)
);

export const investmentPositionSnapshots = sqliteTable(
  "investment_position_snapshots",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    holdingId: text("holding_id").notNull().references(() => investmentHoldings.id, { onDelete: "cascade" }),
    snapshotDate: encryptedText("snapshot_date", "investment_position_snapshots.snapshot_date").notNull(),
    quantityUnits: encryptedInteger("quantity_units", "investment_position_snapshots.quantity_units").notNull().$defaultFn(() => 0),
    costCents: encryptedInteger("cost_cents", "investment_position_snapshots.cost_cents"),
    currentValueCents: encryptedInteger("current_value_cents", "investment_position_snapshots.current_value_cents").notNull(),
    unitPriceCents: encryptedInteger("unit_price_cents", "investment_position_snapshots.unit_price_cents"),
    valuationSource: encryptedText("valuation_source", "investment_position_snapshots.valuation_source", { enum: investmentValuationSources }).notNull(),
    snapshotDateHash: text("snapshot_date_hash"),
    ...timestampColumns("investment_position_snapshots"),
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("investment_position_snapshots_holding_date_unique").on(table.holdingId, table.snapshotDateHash),
    index("investment_position_snapshots_date_idx").on(table.snapshotDateHash),
  ]
);

export const investmentPortfolioSnapshots = sqliteTable(
  "investment_portfolio_snapshots",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    snapshotDate: encryptedText("snapshot_date", "investment_portfolio_snapshots.snapshot_date").notNull(),
    knownCostCents: encryptedInteger("known_cost_cents", "investment_portfolio_snapshots.known_cost_cents").notNull(),
    knownValueCents: encryptedInteger("known_value_cents", "investment_portfolio_snapshots.known_value_cents").notNull(),
    totalValueCents: encryptedInteger("total_value_cents", "investment_portfolio_snapshots.total_value_cents").notNull(),
    unrealizedResultCents: encryptedInteger("unrealized_result_cents", "investment_portfolio_snapshots.unrealized_result_cents").notNull(),
    snapshotDateHash: text("snapshot_date_hash"),
    ...timestampColumns("investment_portfolio_snapshots"),
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("investment_portfolio_snapshots_date_unique").on(table.snapshotDateHash)]
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
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    type: encryptedText("type", "investment_reduction_events.type", { enum: investmentReductionEventTypes }).notNull(),
    status: encryptedText("status", "investment_reduction_events.status", { enum: investmentReductionStatuses }).notNull().$defaultFn(() => "active"),
    transactionId: text("transaction_id").references(() => transactions.id, {
      onDelete: "set null",
    }),
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
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    eventId: text("event_id")
      .notNull()
      .references(() => investmentReductionEvents.id, { onDelete: "cascade" }),
    sourceType: encryptedText("source_type", "investment_reduction_sources.source_type", { enum: investmentReductionSourceTypes }).notNull(),
    holdingId: text("holding_id").references(() => investmentHoldings.id, {
      onDelete: "set null",
    }),
    purposeId: text("purpose_id").references(() => investmentPurposes.id, {
      onDelete: "set null",
    }),
    allocationId: text("allocation_id").references(() => investmentPurposeAllocations.id, {
      onDelete: "set null",
    }),
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

export const financialGoals = sqliteTable(
  "financial_goals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: encryptedText("name", "financial_goals.name").notNull(),
    category: encryptedText("category", "financial_goals.category", { enum: goalCategories }).notNull(),
    targetAmountCents: encryptedInteger("target_amount_cents", "financial_goals.target_amount_cents").notNull(),
    targetDate: encryptedText("target_date", "financial_goals.target_date"),
    plannedMonthlyContributionCents: encryptedInteger("planned_monthly_contribution_cents", "financial_goals.planned_monthly_contribution_cents").notNull(),
    priority: encryptedInteger("priority", "financial_goals.priority").notNull().$defaultFn(() => 1),
    status: encryptedText("status", "financial_goals.status", { enum: goalStatuses }).notNull().$defaultFn(() => "active"),
    color: encryptedText("color", "financial_goals.color").notNull().$defaultFn(() => "#38bdf8"),
    notes: encryptedText("notes", "financial_goals.notes"),
    ...timestampColumns("financial_goals"),
  },
  (table) => [
    ...encryptionChecks(table),
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
    type: encryptedText("type", "financial_goal_allocations.type", { enum: allocationTypes }).notNull(),
    amountCents: encryptedInteger("amount_cents", "financial_goal_allocations.amount_cents").notNull(),
    occurredOn: encryptedText("occurred_on", "financial_goal_allocations.occurred_on").notNull(),
    notes: encryptedText("notes", "financial_goal_allocations.notes"),
    ...timestampColumns("financial_goal_allocations"),
  },
  (table) => [
    ...encryptionChecks(table),
    index("financial_goal_allocations_goal_idx").on(table.goalId),
    index("financial_goal_allocations_transaction_idx").on(table.transactionId),
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

export const investmentHoldingsRelations = relations(investmentHoldings, ({ many, one }) => ({
  allocations: many(investmentPurposeAllocations),
  operations: many(investmentOperations),
  quotes: many(investmentQuotes),
  fixedIncomeTerms: one(fixedIncomeTerms),
}));

export const investmentOperationsRelations = relations(investmentOperations, ({ one }) => ({
  holding: one(investmentHoldings, {
    fields: [investmentOperations.holdingId],
    references: [investmentHoldings.id],
  }),
}));

export const investmentQuotesRelations = relations(investmentQuotes, ({ one }) => ({
  holding: one(investmentHoldings, {
    fields: [investmentQuotes.holdingId],
    references: [investmentHoldings.id],
  }),
}));

export const fixedIncomeTermsRelations = relations(fixedIncomeTerms, ({ one }) => ({
  holding: one(investmentHoldings, {
    fields: [fixedIncomeTerms.holdingId],
    references: [investmentHoldings.id],
  }),
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
