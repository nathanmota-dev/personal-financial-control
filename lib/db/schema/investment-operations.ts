import { encryptedBoolean,encryptedInteger,encryptedText,encryptedTimestamp } from "@/lib/db/encrypted-content";
import { encryptionChecks } from "@/lib/db/encryption-checks";
import {
index,
sqliteTable,
text,
uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { timestampColumns } from "./accounts";
import { recordId,referenceColumn } from "./columns";
import { fixedIncomeSubtypes,investmentMarketStates,investmentOperationTypes,investmentQuoteProviders,investmentValuationSources } from "./enums";
import { investmentHoldings } from "./investment-assets";

export const investmentOperations = sqliteTable(
  "investment_operations",
  {
    id: recordId(),
    holdingId: referenceColumn("holding_id", () => investmentHoldings.id, "restrict").notNull(),
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
    id: recordId(),
    holdingId: referenceColumn("holding_id", () => investmentHoldings.id, "cascade").notNull(),
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
    id: recordId(),
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
    id: recordId(),
    holdingId: referenceColumn("holding_id", () => investmentHoldings.id, "cascade").notNull(),
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
    id: recordId(),
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
