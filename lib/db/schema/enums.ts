import { sql } from "drizzle-orm";
import {
sqliteTable,
text
} from "drizzle-orm/sqlite-core";


export const authorizedUsers = sqliteTable("authorized_users", {
  email: text("email").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

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
