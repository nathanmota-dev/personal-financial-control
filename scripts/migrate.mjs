// scripts/migrate.ts
import { createClient } from "@libsql/client";

// lib/env.ts
import * as nextEnv from "@next/env";
import { z } from "zod";
var loadEnvConfig2 = nextEnv.loadEnvConfig ?? nextEnv.default.loadEnvConfig;
loadEnvConfig2(process.cwd());
var serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DEMO_MODE: z.string().optional().transform((value) => {
    if (value === void 0 || value.trim() === "") {
      return false;
    }
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
    throw new Error("DEMO_MODE must be a boolean value.");
  }),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").or(z.string().startsWith("file:")).optional(),
  TOKEN: z.string().min(1).optional(),
  TURSO_DATABASE_URL: z.string().min(1).optional(),
  TURSO_AUTH_TOKEN: z.string().min(1).optional(),
  DATA_ENCRYPTION_KEY: z.string().min(1).optional(),
  BRAPI_API_TOKEN: z.string().min(1).optional(),
  INVESTMENT_QUOTE_MIN_INTERVAL_MINUTES: z.coerce.number().int().nonnegative().default(30)
});
function getServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ")}`
    );
  }
  if (!parsed.data.DEMO_MODE && !parsed.data.DATA_ENCRYPTION_KEY) {
    throw new Error("Invalid server environment: DATA_ENCRYPTION_KEY: Required");
  }
  const url = parsed.data.DEMO_MODE ? "file::memory:" : parsed.data.DATABASE_URL ?? parsed.data.TURSO_DATABASE_URL ?? (parsed.data.NODE_ENV === "test" ? "file:./.tmp/test.db" : "file:./.local/personal-finance.db");
  const token = url.startsWith("file:") ? void 0 : parsed.data.TOKEN ?? parsed.data.TURSO_AUTH_TOKEN;
  return {
    ...parsed.data,
    DATABASE_URL: url,
    TOKEN: token
  };
}

// lib/db/migrate.ts
import { getTableColumns as getTableColumns2 } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { join } from "node:path";

// lib/category-defaults.ts
var defaultCategoryIds = {
  salary: "b0000000-0000-4000-8000-000000000101",
  housing: "b0000000-0000-4000-8000-000000000102",
  householdBills: "b0000000-0000-4000-8000-000000000103",
  food: "b0000000-0000-4000-8000-000000000104",
  transport: "b0000000-0000-4000-8000-000000000105",
  investments: "b0000000-0000-4000-8000-000000000106",
  other: "b0000000-0000-4000-8000-000000000107"
};
var defaultCategories = [
  { id: defaultCategoryIds.salary, name: "Sal\xE1rio", group: "income" },
  { id: defaultCategoryIds.housing, name: "Moradia", group: "fixed_expense" },
  {
    id: defaultCategoryIds.householdBills,
    name: "Contas da casa",
    group: "fixed_expense"
  },
  { id: defaultCategoryIds.food, name: "Alimenta\xE7\xE3o", group: "variable_expense" },
  { id: defaultCategoryIds.transport, name: "Transporte", group: "variable_expense" },
  { id: defaultCategoryIds.investments, name: "Investimentos", group: "investment" },
  { id: defaultCategoryIds.other, name: "Outros", group: "variable_expense" }
];

// lib/db/content-indexes.ts
import { getTableColumns, getTableName } from "drizzle-orm";

// lib/crypto/content.ts
import { createCipheriv as createCipheriv2, createDecipheriv as createDecipheriv2, createHmac, hkdfSync, randomBytes as randomBytes2 } from "node:crypto";

// lib/crypto/money.ts
import {
  createCipheriv,
  createDecipheriv,
  randomBytes
} from "node:crypto";
var KEY_LENGTH = 32;
var BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
var ephemeralDemoKey;
function parseEncryptionKey(encodedKey) {
  const normalized = encodedKey.trim();
  if (!BASE64_PATTERN.test(normalized)) {
    throw new Error("DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }
  const key = Buffer.from(normalized, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error("DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }
  return key;
}
function getEncryptionKey() {
  const encodedKey = process.env.DATA_ENCRYPTION_KEY;
  if (!encodedKey) {
    const demoMode = ["true", "1", "yes", "on"].includes(
      process.env.DEMO_MODE?.trim().toLowerCase() ?? ""
    );
    if (demoMode) {
      ephemeralDemoKey ??= randomBytes(KEY_LENGTH);
      return ephemeralDemoKey;
    }
    throw new Error("DATA_ENCRYPTION_KEY is required to access monetary data.");
  }
  return parseEncryptionKey(encodedKey);
}

// lib/crypto/content.ts
function derivedKey(purpose, key) {
  return Buffer.from(hkdfSync("sha256", key, "pfc:v2", purpose, 32));
}
function validate(value, type) {
  const valid = type === "text" ? typeof value === "string" : type === "boolean" ? typeof value === "boolean" : type === "timestamp" ? value instanceof Date && Number.isSafeInteger(value.getTime()) : typeof value === "number" && Number.isSafeInteger(value);
  if (!valid) throw new Error(`Invalid encrypted ${type} value.`);
}
function canonical(value, type) {
  validate(value, type);
  return JSON.stringify(type === "timestamp" ? value.getTime() : value);
}
function decode(value) {
  const bytes = Buffer.from(value, "base64url");
  if (bytes.toString("base64url") !== value) throw new Error("Malformed encrypted content.");
  return bytes;
}
function encryptContent(value, context, type, key = getEncryptionKey()) {
  const plaintext = canonical(value, type);
  const nonce = randomBytes2(12);
  const cipher = createCipheriv2("aes-256-gcm", derivedKey("content", key), nonce);
  cipher.setAAD(Buffer.from(JSON.stringify(["pfc:v2", context, type])));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return ["pfc", "v2", nonce.toString("base64url"), ciphertext.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(":");
}
function decryptContent(payload, context, type, key = getEncryptionKey()) {
  if (typeof payload !== "string") throw new Error("Malformed encrypted content.");
  const parts = payload.split(":");
  if (parts.length !== 5 || parts[0] !== "pfc" || parts[1] !== "v2") throw new Error("Malformed encrypted content.");
  const [nonce, ciphertext, tag] = parts.slice(2).map(decode);
  if (nonce.length !== 12 || tag.length !== 16 || !ciphertext.length) throw new Error("Malformed encrypted content.");
  try {
    const decipher = createDecipheriv2("aes-256-gcm", derivedKey("content", key), nonce);
    decipher.setAAD(Buffer.from(JSON.stringify(["pfc:v2", context, type])));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(plaintext);
    const value = type === "timestamp" ? new Date(parsed) : parsed;
    validate(value, type);
    if (canonical(value, type) !== plaintext) throw new Error("Invalid encrypted content.");
    return value;
  } catch {
    throw new Error(`Encrypted content could not be authenticated: ${context} (${type}).`);
  }
}
function contentIndex(values, context, key = getEncryptionKey()) {
  return createHmac("sha256", derivedKey("indexes", key)).update(JSON.stringify(["pfc:v2", context, values])).digest("hex");
}

// lib/db/content-indexes.ts
function withContentIndexes(table, values, defaults = false) {
  const columns = getTableColumns(table);
  const row = { ...values };
  if (defaults) for (const [key, column2] of Object.entries(columns)) {
    if (row[key] === void 0 && column2.defaultFn) row[key] = column2.defaultFn();
  }
  const tableName = getTableName(table);
  for (const [key, column2] of Object.entries(columns)) {
    if (!column2.name.endsWith("_hash")) continue;
    if (key === "activeQuoteSymbolHash") row[key] = !row.isArchived && row.quoteSymbol != null ? contentIndex([row.quoteSymbol.trim().toUpperCase()], `${tableName}.active_quote_symbol`) : null;
    else if (key === "activeEmergencyHash") row[key] = !row.isArchived && row.kind === "emergency_reserve" ? contentIndex(["emergency_reserve"], `${tableName}.active_emergency`) : null;
    else {
      const source = column2.name.slice(0, -5);
      const property = Object.entries(columns).find(([, item]) => item.name === source)?.[0];
      if (!property) throw new Error(`Invalid content index ${tableName}.${column2.name}`);
      row[key] = row[property] == null ? null : contentIndex([row[property]], `${tableName}.${source}`);
    }
  }
  return row;
}

// lib/db/schema.ts
import { relations } from "drizzle-orm";
import {
  index,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

// lib/db/encrypted-content.ts
import { customType } from "drizzle-orm/sqlite-core";
function column(name, context, type) {
  return customType({
    dataType: () => "text",
    toDriver: (value) => encryptContent(value, context, type),
    fromDriver: (value) => decryptContent(value, context, type)
  })(name);
}
function encryptedText(name, context, options) {
  void options;
  return column(name, context, "text");
}
function encryptedInteger(name, context) {
  return column(name, context, "integer");
}
function encryptedBoolean(name, context) {
  return column(name, context, "boolean");
}
function encryptedTimestamp(name, context) {
  return column(name, context, "timestamp");
}

// lib/db/encryption-checks.ts
import { getTableName as getTableName2, sql } from "drizzle-orm";
import { check } from "drizzle-orm/sqlite-core";

// lib/db/encryption-indexes.json
var encryption_indexes_default = {
  accounts: [
    "name"
  ],
  categories: [
    "name"
  ],
  transactions: [
    "import_fingerprint",
    "competence_month"
  ],
  credit_card_charges: [
    "import_fingerprint"
  ],
  credit_card_bills: [
    "invoice_month"
  ],
  credit_card_bill_payments: [
    "idempotency_key"
  ],
  credit_card_installments: [
    "installment_number"
  ],
  investment_quotes: [
    "quoted_on"
  ],
  investment_position_snapshots: [
    "snapshot_date"
  ],
  investment_portfolio_snapshots: [
    "snapshot_date"
  ]
};

// lib/db/encryption-inventory.json
var encryption_inventory_default = {
  accounts: {
    id: "technical",
    name: "text",
    type: "text",
    initial_balance_cents: "integer",
    credit_closing_day: "integer",
    credit_due_day: "integer",
    is_archived: "boolean",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  categories: {
    id: "technical",
    name: "text",
    group: "text",
    is_archived: "boolean",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  recurring_templates: {
    id: "technical",
    account_id: "technical",
    category_id: "technical",
    type: "text",
    status: "text",
    amount_cents: "integer",
    day_of_month: "integer",
    start_month: "text",
    end_month: "text",
    last_generated_month: "text",
    description: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  transactions: {
    id: "technical",
    account_id: "technical",
    category_id: "technical",
    recurring_template_id: "technical",
    type: "text",
    status: "text",
    amount_cents: "integer",
    transaction_date: "text",
    competence_month: "text",
    description: "text",
    notes: "text",
    import_fingerprint: "text",
    is_included_in_investment_checkpoint: "boolean",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  transaction_funding_links: {
    id: "technical",
    expense_transaction_id: "technical",
    withdrawal_transaction_id: "technical",
    type: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  transfers: {
    id: "technical",
    from_account_id: "technical",
    to_account_id: "technical",
    amount_cents: "integer",
    transfer_date: "text",
    competence_month: "text",
    description: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  credit_card_charges: {
    id: "technical",
    account_id: "technical",
    category_id: "technical",
    description: "text",
    notes: "text",
    purchase_date: "text",
    total_amount_cents: "integer",
    installment_count: "integer",
    kind: "text",
    first_invoice_month: "text",
    import_fingerprint: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  credit_card_bills: {
    id: "technical",
    account_id: "technical",
    invoice_month: "text",
    due_date: "text",
    statement_total_cents: "integer",
    current_charges_total_cents: "integer",
    prior_balance_cents: "integer",
    pre_statement_payments_cents: "integer",
    ignored_amount_cents: "integer",
    status: "text",
    paid_at: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  credit_card_bill_payments: {
    id: "technical",
    bill_id: "technical",
    transaction_id: "technical",
    payment_date: "text",
    amount_cents: "integer",
    kind: "text",
    idempotency_key: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  credit_card_installments: {
    id: "technical",
    charge_id: "technical",
    installment_number: "integer",
    amount_cents: "integer",
    invoice_month: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  investment_portfolio: {
    id: "technical",
    checkpoint_balance_cents: "integer",
    expected_monthly_rate_bps: "integer",
    checkpoint_date: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  investment_holdings: {
    id: "technical",
    name: "text",
    ticker: "text",
    institution_name: "text",
    asset_class: "text",
    instrument_type: "text",
    valuation_mode: "text",
    currency: "text",
    quote_symbol: "text",
    external_provider: "text",
    external_asset_id: "text",
    current_value_cents: "integer",
    value_as_of: "text",
    notes: "text",
    is_archived: "boolean",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  investment_purposes: {
    id: "technical",
    name: "text",
    kind: "text",
    target_amount_cents: "integer",
    color: "text",
    notes: "text",
    is_archived: "boolean",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  investment_operations: {
    id: "technical",
    holding_id: "technical",
    type: "text",
    operated_on: "text",
    settled_on: "text",
    quantity_units: "integer",
    unit_price_cents: "integer",
    gross_amount_cents: "integer",
    fees_cents: "integer",
    target_cost_cents: "integer",
    notes: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  investment_quotes: {
    id: "technical",
    holding_id: "technical",
    quoted_on: "text",
    unit_price_cents: "integer",
    source: "text",
    provider: "text",
    symbol: "text",
    currency: "text",
    quoted_at: "timestamp",
    fetched_at: "timestamp",
    market_state: "text",
    is_stale: "boolean",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  fixed_income_terms: {
    id: "technical",
    holding_id: "technical",
    subtype: "text",
    issuer: "text",
    indexer: "text",
    indexer_percentage_bps: "integer",
    rate_bps: "integer",
    maturity_date: "text",
    liquidity: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  investment_position_snapshots: {
    id: "technical",
    holding_id: "technical",
    snapshot_date: "text",
    quantity_units: "integer",
    cost_cents: "integer",
    current_value_cents: "integer",
    unit_price_cents: "integer",
    valuation_source: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  investment_portfolio_snapshots: {
    id: "technical",
    snapshot_date: "text",
    known_cost_cents: "integer",
    known_value_cents: "integer",
    total_value_cents: "integer",
    unrealized_result_cents: "integer",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  investment_purpose_allocations: {
    id: "technical",
    holding_id: "technical",
    purpose_id: "technical",
    amount_cents: "integer",
    allocated_on: "text",
    notes: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  investment_reduction_events: {
    id: "technical",
    type: "text",
    status: "text",
    transaction_id: "technical",
    amount_cents: "integer",
    occurred_on: "text",
    reversed_at: "timestamp",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  investment_reduction_sources: {
    id: "technical",
    event_id: "technical",
    source_type: "text",
    holding_id: "technical",
    purpose_id: "technical",
    allocation_id: "technical",
    amount_cents: "integer",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  financial_goals: {
    id: "technical",
    name: "text",
    category: "text",
    target_amount_cents: "integer",
    target_date: "text",
    planned_monthly_contribution_cents: "integer",
    priority: "integer",
    status: "text",
    color: "text",
    notes: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  financial_goal_allocations: {
    id: "technical",
    goal_id: "technical",
    transaction_id: "technical",
    type: "text",
    amount_cents: "integer",
    occurred_on: "text",
    notes: "text",
    created_at: "timestamp",
    updated_at: "timestamp"
  }
};

// lib/db/encryption-checks.ts
function encryptionChecks(columns) {
  const name = getTableName2(Object.values(columns)[0].table);
  const classified = encryption_inventory_default[name];
  if (!classified) throw new Error(`Unclassified business table: ${name}`);
  const actual = new Set(Object.values(columns).map((column2) => column2.name));
  for (const column2 of Object.keys(classified)) {
    if (!actual.has(column2)) throw new Error(`Missing classified column: ${name}.${column2}`);
  }
  return Object.values(columns).flatMap((column2) => {
    if (column2.name.endsWith("_hash")) {
      const sources = encryption_indexes_default[name] ?? [];
      const source = column2.name.slice(0, -5);
      const conditional = name === "investment_holdings" && column2.name === "active_quote_symbol_hash" || name === "investment_purposes" && column2.name === "active_emergency_hash";
      if (!sources.includes(source) && !conditional) throw new Error(`Unclassified technical index: ${name}.${column2.name}`);
      const rules = [check(`${name}_${column2.name}_valid`, sql`${column2} IS NULL OR (length(${column2}) = 64 AND ${column2} NOT GLOB '*[^0-9a-f]*')`)];
      const business = Object.values(columns).find((item) => item.name === source);
      if (business) rules.push(check(`${name}_${column2.name}_present`, sql`(${business} IS NULL) = (${column2} IS NULL)`));
      return rules;
    }
    const type = classified[column2.name];
    if (!type) throw new Error(`Unclassified business column: ${name}.${column2.name}`);
    if (type === "technical") return [];
    return [check(`${name}_${column2.name}_encrypted`, sql`${column2} IS NULL OR (typeof(${column2}) = 'text' AND ${column2} LIKE 'pfc:v2:%')`)];
  });
}

// lib/db/schema.ts
var accountTypes = [
  "checking",
  "savings",
  "cash",
  "credit",
  "investment"
];
var categoryGroups = [
  "income",
  "fixed_expense",
  "variable_expense",
  "investment"
];
var transactionTypes = [
  "income",
  "expense",
  "investment_contribution",
  "investment_withdrawal"
];
var recurringTransactionTypes = [
  "income",
  "expense",
  "investment_contribution"
];
var transactionStatuses = [
  "pending",
  "posted",
  "cancelled"
];
var creditCardBillStatuses = ["open", "paid"];
var creditCardBillPaymentKinds = [
  "pre_statement",
  "settlement",
  "unlinked"
];
var creditCardChargeKinds = ["purchase", "adjustment"];
var recurringStatuses = ["active", "paused", "ended"];
var goalCategories = [
  "housing",
  "vehicle",
  "electronics",
  "travel",
  "education",
  "emergency",
  "other"
];
var goalStatuses = ["active", "paused", "completed", "archived"];
var allocationTypes = [
  "initial_allocation",
  "manual_allocation",
  "manual_release",
  "contribution",
  "correction"
];
var investmentReductionEventTypes = ["withdrawal", "reconciliation"];
var investmentReductionSourceTypes = [
  "allocation",
  "holding_free",
  "not_registered"
];
var investmentReductionStatuses = ["active", "reversed"];
var transactionFundingLinkTypes = ["investment_funded_expense"];
var investmentAssetClasses = [
  "fixed_income",
  "equities",
  "funds",
  "real_estate",
  "crypto",
  "cash",
  "other"
];
var investmentInstrumentTypes = [
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
  "other"
];
var investmentValuationModes = [
  "market_quote",
  "manual_balance",
  "contract_estimate"
];
var investmentPurposeKinds = ["general", "emergency_reserve"];
var investmentOperationTypes = [
  "buy",
  "sell",
  "application",
  "redemption",
  "correction"
];
var fixedIncomeSubtypes = [
  "treasury",
  "cdb",
  "lci_lca",
  "debenture",
  "other"
];
var investmentQuoteProviders = ["manual", "brapi"];
var investmentMarketStates = ["regular", "closed", "delayed", "unknown"];
var investmentValuationSources = ["market_quote", "manual_balance"];
function timestampColumns(table) {
  return {
    createdAt: encryptedTimestamp("created_at", `${table}.created_at`).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: encryptedTimestamp("updated_at", `${table}.updated_at`).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
  };
}
var accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: encryptedText("name", "accounts.name").notNull(),
    type: encryptedText("type", "accounts.type", { enum: accountTypes }).notNull(),
    initialBalanceCents: encryptedInteger("initial_balance_cents", "accounts.initial_balance_cents").notNull(),
    creditClosingDay: encryptedInteger("credit_closing_day", "accounts.credit_closing_day"),
    creditDueDay: encryptedInteger("credit_due_day", "accounts.credit_due_day").notNull().$defaultFn(() => 10),
    isArchived: encryptedBoolean("is_archived", "accounts.is_archived").notNull().$defaultFn(() => false),
    nameHash: text("name_hash"),
    ...timestampColumns("accounts")
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("accounts_name_unique").on(table.nameHash)
  ]
);
var categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: encryptedText("name", "categories.name").notNull(),
    group: encryptedText("group", "categories.group", { enum: categoryGroups }).notNull(),
    isArchived: encryptedBoolean("is_archived", "categories.is_archived").notNull().$defaultFn(() => false),
    nameHash: text("name_hash"),
    ...timestampColumns("categories")
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("categories_name_unique").on(table.nameHash)
  ]
);
var recurringTemplates = sqliteTable(
  "recurring_templates",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
    type: encryptedText("type", "recurring_templates.type", { enum: recurringTransactionTypes }).notNull(),
    status: encryptedText("status", "recurring_templates.status", { enum: recurringStatuses }).notNull().$defaultFn(() => "active"),
    amountCents: encryptedInteger("amount_cents", "recurring_templates.amount_cents").notNull(),
    dayOfMonth: encryptedInteger("day_of_month", "recurring_templates.day_of_month").notNull(),
    startMonth: encryptedText("start_month", "recurring_templates.start_month").notNull(),
    endMonth: encryptedText("end_month", "recurring_templates.end_month"),
    lastGeneratedMonth: encryptedText("last_generated_month", "recurring_templates.last_generated_month"),
    description: encryptedText("description", "recurring_templates.description").notNull(),
    ...timestampColumns("recurring_templates")
  },
  (table) => [
    ...encryptionChecks(table),
    index("recurring_templates_account_idx").on(table.accountId),
    index("recurring_templates_category_idx").on(table.categoryId)
  ]
);
var transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "restrict" }),
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
    isIncludedInInvestmentCheckpoint: encryptedBoolean("is_included_in_investment_checkpoint", "transactions.is_included_in_investment_checkpoint").notNull().$defaultFn(() => true),
    importFingerprintHash: text("import_fingerprint_hash"),
    competenceMonthHash: text("competence_month_hash"),
    ...timestampColumns("transactions")
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
    )
  ]
);
var transactionFundingLinks = sqliteTable(
  "transaction_funding_links",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    expenseTransactionId: text("expense_transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
    withdrawalTransactionId: text("withdrawal_transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
    type: encryptedText("type", "transaction_funding_links.type", { enum: transactionFundingLinkTypes }).notNull(),
    ...timestampColumns("transaction_funding_links")
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("transaction_funding_links_expense_unique").on(table.expenseTransactionId),
    uniqueIndex("transaction_funding_links_withdrawal_unique").on(table.withdrawalTransactionId)
  ]
);
var transfers = sqliteTable(
  "transfers",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    fromAccountId: text("from_account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
    toAccountId: text("to_account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
    amountCents: encryptedInteger("amount_cents", "transfers.amount_cents").notNull(),
    transferDate: encryptedText("transfer_date", "transfers.transfer_date").notNull(),
    competenceMonth: encryptedText("competence_month", "transfers.competence_month").notNull(),
    description: encryptedText("description", "transfers.description").notNull(),
    ...timestampColumns("transfers")
  },
  (table) => [
    ...encryptionChecks(table),
    index("transfers_from_account_idx").on(table.fromAccountId),
    index("transfers_to_account_idx").on(table.toAccountId)
  ]
);
var creditCardCharges = sqliteTable(
  "credit_card_charges",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
    description: encryptedText("description", "credit_card_charges.description").notNull(),
    notes: encryptedText("notes", "credit_card_charges.notes"),
    purchaseDate: encryptedText("purchase_date", "credit_card_charges.purchase_date").notNull(),
    totalAmountCents: encryptedInteger("total_amount_cents", "credit_card_charges.total_amount_cents").notNull(),
    installmentCount: encryptedInteger("installment_count", "credit_card_charges.installment_count").notNull(),
    kind: encryptedText("kind", "credit_card_charges.kind", { enum: creditCardChargeKinds }).notNull().$defaultFn(() => "purchase"),
    firstInvoiceMonth: encryptedText("first_invoice_month", "credit_card_charges.first_invoice_month").notNull(),
    importFingerprint: encryptedText("import_fingerprint", "credit_card_charges.import_fingerprint"),
    importFingerprintHash: text("import_fingerprint_hash"),
    ...timestampColumns("credit_card_charges")
  },
  (table) => [
    ...encryptionChecks(table),
    index("credit_card_charges_account_idx").on(table.accountId),
    index("credit_card_charges_category_idx").on(table.categoryId),
    uniqueIndex("credit_card_charges_import_fingerprint_unique").on(table.importFingerprintHash)
  ]
);
var creditCardBills = sqliteTable(
  "credit_card_bills",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
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
    ...timestampColumns("credit_card_bills")
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("credit_card_bills_account_month_unique").on(
      table.accountId,
      table.invoiceMonthHash
    ),
    index("credit_card_bills_account_idx").on(table.accountId)
  ]
);
var creditCardBillPayments = sqliteTable(
  "credit_card_bill_payments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    billId: text("bill_id").references(() => creditCardBills.id, { onDelete: "set null" }),
    transactionId: text("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
    paymentDate: encryptedText("payment_date", "credit_card_bill_payments.payment_date").notNull(),
    amountCents: encryptedInteger("amount_cents", "credit_card_bill_payments.amount_cents").notNull(),
    kind: encryptedText("kind", "credit_card_bill_payments.kind", { enum: creditCardBillPaymentKinds }).notNull(),
    idempotencyKey: encryptedText("idempotency_key", "credit_card_bill_payments.idempotency_key").notNull(),
    idempotencyKeyHash: text("idempotency_key_hash"),
    ...timestampColumns("credit_card_bill_payments")
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("credit_card_bill_payments_transaction_unique").on(table.transactionId),
    uniqueIndex("credit_card_bill_payments_idempotency_unique").on(table.idempotencyKeyHash),
    index("credit_card_bill_payments_bill_idx").on(table.billId)
  ]
);
var creditCardInstallments = sqliteTable(
  "credit_card_installments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    chargeId: text("charge_id").notNull().references(() => creditCardCharges.id, { onDelete: "cascade" }),
    installmentNumber: encryptedInteger("installment_number", "credit_card_installments.installment_number").notNull(),
    amountCents: encryptedInteger("amount_cents", "credit_card_installments.amount_cents").notNull(),
    invoiceMonth: encryptedText("invoice_month", "credit_card_installments.invoice_month").notNull(),
    installmentNumberHash: text("installment_number_hash"),
    ...timestampColumns("credit_card_installments")
  },
  (table) => [
    ...encryptionChecks(table),
    index("credit_card_installments_charge_idx").on(table.chargeId),
    uniqueIndex("credit_card_installments_charge_number_unique").on(
      table.chargeId,
      table.installmentNumberHash
    )
  ]
);
var investmentPortfolio = sqliteTable(
  "investment_portfolio",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    checkpointBalanceCents: encryptedInteger("checkpoint_balance_cents", "investment_portfolio.checkpoint_balance_cents").notNull(),
    expectedMonthlyRateBps: encryptedInteger("expected_monthly_rate_bps", "investment_portfolio.expected_monthly_rate_bps").notNull(),
    checkpointDate: encryptedText("checkpoint_date", "investment_portfolio.checkpoint_date").notNull(),
    ...timestampColumns("investment_portfolio")
  },
  (table) => [
    ...encryptionChecks(table)
  ]
);
var investmentHoldings = sqliteTable(
  "investment_holdings",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: encryptedText("name", "investment_holdings.name").notNull(),
    ticker: encryptedText("ticker", "investment_holdings.ticker"),
    institutionName: encryptedText("institution_name", "investment_holdings.institution_name"),
    assetClass: encryptedText("asset_class", "investment_holdings.asset_class", { enum: investmentAssetClasses }).notNull(),
    instrumentType: encryptedText("instrument_type", "investment_holdings.instrument_type", { enum: investmentInstrumentTypes }).notNull(),
    valuationMode: encryptedText("valuation_mode", "investment_holdings.valuation_mode", { enum: investmentValuationModes }).notNull().$defaultFn(() => "manual_balance"),
    currency: encryptedText("currency", "investment_holdings.currency").notNull().$defaultFn(() => "BRL"),
    quoteSymbol: encryptedText("quote_symbol", "investment_holdings.quote_symbol"),
    externalProvider: encryptedText("external_provider", "investment_holdings.external_provider"),
    externalAssetId: encryptedText("external_asset_id", "investment_holdings.external_asset_id"),
    currentValueCents: encryptedInteger("current_value_cents", "investment_holdings.current_value_cents").notNull(),
    valueAsOf: encryptedText("value_as_of", "investment_holdings.value_as_of").notNull(),
    notes: encryptedText("notes", "investment_holdings.notes"),
    isArchived: encryptedBoolean("is_archived", "investment_holdings.is_archived").notNull().$defaultFn(() => false),
    activeQuoteSymbolHash: text("active_quote_symbol_hash"),
    ...timestampColumns("investment_holdings")
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("investment_holdings_active_quote_symbol_unique").on(table.activeQuoteSymbolHash)
  ]
);
var investmentPurposes = sqliteTable(
  "investment_purposes",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: encryptedText("name", "investment_purposes.name").notNull(),
    kind: encryptedText("kind", "investment_purposes.kind", { enum: investmentPurposeKinds }).notNull().$defaultFn(() => "general"),
    targetAmountCents: encryptedInteger("target_amount_cents", "investment_purposes.target_amount_cents"),
    color: encryptedText("color", "investment_purposes.color").notNull().$defaultFn(() => "#22d3ee"),
    notes: encryptedText("notes", "investment_purposes.notes"),
    isArchived: encryptedBoolean("is_archived", "investment_purposes.is_archived").notNull().$defaultFn(() => false),
    activeEmergencyHash: text("active_emergency_hash"),
    ...timestampColumns("investment_purposes")
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("investment_purposes_active_emergency_unique").on(table.activeEmergencyHash)
  ]
);
var investmentOperations = sqliteTable(
  "investment_operations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    holdingId: text("holding_id").notNull().references(() => investmentHoldings.id, { onDelete: "restrict" }),
    type: encryptedText("type", "investment_operations.type", { enum: investmentOperationTypes }).notNull(),
    operatedOn: encryptedText("operated_on", "investment_operations.operated_on").notNull(),
    settledOn: encryptedText("settled_on", "investment_operations.settled_on"),
    quantityUnits: encryptedInteger("quantity_units", "investment_operations.quantity_units").notNull().$defaultFn(() => 0),
    unitPriceCents: encryptedInteger("unit_price_cents", "investment_operations.unit_price_cents"),
    grossAmountCents: encryptedInteger("gross_amount_cents", "investment_operations.gross_amount_cents").notNull(),
    feesCents: encryptedInteger("fees_cents", "investment_operations.fees_cents").notNull().$defaultFn(() => 0),
    targetCostCents: encryptedInteger("target_cost_cents", "investment_operations.target_cost_cents"),
    notes: encryptedText("notes", "investment_operations.notes"),
    ...timestampColumns("investment_operations")
  },
  (table) => [
    ...encryptionChecks(table),
    index("investment_operations_holding_idx").on(table.holdingId)
  ]
);
var investmentQuotes = sqliteTable(
  "investment_quotes",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    holdingId: text("holding_id").notNull().references(() => investmentHoldings.id, { onDelete: "cascade" }),
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
    ...timestampColumns("investment_quotes")
  },
  (table) => [
    ...encryptionChecks(table),
    index("investment_quotes_holding_idx").on(table.holdingId),
    uniqueIndex("investment_quotes_holding_date_unique").on(table.holdingId, table.quotedOnHash)
  ]
);
var fixedIncomeTerms = sqliteTable(
  "fixed_income_terms",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    holdingId: text("holding_id").notNull().unique().references(() => investmentHoldings.id, { onDelete: "cascade" }),
    subtype: encryptedText("subtype", "fixed_income_terms.subtype", { enum: fixedIncomeSubtypes }).notNull(),
    issuer: encryptedText("issuer", "fixed_income_terms.issuer"),
    indexer: encryptedText("indexer", "fixed_income_terms.indexer"),
    indexerPercentageBps: encryptedInteger("indexer_percentage_bps", "fixed_income_terms.indexer_percentage_bps"),
    rateBps: encryptedInteger("rate_bps", "fixed_income_terms.rate_bps"),
    maturityDate: encryptedText("maturity_date", "fixed_income_terms.maturity_date"),
    liquidity: encryptedText("liquidity", "fixed_income_terms.liquidity"),
    ...timestampColumns("fixed_income_terms")
  },
  (table) => encryptionChecks(table)
);
var investmentPositionSnapshots = sqliteTable(
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
    ...timestampColumns("investment_position_snapshots")
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("investment_position_snapshots_holding_date_unique").on(table.holdingId, table.snapshotDateHash),
    index("investment_position_snapshots_date_idx").on(table.snapshotDateHash)
  ]
);
var investmentPortfolioSnapshots = sqliteTable(
  "investment_portfolio_snapshots",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    snapshotDate: encryptedText("snapshot_date", "investment_portfolio_snapshots.snapshot_date").notNull(),
    knownCostCents: encryptedInteger("known_cost_cents", "investment_portfolio_snapshots.known_cost_cents").notNull(),
    knownValueCents: encryptedInteger("known_value_cents", "investment_portfolio_snapshots.known_value_cents").notNull(),
    totalValueCents: encryptedInteger("total_value_cents", "investment_portfolio_snapshots.total_value_cents").notNull(),
    unrealizedResultCents: encryptedInteger("unrealized_result_cents", "investment_portfolio_snapshots.unrealized_result_cents").notNull(),
    snapshotDateHash: text("snapshot_date_hash"),
    ...timestampColumns("investment_portfolio_snapshots")
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("investment_portfolio_snapshots_date_unique").on(table.snapshotDateHash)
  ]
);
var investmentPurposeAllocations = sqliteTable(
  "investment_purpose_allocations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    holdingId: text("holding_id").notNull().references(() => investmentHoldings.id, { onDelete: "restrict" }),
    purposeId: text("purpose_id").notNull().references(() => investmentPurposes.id, { onDelete: "restrict" }),
    amountCents: encryptedInteger("amount_cents", "investment_purpose_allocations.amount_cents").notNull(),
    allocatedOn: encryptedText("allocated_on", "investment_purpose_allocations.allocated_on").notNull(),
    notes: encryptedText("notes", "investment_purpose_allocations.notes"),
    ...timestampColumns("investment_purpose_allocations")
  },
  (table) => [
    ...encryptionChecks(table),
    index("investment_purpose_allocations_holding_idx").on(table.holdingId),
    index("investment_purpose_allocations_purpose_idx").on(table.purposeId),
    uniqueIndex("investment_purpose_allocations_holding_purpose_unique").on(
      table.holdingId,
      table.purposeId
    )
  ]
);
var investmentReductionEvents = sqliteTable(
  "investment_reduction_events",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    type: encryptedText("type", "investment_reduction_events.type", { enum: investmentReductionEventTypes }).notNull(),
    status: encryptedText("status", "investment_reduction_events.status", { enum: investmentReductionStatuses }).notNull().$defaultFn(() => "active"),
    transactionId: text("transaction_id").references(() => transactions.id, {
      onDelete: "set null"
    }),
    amountCents: encryptedInteger("amount_cents", "investment_reduction_events.amount_cents").notNull(),
    occurredOn: encryptedText("occurred_on", "investment_reduction_events.occurred_on").notNull(),
    reversedAt: encryptedTimestamp("reversed_at", "investment_reduction_events.reversed_at"),
    ...timestampColumns("investment_reduction_events")
  },
  (table) => [
    ...encryptionChecks(table),
    index("investment_reduction_events_transaction_idx").on(table.transactionId)
  ]
);
var investmentReductionSources = sqliteTable(
  "investment_reduction_sources",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    eventId: text("event_id").notNull().references(() => investmentReductionEvents.id, { onDelete: "cascade" }),
    sourceType: encryptedText("source_type", "investment_reduction_sources.source_type", { enum: investmentReductionSourceTypes }).notNull(),
    holdingId: text("holding_id").references(() => investmentHoldings.id, {
      onDelete: "set null"
    }),
    purposeId: text("purpose_id").references(() => investmentPurposes.id, {
      onDelete: "set null"
    }),
    allocationId: text("allocation_id").references(() => investmentPurposeAllocations.id, {
      onDelete: "set null"
    }),
    amountCents: encryptedInteger("amount_cents", "investment_reduction_sources.amount_cents").notNull(),
    ...timestampColumns("investment_reduction_sources")
  },
  (table) => [
    ...encryptionChecks(table),
    index("investment_reduction_sources_event_idx").on(table.eventId),
    index("investment_reduction_sources_holding_idx").on(table.holdingId),
    index("investment_reduction_sources_purpose_idx").on(table.purposeId),
    index("investment_reduction_sources_allocation_idx").on(table.allocationId)
  ]
);
var financialGoals = sqliteTable(
  "financial_goals",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: encryptedText("name", "financial_goals.name").notNull(),
    category: encryptedText("category", "financial_goals.category", { enum: goalCategories }).notNull(),
    targetAmountCents: encryptedInteger("target_amount_cents", "financial_goals.target_amount_cents").notNull(),
    targetDate: encryptedText("target_date", "financial_goals.target_date"),
    plannedMonthlyContributionCents: encryptedInteger("planned_monthly_contribution_cents", "financial_goals.planned_monthly_contribution_cents").notNull(),
    priority: encryptedInteger("priority", "financial_goals.priority").notNull().$defaultFn(() => 1),
    status: encryptedText("status", "financial_goals.status", { enum: goalStatuses }).notNull().$defaultFn(() => "active"),
    color: encryptedText("color", "financial_goals.color").notNull().$defaultFn(() => "#38bdf8"),
    notes: encryptedText("notes", "financial_goals.notes"),
    ...timestampColumns("financial_goals")
  },
  (table) => [
    ...encryptionChecks(table)
  ]
);
var financialGoalAllocations = sqliteTable(
  "financial_goal_allocations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    goalId: text("goal_id").notNull().references(() => financialGoals.id, { onDelete: "cascade" }),
    transactionId: text("transaction_id").references(() => transactions.id, {
      onDelete: "set null"
    }),
    type: encryptedText("type", "financial_goal_allocations.type", { enum: allocationTypes }).notNull(),
    amountCents: encryptedInteger("amount_cents", "financial_goal_allocations.amount_cents").notNull(),
    occurredOn: encryptedText("occurred_on", "financial_goal_allocations.occurred_on").notNull(),
    notes: encryptedText("notes", "financial_goal_allocations.notes"),
    ...timestampColumns("financial_goal_allocations")
  },
  (table) => [
    ...encryptionChecks(table),
    index("financial_goal_allocations_goal_idx").on(table.goalId),
    index("financial_goal_allocations_transaction_idx").on(table.transactionId)
  ]
);
var accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
  outgoingTransfers: many(transfers, { relationName: "outgoing_transfers" }),
  incomingTransfers: many(transfers, { relationName: "incoming_transfers" }),
  recurringTemplates: many(recurringTemplates),
  creditCardCharges: many(creditCardCharges)
}));
var categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  recurringTemplates: many(recurringTemplates),
  creditCardCharges: many(creditCardCharges)
}));
var transactionsRelations = relations(transactions, ({ one, many }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id]
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id]
  }),
  recurringTemplate: one(recurringTemplates, {
    fields: [transactions.recurringTemplateId],
    references: [recurringTemplates.id]
  }),
  goalAllocations: many(financialGoalAllocations),
  fundingLinkAsExpense: one(transactionFundingLinks, {
    relationName: "funding_expense_transaction",
    fields: [transactions.id],
    references: [transactionFundingLinks.expenseTransactionId]
  }),
  fundingLinkAsWithdrawal: one(transactionFundingLinks, {
    relationName: "funding_withdrawal_transaction",
    fields: [transactions.id],
    references: [transactionFundingLinks.withdrawalTransactionId]
  })
}));
var transactionFundingLinksRelations = relations(
  transactionFundingLinks,
  ({ one }) => ({
    expenseTransaction: one(transactions, {
      relationName: "funding_expense_transaction",
      fields: [transactionFundingLinks.expenseTransactionId],
      references: [transactions.id]
    }),
    withdrawalTransaction: one(transactions, {
      relationName: "funding_withdrawal_transaction",
      fields: [transactionFundingLinks.withdrawalTransactionId],
      references: [transactions.id]
    })
  })
);
var financialGoalsRelations = relations(financialGoals, ({ many }) => ({
  allocations: many(financialGoalAllocations)
}));
var investmentHoldingsRelations = relations(investmentHoldings, ({ many, one }) => ({
  allocations: many(investmentPurposeAllocations),
  operations: many(investmentOperations),
  quotes: many(investmentQuotes),
  fixedIncomeTerms: one(fixedIncomeTerms)
}));
var investmentOperationsRelations = relations(investmentOperations, ({ one }) => ({
  holding: one(investmentHoldings, {
    fields: [investmentOperations.holdingId],
    references: [investmentHoldings.id]
  })
}));
var investmentQuotesRelations = relations(investmentQuotes, ({ one }) => ({
  holding: one(investmentHoldings, {
    fields: [investmentQuotes.holdingId],
    references: [investmentHoldings.id]
  })
}));
var fixedIncomeTermsRelations = relations(fixedIncomeTerms, ({ one }) => ({
  holding: one(investmentHoldings, {
    fields: [fixedIncomeTerms.holdingId],
    references: [investmentHoldings.id]
  })
}));
var investmentPurposesRelations = relations(investmentPurposes, ({ many }) => ({
  allocations: many(investmentPurposeAllocations)
}));
var investmentPurposeAllocationsRelations = relations(
  investmentPurposeAllocations,
  ({ one }) => ({
    holding: one(investmentHoldings, {
      fields: [investmentPurposeAllocations.holdingId],
      references: [investmentHoldings.id]
    }),
    purpose: one(investmentPurposes, {
      fields: [investmentPurposeAllocations.purposeId],
      references: [investmentPurposes.id]
    })
  })
);
var investmentReductionEventsRelations = relations(
  investmentReductionEvents,
  ({ one, many }) => ({
    transaction: one(transactions, {
      fields: [investmentReductionEvents.transactionId],
      references: [transactions.id]
    }),
    sources: many(investmentReductionSources)
  })
);
var investmentReductionSourcesRelations = relations(
  investmentReductionSources,
  ({ one }) => ({
    event: one(investmentReductionEvents, {
      fields: [investmentReductionSources.eventId],
      references: [investmentReductionEvents.id]
    }),
    holding: one(investmentHoldings, {
      fields: [investmentReductionSources.holdingId],
      references: [investmentHoldings.id]
    }),
    purpose: one(investmentPurposes, {
      fields: [investmentReductionSources.purposeId],
      references: [investmentPurposes.id]
    }),
    allocation: one(investmentPurposeAllocations, {
      fields: [investmentReductionSources.allocationId],
      references: [investmentPurposeAllocations.id]
    })
  })
);
var financialGoalAllocationsRelations = relations(
  financialGoalAllocations,
  ({ one }) => ({
    goal: one(financialGoals, {
      fields: [financialGoalAllocations.goalId],
      references: [financialGoals.id]
    }),
    transaction: one(transactions, {
      fields: [financialGoalAllocations.transactionId],
      references: [transactions.id]
    })
  })
);
var transfersRelations = relations(transfers, ({ one }) => ({
  fromAccount: one(accounts, {
    relationName: "outgoing_transfers",
    fields: [transfers.fromAccountId],
    references: [accounts.id]
  }),
  toAccount: one(accounts, {
    relationName: "incoming_transfers",
    fields: [transfers.toAccountId],
    references: [accounts.id]
  })
}));
var recurringTemplatesRelations = relations(
  recurringTemplates,
  ({ one, many }) => ({
    account: one(accounts, {
      fields: [recurringTemplates.accountId],
      references: [accounts.id]
    }),
    category: one(categories, {
      fields: [recurringTemplates.categoryId],
      references: [categories.id]
    }),
    transactions: many(transactions)
  })
);
var creditCardChargesRelations = relations(creditCardCharges, ({ one, many }) => ({
  account: one(accounts, {
    fields: [creditCardCharges.accountId],
    references: [accounts.id]
  }),
  category: one(categories, {
    fields: [creditCardCharges.categoryId],
    references: [categories.id]
  }),
  installments: many(creditCardInstallments)
}));
var creditCardBillsRelations = relations(creditCardBills, ({ one, many }) => ({
  account: one(accounts, {
    fields: [creditCardBills.accountId],
    references: [accounts.id]
  }),
  payments: many(creditCardBillPayments)
}));
var creditCardBillPaymentsRelations = relations(
  creditCardBillPayments,
  ({ one }) => ({
    bill: one(creditCardBills, {
      fields: [creditCardBillPayments.billId],
      references: [creditCardBills.id]
    }),
    transaction: one(transactions, {
      fields: [creditCardBillPayments.transactionId],
      references: [transactions.id]
    })
  })
);
var creditCardInstallmentsRelations = relations(
  creditCardInstallments,
  ({ one }) => ({
    charge: one(creditCardCharges, {
      fields: [creditCardInstallments.chargeId],
      references: [creditCardCharges.id]
    })
  })
);

// lib/db/migrate.ts
var encryptedSchemaVersion = 17904e8;
async function migrateDatabase(client) {
  const migrations = readMigrationFiles({
    migrationsFolder: join(process.cwd(), "drizzle")
  });
  const objects = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
  );
  const tables = new Set(objects.rows.map((row) => String(row.name)));
  const history = tables.has("__drizzle_migrations") ? await client.execute("SELECT created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1") : void 0;
  const latest = Number(history?.rows[0]?.created_at ?? 0);
  if (latest < encryptedSchemaVersion) {
    if ([...tables].some((table) => table !== "__drizzle_migrations")) {
      throw new Error("This database requires the completed content encryption schema. Legacy data conversion is no longer supported.");
    }
    const schema = migrations.find((migration) => migration.folderMillis === encryptedSchemaVersion);
    if (!schema) throw new Error("Encrypted database schema is missing.");
    const statements = [
      "CREATE TABLE IF NOT EXISTS __drizzle_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, hash TEXT NOT NULL, created_at NUMERIC)",
      ...schema.sql,
      "CREATE TABLE __pfc_content_migration (id INTEGER PRIMARY KEY CHECK (id = 1), version INTEGER NOT NULL, source_digest TEXT NOT NULL)",
      "INSERT INTO __pfc_content_migration VALUES (1, 2, 'bootstrap')"
    ];
    const columns = getTableColumns2(categories);
    for (const category of defaultCategories) {
      const row = withContentIndexes(categories, category, true);
      const entries = Object.entries(columns);
      statements.push({
        sql: `INSERT INTO categories (${entries.map(([, column2]) => `"${column2.name}"`).join(",")}) VALUES (${entries.map(() => "?").join(",")})`,
        args: entries.map(([key, column2]) => row[key] == null ? null : column2.mapToDriverValue(row[key]))
      });
    }
    statements.push(...migrations.filter((migration) => migration.folderMillis <= encryptedSchemaVersion && migration.folderMillis > latest).map((migration) => ({
      sql: "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
      args: [migration.hash, migration.folderMillis]
    })));
    await client.migrate(statements);
  }
  const pending = migrations.filter((migration) => migration.folderMillis > Math.max(latest, encryptedSchemaVersion));
  if (pending.length) {
    await client.migrate(pending.flatMap((migration) => [
      ...migration.sql,
      { sql: "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)", args: [migration.hash, migration.folderMillis] }
    ]));
  }
}

// scripts/migrate.ts
async function main() {
  const env = getServerEnv();
  if (env.DEMO_MODE) {
    console.log("Demo mode enabled; persistent migrations skipped.");
    return;
  }
  if (!process.env.DATABASE_URL && !process.env.TURSO_DATABASE_URL) throw new Error("Explicit DATABASE_URL or TURSO_DATABASE_URL is required; migration never falls back to another database.");
  const client = createClient({ url: env.DATABASE_URL, authToken: env.TOKEN });
  try {
    await migrateDatabase(client);
    console.log("Migrations applied.");
  } finally {
    client.close();
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration failed.");
  process.exitCode = 1;
});
