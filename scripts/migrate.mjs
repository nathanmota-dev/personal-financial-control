var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// lib/category-defaults.ts
var defaultCategoryIds, defaultCategories;
var init_category_defaults = __esm({
  "lib/category-defaults.ts"() {
    "use strict";
    defaultCategoryIds = {
      salary: "b0000000-0000-4000-8000-000000000101",
      housing: "b0000000-0000-4000-8000-000000000102",
      householdBills: "b0000000-0000-4000-8000-000000000103",
      food: "b0000000-0000-4000-8000-000000000104",
      transport: "b0000000-0000-4000-8000-000000000105",
      investments: "b0000000-0000-4000-8000-000000000106",
      other: "b0000000-0000-4000-8000-000000000107"
    };
    defaultCategories = [
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
  }
});

// lib/crypto/money.ts
import {
  createCipheriv,
  createDecipheriv,
  randomBytes
} from "node:crypto";
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
var KEY_LENGTH, BASE64_PATTERN, ephemeralDemoKey;
var init_money = __esm({
  "lib/crypto/money.ts"() {
    "use strict";
    KEY_LENGTH = 32;
    BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  }
});

// lib/crypto/content.ts
import { createCipheriv as createCipheriv2, createDecipheriv as createDecipheriv2, createHmac, hkdfSync, randomBytes as randomBytes2 } from "node:crypto";
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
var init_content = __esm({
  "lib/crypto/content.ts"() {
    "use strict";
    init_money();
  }
});

// lib/db/content-indexes.ts
import { getTableColumns, getTableName } from "drizzle-orm";
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
var init_content_indexes = __esm({
  "lib/db/content-indexes.ts"() {
    "use strict";
    init_content();
  }
});

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
var init_encrypted_content = __esm({
  "lib/db/encrypted-content.ts"() {
    "use strict";
    init_content();
  }
});

// lib/db/encryption-indexes.json
var encryption_indexes_default;
var init_encryption_indexes = __esm({
  "lib/db/encryption-indexes.json"() {
    encryption_indexes_default = {
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
      ],
      monthly_budgets: [
        "competence_month"
      ]
    };
  }
});

// lib/db/encryption-inventory.json
var encryption_inventory_default;
var init_encryption_inventory = __esm({
  "lib/db/encryption-inventory.json"() {
    encryption_inventory_default = {
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
      },
      monthly_budgets: {
        id: "technical",
        category_id: "technical",
        competence_month: "text",
        amount_cents: "integer",
        created_at: "timestamp",
        updated_at: "timestamp"
      }
    };
  }
});

// lib/db/encryption-checks.ts
import { getTableName as getTableName2, sql } from "drizzle-orm";
import { check } from "drizzle-orm/sqlite-core";
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
var init_encryption_checks = __esm({
  "lib/db/encryption-checks.ts"() {
    "use strict";
    init_encryption_indexes();
    init_encryption_inventory();
  }
});

// lib/db/schema/columns.ts
import { text } from "drizzle-orm/sqlite-core";
function recordId() {
  return text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
}
function referenceColumn(name, reference, onDelete) {
  return text(name).references(reference, { onDelete });
}
var init_columns = __esm({
  "lib/db/schema/columns.ts"() {
    "use strict";
  }
});

// lib/db/schema/enums.ts
var accountTypes, categoryGroups, transactionTypes, recurringTransactionTypes, transactionStatuses, creditCardBillStatuses, creditCardBillPaymentKinds, creditCardChargeKinds, recurringStatuses, goalCategories, goalStatuses, allocationTypes, investmentReductionEventTypes, investmentReductionSourceTypes, investmentReductionStatuses, transactionFundingLinkTypes, investmentAssetClasses, investmentInstrumentTypes, investmentValuationModes, investmentPurposeKinds, investmentOperationTypes, fixedIncomeSubtypes, investmentQuoteProviders, investmentMarketStates, investmentValuationSources;
var init_enums = __esm({
  "lib/db/schema/enums.ts"() {
    "use strict";
    accountTypes = [
      "checking",
      "savings",
      "cash",
      "credit",
      "investment"
    ];
    categoryGroups = [
      "income",
      "fixed_expense",
      "variable_expense",
      "investment"
    ];
    transactionTypes = [
      "income",
      "expense",
      "investment_contribution",
      "investment_withdrawal"
    ];
    recurringTransactionTypes = [
      "income",
      "expense",
      "investment_contribution"
    ];
    transactionStatuses = [
      "pending",
      "posted",
      "cancelled"
    ];
    creditCardBillStatuses = ["open", "paid"];
    creditCardBillPaymentKinds = [
      "pre_statement",
      "settlement",
      "unlinked"
    ];
    creditCardChargeKinds = ["purchase", "adjustment"];
    recurringStatuses = ["active", "paused", "ended"];
    goalCategories = [
      "housing",
      "vehicle",
      "electronics",
      "travel",
      "education",
      "emergency",
      "other"
    ];
    goalStatuses = ["active", "paused", "completed", "archived"];
    allocationTypes = [
      "initial_allocation",
      "manual_allocation",
      "manual_release",
      "contribution",
      "correction"
    ];
    investmentReductionEventTypes = ["withdrawal", "reconciliation"];
    investmentReductionSourceTypes = [
      "allocation",
      "holding_free",
      "not_registered"
    ];
    investmentReductionStatuses = ["active", "reversed"];
    transactionFundingLinkTypes = ["investment_funded_expense"];
    investmentAssetClasses = [
      "fixed_income",
      "equities",
      "funds",
      "real_estate",
      "crypto",
      "cash",
      "other"
    ];
    investmentInstrumentTypes = [
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
    investmentValuationModes = [
      "market_quote",
      "manual_balance",
      "contract_estimate"
    ];
    investmentPurposeKinds = ["general", "emergency_reserve"];
    investmentOperationTypes = [
      "buy",
      "sell",
      "application",
      "redemption",
      "correction"
    ];
    fixedIncomeSubtypes = [
      "treasury",
      "cdb",
      "lci_lca",
      "debenture",
      "other"
    ];
    investmentQuoteProviders = ["manual", "brapi"];
    investmentMarketStates = ["regular", "closed", "delayed", "unknown"];
    investmentValuationSources = ["market_quote", "manual_balance"];
  }
});

// lib/db/schema/accounts.ts
import {
  sqliteTable,
  text as text2,
  uniqueIndex
} from "drizzle-orm/sqlite-core";
function timestampColumns(table) {
  return {
    createdAt: encryptedTimestamp("created_at", `${table}.created_at`).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: encryptedTimestamp("updated_at", `${table}.updated_at`).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
  };
}
var accounts, categories;
var init_accounts = __esm({
  "lib/db/schema/accounts.ts"() {
    "use strict";
    init_encrypted_content();
    init_encryption_checks();
    init_columns();
    init_enums();
    accounts = sqliteTable(
      "accounts",
      {
        id: recordId(),
        name: encryptedText("name", "accounts.name").notNull(),
        type: encryptedText("type", "accounts.type", { enum: accountTypes }).notNull(),
        initialBalanceCents: encryptedInteger("initial_balance_cents", "accounts.initial_balance_cents").notNull(),
        creditClosingDay: encryptedInteger("credit_closing_day", "accounts.credit_closing_day"),
        creditDueDay: encryptedInteger("credit_due_day", "accounts.credit_due_day").notNull().$defaultFn(() => 10),
        isArchived: encryptedBoolean("is_archived", "accounts.is_archived").notNull().$defaultFn(() => false),
        nameHash: text2("name_hash"),
        ...timestampColumns("accounts")
      },
      (table) => [
        ...encryptionChecks(table),
        uniqueIndex("accounts_name_unique").on(table.nameHash)
      ]
    );
    categories = sqliteTable(
      "categories",
      {
        id: recordId(),
        name: encryptedText("name", "categories.name").notNull(),
        group: encryptedText("group", "categories.group", { enum: categoryGroups }).notNull(),
        isArchived: encryptedBoolean("is_archived", "categories.is_archived").notNull().$defaultFn(() => false),
        nameHash: text2("name_hash"),
        ...timestampColumns("categories")
      },
      (table) => [
        ...encryptionChecks(table),
        uniqueIndex("categories_name_unique").on(table.nameHash)
      ]
    );
  }
});

// lib/db/schema/transactions.ts
import {
  index,
  sqliteTable as sqliteTable2,
  text as text3,
  uniqueIndex as uniqueIndex2
} from "drizzle-orm/sqlite-core";
var recurringTemplates, transactions, transactionFundingLinks, transfers;
var init_transactions = __esm({
  "lib/db/schema/transactions.ts"() {
    "use strict";
    init_encrypted_content();
    init_encryption_checks();
    init_accounts();
    init_columns();
    init_enums();
    recurringTemplates = sqliteTable2(
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
        ...timestampColumns("recurring_templates")
      },
      (table) => [
        ...encryptionChecks(table),
        index("recurring_templates_account_idx").on(table.accountId),
        index("recurring_templates_category_idx").on(table.categoryId)
      ]
    );
    transactions = sqliteTable2(
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
        isIncludedInInvestmentCheckpoint: encryptedBoolean("is_included_in_investment_checkpoint", "transactions.is_included_in_investment_checkpoint").notNull().$defaultFn(() => true),
        importFingerprintHash: text3("import_fingerprint_hash"),
        competenceMonthHash: text3("competence_month_hash"),
        ...timestampColumns("transactions")
      },
      (table) => [
        ...encryptionChecks(table),
        index("transactions_account_idx").on(table.accountId),
        index("transactions_category_idx").on(table.categoryId),
        index("transactions_competence_idx").on(table.competenceMonthHash),
        uniqueIndex2("transactions_import_fingerprint_unique").on(table.importFingerprintHash),
        uniqueIndex2("transactions_recurring_month_unique").on(
          table.recurringTemplateId,
          table.competenceMonthHash
        )
      ]
    );
    transactionFundingLinks = sqliteTable2(
      "transaction_funding_links",
      {
        id: recordId(),
        expenseTransactionId: referenceColumn("expense_transaction_id", () => transactions.id, "cascade").notNull(),
        withdrawalTransactionId: referenceColumn("withdrawal_transaction_id", () => transactions.id, "cascade").notNull(),
        type: encryptedText("type", "transaction_funding_links.type", { enum: transactionFundingLinkTypes }).notNull(),
        ...timestampColumns("transaction_funding_links")
      },
      (table) => [
        ...encryptionChecks(table),
        uniqueIndex2("transaction_funding_links_expense_unique").on(table.expenseTransactionId),
        uniqueIndex2("transaction_funding_links_withdrawal_unique").on(table.withdrawalTransactionId)
      ]
    );
    transfers = sqliteTable2(
      "transfers",
      {
        id: recordId(),
        fromAccountId: referenceColumn("from_account_id", () => accounts.id, "restrict").notNull(),
        toAccountId: referenceColumn("to_account_id", () => accounts.id, "restrict").notNull(),
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
  }
});

// lib/db/schema/credit-card.ts
import {
  index as index2,
  sqliteTable as sqliteTable3,
  text as text4,
  uniqueIndex as uniqueIndex3
} from "drizzle-orm/sqlite-core";
var creditCardCharges, creditCardBills, creditCardBillPayments, creditCardInstallments;
var init_credit_card = __esm({
  "lib/db/schema/credit-card.ts"() {
    "use strict";
    init_encrypted_content();
    init_encryption_checks();
    init_accounts();
    init_columns();
    init_enums();
    init_transactions();
    creditCardCharges = sqliteTable3(
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
        importFingerprintHash: text4("import_fingerprint_hash"),
        ...timestampColumns("credit_card_charges")
      },
      (table) => [
        ...encryptionChecks(table),
        index2("credit_card_charges_account_idx").on(table.accountId),
        index2("credit_card_charges_category_idx").on(table.categoryId),
        uniqueIndex3("credit_card_charges_import_fingerprint_unique").on(table.importFingerprintHash)
      ]
    );
    creditCardBills = sqliteTable3(
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
        invoiceMonthHash: text4("invoice_month_hash"),
        ...timestampColumns("credit_card_bills")
      },
      (table) => [
        ...encryptionChecks(table),
        uniqueIndex3("credit_card_bills_account_month_unique").on(
          table.accountId,
          table.invoiceMonthHash
        ),
        index2("credit_card_bills_account_idx").on(table.accountId)
      ]
    );
    creditCardBillPayments = sqliteTable3(
      "credit_card_bill_payments",
      {
        id: recordId(),
        billId: referenceColumn("bill_id", () => creditCardBills.id, "set null"),
        transactionId: referenceColumn("transaction_id", () => transactions.id, "cascade").notNull(),
        paymentDate: encryptedText("payment_date", "credit_card_bill_payments.payment_date").notNull(),
        amountCents: encryptedInteger("amount_cents", "credit_card_bill_payments.amount_cents").notNull(),
        kind: encryptedText("kind", "credit_card_bill_payments.kind", { enum: creditCardBillPaymentKinds }).notNull(),
        idempotencyKey: encryptedText("idempotency_key", "credit_card_bill_payments.idempotency_key").notNull(),
        idempotencyKeyHash: text4("idempotency_key_hash"),
        ...timestampColumns("credit_card_bill_payments")
      },
      (table) => [
        ...encryptionChecks(table),
        uniqueIndex3("credit_card_bill_payments_transaction_unique").on(table.transactionId),
        uniqueIndex3("credit_card_bill_payments_idempotency_unique").on(table.idempotencyKeyHash),
        index2("credit_card_bill_payments_bill_idx").on(table.billId)
      ]
    );
    creditCardInstallments = sqliteTable3(
      "credit_card_installments",
      {
        id: recordId(),
        chargeId: referenceColumn("charge_id", () => creditCardCharges.id, "cascade").notNull(),
        installmentNumber: encryptedInteger("installment_number", "credit_card_installments.installment_number").notNull(),
        amountCents: encryptedInteger("amount_cents", "credit_card_installments.amount_cents").notNull(),
        invoiceMonth: encryptedText("invoice_month", "credit_card_installments.invoice_month").notNull(),
        installmentNumberHash: text4("installment_number_hash"),
        ...timestampColumns("credit_card_installments")
      },
      (table) => [
        ...encryptionChecks(table),
        index2("credit_card_installments_charge_idx").on(table.chargeId),
        uniqueIndex3("credit_card_installments_charge_number_unique").on(
          table.chargeId,
          table.installmentNumberHash
        )
      ]
    );
  }
});

// lib/db/schema/goals.ts
import {
  index as index3,
  sqliteTable as sqliteTable4
} from "drizzle-orm/sqlite-core";
var financialGoals, financialGoalAllocations;
var init_goals = __esm({
  "lib/db/schema/goals.ts"() {
    "use strict";
    init_encrypted_content();
    init_encryption_checks();
    init_accounts();
    init_columns();
    init_enums();
    init_transactions();
    financialGoals = sqliteTable4(
      "financial_goals",
      {
        id: recordId(),
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
    financialGoalAllocations = sqliteTable4(
      "financial_goal_allocations",
      {
        id: recordId(),
        goalId: referenceColumn("goal_id", () => financialGoals.id, "cascade").notNull(),
        transactionId: referenceColumn("transaction_id", () => transactions.id, "set null"),
        type: encryptedText("type", "financial_goal_allocations.type", { enum: allocationTypes }).notNull(),
        amountCents: encryptedInteger("amount_cents", "financial_goal_allocations.amount_cents").notNull(),
        occurredOn: encryptedText("occurred_on", "financial_goal_allocations.occurred_on").notNull(),
        notes: encryptedText("notes", "financial_goal_allocations.notes"),
        ...timestampColumns("financial_goal_allocations")
      },
      (table) => [
        ...encryptionChecks(table),
        index3("financial_goal_allocations_goal_idx").on(table.goalId),
        index3("financial_goal_allocations_transaction_idx").on(table.transactionId)
      ]
    );
  }
});

// lib/db/schema/investment-assets.ts
import {
  sqliteTable as sqliteTable5,
  text as text5,
  uniqueIndex as uniqueIndex4
} from "drizzle-orm/sqlite-core";
var investmentPortfolio, investmentHoldings, investmentPurposes;
var init_investment_assets = __esm({
  "lib/db/schema/investment-assets.ts"() {
    "use strict";
    init_encrypted_content();
    init_encryption_checks();
    init_accounts();
    init_columns();
    init_enums();
    investmentPortfolio = sqliteTable5(
      "investment_portfolio",
      {
        id: recordId(),
        checkpointBalanceCents: encryptedInteger("checkpoint_balance_cents", "investment_portfolio.checkpoint_balance_cents").notNull(),
        expectedMonthlyRateBps: encryptedInteger("expected_monthly_rate_bps", "investment_portfolio.expected_monthly_rate_bps").notNull(),
        checkpointDate: encryptedText("checkpoint_date", "investment_portfolio.checkpoint_date").notNull(),
        ...timestampColumns("investment_portfolio")
      },
      (table) => [
        ...encryptionChecks(table)
      ]
    );
    investmentHoldings = sqliteTable5(
      "investment_holdings",
      {
        id: recordId(),
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
        activeQuoteSymbolHash: text5("active_quote_symbol_hash"),
        ...timestampColumns("investment_holdings")
      },
      (table) => [
        ...encryptionChecks(table),
        uniqueIndex4("investment_holdings_active_quote_symbol_unique").on(table.activeQuoteSymbolHash)
      ]
    );
    investmentPurposes = sqliteTable5(
      "investment_purposes",
      {
        id: recordId(),
        name: encryptedText("name", "investment_purposes.name").notNull(),
        kind: encryptedText("kind", "investment_purposes.kind", { enum: investmentPurposeKinds }).notNull().$defaultFn(() => "general"),
        targetAmountCents: encryptedInteger("target_amount_cents", "investment_purposes.target_amount_cents"),
        color: encryptedText("color", "investment_purposes.color").notNull().$defaultFn(() => "#22d3ee"),
        notes: encryptedText("notes", "investment_purposes.notes"),
        isArchived: encryptedBoolean("is_archived", "investment_purposes.is_archived").notNull().$defaultFn(() => false),
        activeEmergencyHash: text5("active_emergency_hash"),
        ...timestampColumns("investment_purposes")
      },
      (table) => [
        ...encryptionChecks(table),
        uniqueIndex4("investment_purposes_active_emergency_unique").on(table.activeEmergencyHash)
      ]
    );
  }
});

// lib/db/schema/investment-operations.ts
import {
  index as index4,
  sqliteTable as sqliteTable6,
  text as text6,
  uniqueIndex as uniqueIndex5
} from "drizzle-orm/sqlite-core";
var investmentOperations, investmentQuotes, fixedIncomeTerms, investmentPositionSnapshots, investmentPortfolioSnapshots;
var init_investment_operations = __esm({
  "lib/db/schema/investment-operations.ts"() {
    "use strict";
    init_encrypted_content();
    init_encryption_checks();
    init_accounts();
    init_columns();
    init_enums();
    init_investment_assets();
    investmentOperations = sqliteTable6(
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
        ...timestampColumns("investment_operations")
      },
      (table) => [
        ...encryptionChecks(table),
        index4("investment_operations_holding_idx").on(table.holdingId)
      ]
    );
    investmentQuotes = sqliteTable6(
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
        quotedOnHash: text6("quoted_on_hash"),
        ...timestampColumns("investment_quotes")
      },
      (table) => [
        ...encryptionChecks(table),
        index4("investment_quotes_holding_idx").on(table.holdingId),
        uniqueIndex5("investment_quotes_holding_date_unique").on(table.holdingId, table.quotedOnHash)
      ]
    );
    fixedIncomeTerms = sqliteTable6(
      "fixed_income_terms",
      {
        id: recordId(),
        holdingId: text6("holding_id").notNull().unique().references(() => investmentHoldings.id, { onDelete: "cascade" }),
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
    investmentPositionSnapshots = sqliteTable6(
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
        snapshotDateHash: text6("snapshot_date_hash"),
        ...timestampColumns("investment_position_snapshots")
      },
      (table) => [
        ...encryptionChecks(table),
        uniqueIndex5("investment_position_snapshots_holding_date_unique").on(table.holdingId, table.snapshotDateHash),
        index4("investment_position_snapshots_date_idx").on(table.snapshotDateHash)
      ]
    );
    investmentPortfolioSnapshots = sqliteTable6(
      "investment_portfolio_snapshots",
      {
        id: recordId(),
        snapshotDate: encryptedText("snapshot_date", "investment_portfolio_snapshots.snapshot_date").notNull(),
        knownCostCents: encryptedInteger("known_cost_cents", "investment_portfolio_snapshots.known_cost_cents").notNull(),
        knownValueCents: encryptedInteger("known_value_cents", "investment_portfolio_snapshots.known_value_cents").notNull(),
        totalValueCents: encryptedInteger("total_value_cents", "investment_portfolio_snapshots.total_value_cents").notNull(),
        unrealizedResultCents: encryptedInteger("unrealized_result_cents", "investment_portfolio_snapshots.unrealized_result_cents").notNull(),
        snapshotDateHash: text6("snapshot_date_hash"),
        ...timestampColumns("investment_portfolio_snapshots")
      },
      (table) => [
        ...encryptionChecks(table),
        uniqueIndex5("investment_portfolio_snapshots_date_unique").on(table.snapshotDateHash)
      ]
    );
  }
});

// lib/db/schema/investment-reductions.ts
import {
  index as index5,
  sqliteTable as sqliteTable7,
  uniqueIndex as uniqueIndex6
} from "drizzle-orm/sqlite-core";
var investmentPurposeAllocations, investmentReductionEvents, investmentReductionSources;
var init_investment_reductions = __esm({
  "lib/db/schema/investment-reductions.ts"() {
    "use strict";
    init_encrypted_content();
    init_encryption_checks();
    init_accounts();
    init_columns();
    init_enums();
    init_investment_assets();
    init_transactions();
    investmentPurposeAllocations = sqliteTable7(
      "investment_purpose_allocations",
      {
        id: recordId(),
        holdingId: referenceColumn("holding_id", () => investmentHoldings.id, "restrict").notNull(),
        purposeId: referenceColumn("purpose_id", () => investmentPurposes.id, "restrict").notNull(),
        amountCents: encryptedInteger("amount_cents", "investment_purpose_allocations.amount_cents").notNull(),
        allocatedOn: encryptedText("allocated_on", "investment_purpose_allocations.allocated_on").notNull(),
        notes: encryptedText("notes", "investment_purpose_allocations.notes"),
        ...timestampColumns("investment_purpose_allocations")
      },
      (table) => [
        ...encryptionChecks(table),
        index5("investment_purpose_allocations_holding_idx").on(table.holdingId),
        index5("investment_purpose_allocations_purpose_idx").on(table.purposeId),
        uniqueIndex6("investment_purpose_allocations_holding_purpose_unique").on(
          table.holdingId,
          table.purposeId
        )
      ]
    );
    investmentReductionEvents = sqliteTable7(
      "investment_reduction_events",
      {
        id: recordId(),
        type: encryptedText("type", "investment_reduction_events.type", { enum: investmentReductionEventTypes }).notNull(),
        status: encryptedText("status", "investment_reduction_events.status", { enum: investmentReductionStatuses }).notNull().$defaultFn(() => "active"),
        transactionId: referenceColumn("transaction_id", () => transactions.id, "set null"),
        amountCents: encryptedInteger("amount_cents", "investment_reduction_events.amount_cents").notNull(),
        occurredOn: encryptedText("occurred_on", "investment_reduction_events.occurred_on").notNull(),
        reversedAt: encryptedTimestamp("reversed_at", "investment_reduction_events.reversed_at"),
        ...timestampColumns("investment_reduction_events")
      },
      (table) => [
        ...encryptionChecks(table),
        index5("investment_reduction_events_transaction_idx").on(table.transactionId)
      ]
    );
    investmentReductionSources = sqliteTable7(
      "investment_reduction_sources",
      {
        id: recordId(),
        eventId: referenceColumn("event_id", () => investmentReductionEvents.id, "cascade").notNull(),
        sourceType: encryptedText("source_type", "investment_reduction_sources.source_type", { enum: investmentReductionSourceTypes }).notNull(),
        holdingId: referenceColumn("holding_id", () => investmentHoldings.id, "set null"),
        purposeId: referenceColumn("purpose_id", () => investmentPurposes.id, "set null"),
        allocationId: referenceColumn("allocation_id", () => investmentPurposeAllocations.id, "set null"),
        amountCents: encryptedInteger("amount_cents", "investment_reduction_sources.amount_cents").notNull(),
        ...timestampColumns("investment_reduction_sources")
      },
      (table) => [
        ...encryptionChecks(table),
        index5("investment_reduction_sources_event_idx").on(table.eventId),
        index5("investment_reduction_sources_holding_idx").on(table.holdingId),
        index5("investment_reduction_sources_purpose_idx").on(table.purposeId),
        index5("investment_reduction_sources_allocation_idx").on(table.allocationId)
      ]
    );
  }
});

// lib/db/schema/relations-core.ts
import { relations } from "drizzle-orm";
var accountsRelations, categoriesRelations, transactionsRelations, transactionFundingLinksRelations, financialGoalsRelations, investmentHoldingsRelations, investmentOperationsRelations, investmentQuotesRelations, fixedIncomeTermsRelations, investmentPurposesRelations, investmentPurposeAllocationsRelations;
var init_relations_core = __esm({
  "lib/db/schema/relations-core.ts"() {
    "use strict";
    init_accounts();
    init_credit_card();
    init_goals();
    init_investment_assets();
    init_investment_operations();
    init_investment_reductions();
    init_transactions();
    accountsRelations = relations(accounts, ({ many }) => ({
      transactions: many(transactions),
      outgoingTransfers: many(transfers, { relationName: "outgoing_transfers" }),
      incomingTransfers: many(transfers, { relationName: "incoming_transfers" }),
      recurringTemplates: many(recurringTemplates),
      creditCardCharges: many(creditCardCharges)
    }));
    categoriesRelations = relations(categories, ({ many }) => ({
      transactions: many(transactions),
      recurringTemplates: many(recurringTemplates),
      creditCardCharges: many(creditCardCharges)
    }));
    transactionsRelations = relations(transactions, ({ one, many }) => ({
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
    transactionFundingLinksRelations = relations(
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
    financialGoalsRelations = relations(financialGoals, ({ many }) => ({
      allocations: many(financialGoalAllocations)
    }));
    investmentHoldingsRelations = relations(investmentHoldings, ({ many, one }) => ({
      allocations: many(investmentPurposeAllocations),
      operations: many(investmentOperations),
      quotes: many(investmentQuotes),
      fixedIncomeTerms: one(fixedIncomeTerms)
    }));
    investmentOperationsRelations = relations(investmentOperations, ({ one }) => ({
      holding: one(investmentHoldings, {
        fields: [investmentOperations.holdingId],
        references: [investmentHoldings.id]
      })
    }));
    investmentQuotesRelations = relations(investmentQuotes, ({ one }) => ({
      holding: one(investmentHoldings, {
        fields: [investmentQuotes.holdingId],
        references: [investmentHoldings.id]
      })
    }));
    fixedIncomeTermsRelations = relations(fixedIncomeTerms, ({ one }) => ({
      holding: one(investmentHoldings, {
        fields: [fixedIncomeTerms.holdingId],
        references: [investmentHoldings.id]
      })
    }));
    investmentPurposesRelations = relations(investmentPurposes, ({ many }) => ({
      allocations: many(investmentPurposeAllocations)
    }));
    investmentPurposeAllocationsRelations = relations(
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
  }
});

// lib/db/schema/relations-finance.ts
import { relations as relations2 } from "drizzle-orm";
var investmentReductionEventsRelations, investmentReductionSourcesRelations, financialGoalAllocationsRelations, transfersRelations, recurringTemplatesRelations, creditCardChargesRelations, creditCardBillsRelations, creditCardBillPaymentsRelations, creditCardInstallmentsRelations;
var init_relations_finance = __esm({
  "lib/db/schema/relations-finance.ts"() {
    "use strict";
    init_accounts();
    init_credit_card();
    init_goals();
    init_investment_assets();
    init_investment_reductions();
    init_transactions();
    investmentReductionEventsRelations = relations2(
      investmentReductionEvents,
      ({ one, many }) => ({
        transaction: one(transactions, {
          fields: [investmentReductionEvents.transactionId],
          references: [transactions.id]
        }),
        sources: many(investmentReductionSources)
      })
    );
    investmentReductionSourcesRelations = relations2(
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
    financialGoalAllocationsRelations = relations2(
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
    transfersRelations = relations2(transfers, ({ one }) => ({
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
    recurringTemplatesRelations = relations2(
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
    creditCardChargesRelations = relations2(creditCardCharges, ({ one, many }) => ({
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
    creditCardBillsRelations = relations2(creditCardBills, ({ one, many }) => ({
      account: one(accounts, {
        fields: [creditCardBills.accountId],
        references: [accounts.id]
      }),
      payments: many(creditCardBillPayments)
    }));
    creditCardBillPaymentsRelations = relations2(
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
    creditCardInstallmentsRelations = relations2(
      creditCardInstallments,
      ({ one }) => ({
        charge: one(creditCardCharges, {
          fields: [creditCardInstallments.chargeId],
          references: [creditCardCharges.id]
        })
      })
    );
  }
});

// lib/db/user-schema.ts
import { sql as sql2 } from "drizzle-orm";
import { check as check2, integer, sqliteTable as sqliteTable8, text as text7 } from "drizzle-orm/sqlite-core";
var authorizedUsers, userOnboarding;
var init_user_schema = __esm({
  "lib/db/user-schema.ts"() {
    "use strict";
    authorizedUsers = sqliteTable8("authorized_users", {
      email: text7("email").primaryKey(),
      displayName: text7("display_name"),
      pinHash: text7("pin_hash"),
      pinFailedAttempts: integer("pin_failed_attempts").notNull().default(0),
      pinResetRequested: integer("pin_reset_requested", { mode: "boolean" }).notNull().default(false),
      sessionVersion: integer("session_version").notNull().default(0),
      lockTimeoutMinutes: integer("lock_timeout_minutes").notNull().default(15),
      lockOnClose: integer("lock_on_close", { mode: "boolean" }).notNull().default(true),
      mcpTokenHash: text7("mcp_token_hash"),
      createdAt: text7("created_at").notNull().default(sql2`CURRENT_TIMESTAMP`)
    }, (table) => [check2("lock_timeout_range", sql2`${table.lockTimeoutMinutes} BETWEEN 0 AND 60`)]);
    userOnboarding = sqliteTable8("user_onboarding", {
      userId: text7("user_id").primaryKey(),
      currentStep: integer("current_step").notNull().default(1),
      completedAt: text7("completed_at")
    }, (table) => [check2("onboarding_step_range", sql2`${table.currentStep} BETWEEN 1 AND 5`)]);
  }
});

// lib/db/schema/budgets.ts
import { sqliteTable as sqliteTable9, text as text8, uniqueIndex as uniqueIndex7 } from "drizzle-orm/sqlite-core";
var monthlyBudgets;
var init_budgets = __esm({
  "lib/db/schema/budgets.ts"() {
    "use strict";
    init_encrypted_content();
    init_encryption_checks();
    init_accounts();
    init_columns();
    monthlyBudgets = sqliteTable9("monthly_budgets", {
      id: recordId(),
      categoryId: referenceColumn("category_id", () => categories.id, "restrict").notNull(),
      competenceMonth: encryptedText("competence_month", "monthly_budgets.competence_month").notNull(),
      amountCents: encryptedInteger("amount_cents", "monthly_budgets.amount_cents").notNull(),
      competenceMonthHash: text8("competence_month_hash"),
      ...timestampColumns("monthly_budgets")
    }, (table) => [
      ...encryptionChecks(table),
      uniqueIndex7("monthly_budgets_category_month_unique").on(table.categoryId, table.competenceMonthHash)
    ]);
  }
});

// lib/db/schema.ts
var init_schema = __esm({
  "lib/db/schema.ts"() {
    "use strict";
    init_accounts();
    init_credit_card();
    init_enums();
    init_goals();
    init_investment_assets();
    init_investment_operations();
    init_investment_reductions();
    init_relations_core();
    init_relations_finance();
    init_transactions();
    init_user_schema();
    init_budgets();
  }
});

// lib/db/migrate.ts
import { getTableColumns as getTableColumns2 } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { join } from "node:path";
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
var encryptedSchemaVersion;
var init_migrate = __esm({
  "lib/db/migrate.ts"() {
    "use strict";
    init_category_defaults();
    init_content_indexes();
    init_schema();
    encryptedSchemaVersion = 17904e8;
  }
});

// lib/env.ts
import * as nextEnv from "@next/env";
import { z } from "zod";
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
  if (!parsed.data.DEMO_MODE && parsed.data.TURSO_REPLICA_PATH) {
    if (!/^(libsql|https):\/\//.test(url) || !token) {
      throw new Error("TURSO_REPLICA_PATH requires a remote database URL and authentication token.");
    }
    if (/[:\u0000]/.test(parsed.data.TURSO_REPLICA_PATH)) {
      throw new Error("TURSO_REPLICA_PATH must be a filesystem path, not a database URL.");
    }
  }
  return {
    ...parsed.data,
    DATABASE_URL: url,
    TOKEN: token
  };
}
var loadEnvConfig2, serverEnvSchema;
var init_env = __esm({
  "lib/env.ts"() {
    "use strict";
    loadEnvConfig2 = nextEnv.loadEnvConfig ?? nextEnv.default.loadEnvConfig;
    loadEnvConfig2(process.cwd());
    serverEnvSchema = z.object({
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
      TURSO_REPLICA_PATH: z.string().trim().min(1).optional(),
      TURSO_SYNC_INTERVAL: z.coerce.number().int().min(1).max(86400).default(30),
      DATA_ENCRYPTION_KEY: z.string().min(1).optional(),
      BRAPI_API_TOKEN: z.string().min(1).optional(),
      INVESTMENT_QUOTE_MIN_INTERVAL_MINUTES: z.coerce.number().int().nonnegative().default(30)
    });
  }
});

// scripts/migrate.ts
import { createClient } from "@libsql/client";
var require_migrate = __commonJS({
  "scripts/migrate.ts"() {
    init_migrate();
    init_env();
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
  }
});
export default require_migrate();
