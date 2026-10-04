import { encryptedBoolean,encryptedInteger,encryptedText } from "@/lib/db/encrypted-content";
import { encryptionChecks } from "@/lib/db/encryption-checks";
import {
sqliteTable,
text,
uniqueIndex
} from "drizzle-orm/sqlite-core";
import { timestampColumns } from "./accounts";
import { recordId } from "./columns";
import { investmentAssetClasses,investmentInstrumentTypes,investmentPurposeKinds,investmentValuationModes } from "./enums";

export const investmentPortfolio = sqliteTable(
  "investment_portfolio",
  {
    id: recordId(),
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
    id: recordId(),
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
    id: recordId(),
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
