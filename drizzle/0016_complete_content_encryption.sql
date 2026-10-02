-- Data conversion is performed by lib/db/content-migration.ts before the atomic swap.
CREATE TABLE "accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "initial_balance_cents" text NOT NULL,
  "credit_closing_day" text,
  "credit_due_day" text NOT NULL,
  "is_archived" text NOT NULL,
  "name_hash" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  CONSTRAINT "accounts_name_encrypted" CHECK ("name" IS NULL OR (typeof("name") = 'text' AND "name" LIKE 'pfc:v2:%')),
  CONSTRAINT "accounts_type_encrypted" CHECK ("type" IS NULL OR (typeof("type") = 'text' AND "type" LIKE 'pfc:v2:%')),
  CONSTRAINT "accounts_initial_balance_cents_encrypted" CHECK ("initial_balance_cents" IS NULL OR (typeof("initial_balance_cents") = 'text' AND "initial_balance_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "accounts_credit_closing_day_encrypted" CHECK ("credit_closing_day" IS NULL OR (typeof("credit_closing_day") = 'text' AND "credit_closing_day" LIKE 'pfc:v2:%')),
  CONSTRAINT "accounts_credit_due_day_encrypted" CHECK ("credit_due_day" IS NULL OR (typeof("credit_due_day") = 'text' AND "credit_due_day" LIKE 'pfc:v2:%')),
  CONSTRAINT "accounts_is_archived_encrypted" CHECK ("is_archived" IS NULL OR (typeof("is_archived") = 'text' AND "is_archived" LIKE 'pfc:v2:%')),
  CONSTRAINT "accounts_name_hash_valid" CHECK ("name_hash" IS NULL OR (length("name_hash") = 64 AND "name_hash" NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "accounts_name_hash_present" CHECK (("name" IS NULL) = ("name_hash" IS NULL)),
  CONSTRAINT "accounts_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "accounts_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_name_unique" ON "accounts" ("name_hash");
--> statement-breakpoint
CREATE TABLE "categories" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "group" text NOT NULL,
  "is_archived" text NOT NULL,
  "name_hash" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  CONSTRAINT "categories_name_encrypted" CHECK ("name" IS NULL OR (typeof("name") = 'text' AND "name" LIKE 'pfc:v2:%')),
  CONSTRAINT "categories_group_encrypted" CHECK ("group" IS NULL OR (typeof("group") = 'text' AND "group" LIKE 'pfc:v2:%')),
  CONSTRAINT "categories_is_archived_encrypted" CHECK ("is_archived" IS NULL OR (typeof("is_archived") = 'text' AND "is_archived" LIKE 'pfc:v2:%')),
  CONSTRAINT "categories_name_hash_valid" CHECK ("name_hash" IS NULL OR (length("name_hash") = 64 AND "name_hash" NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "categories_name_hash_present" CHECK (("name" IS NULL) = ("name_hash" IS NULL)),
  CONSTRAINT "categories_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "categories_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_unique" ON "categories" ("name_hash");
--> statement-breakpoint
CREATE TABLE "credit_card_bill_payments" (
  "id" text PRIMARY KEY NOT NULL,
  "bill_id" text,
  "transaction_id" text NOT NULL,
  "payment_date" text NOT NULL,
  "amount_cents" text NOT NULL,
  "kind" text NOT NULL,
  "idempotency_key" text NOT NULL,
  "idempotency_key_hash" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("bill_id") REFERENCES "credit_card_bills" ("id") ON DELETE set null ON UPDATE no action,
  FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "credit_card_bill_payments_payment_date_encrypted" CHECK ("payment_date" IS NULL OR (typeof("payment_date") = 'text' AND "payment_date" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bill_payments_amount_cents_encrypted" CHECK ("amount_cents" IS NULL OR (typeof("amount_cents") = 'text' AND "amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bill_payments_kind_encrypted" CHECK ("kind" IS NULL OR (typeof("kind") = 'text' AND "kind" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bill_payments_idempotency_key_encrypted" CHECK ("idempotency_key" IS NULL OR (typeof("idempotency_key") = 'text' AND "idempotency_key" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bill_payments_idempotency_key_hash_valid" CHECK ("idempotency_key_hash" IS NULL OR (length("idempotency_key_hash") = 64 AND "idempotency_key_hash" NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "credit_card_bill_payments_idempotency_key_hash_present" CHECK (("idempotency_key" IS NULL) = ("idempotency_key_hash" IS NULL)),
  CONSTRAINT "credit_card_bill_payments_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bill_payments_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "credit_card_bill_payments_transaction_unique" ON "credit_card_bill_payments" ("transaction_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "credit_card_bill_payments_idempotency_unique" ON "credit_card_bill_payments" ("idempotency_key_hash");
--> statement-breakpoint
CREATE INDEX "credit_card_bill_payments_bill_idx" ON "credit_card_bill_payments" ("bill_id");
--> statement-breakpoint
CREATE TABLE "credit_card_bills" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "invoice_month" text NOT NULL,
  "due_date" text NOT NULL,
  "statement_total_cents" text NOT NULL,
  "current_charges_total_cents" text NOT NULL,
  "prior_balance_cents" text NOT NULL,
  "pre_statement_payments_cents" text NOT NULL,
  "ignored_amount_cents" text NOT NULL,
  "status" text NOT NULL,
  "paid_at" text,
  "invoice_month_hash" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "credit_card_bills_invoice_month_encrypted" CHECK ("invoice_month" IS NULL OR (typeof("invoice_month") = 'text' AND "invoice_month" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bills_due_date_encrypted" CHECK ("due_date" IS NULL OR (typeof("due_date") = 'text' AND "due_date" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bills_statement_total_cents_encrypted" CHECK ("statement_total_cents" IS NULL OR (typeof("statement_total_cents") = 'text' AND "statement_total_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bills_current_charges_total_cents_encrypted" CHECK ("current_charges_total_cents" IS NULL OR (typeof("current_charges_total_cents") = 'text' AND "current_charges_total_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bills_prior_balance_cents_encrypted" CHECK ("prior_balance_cents" IS NULL OR (typeof("prior_balance_cents") = 'text' AND "prior_balance_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bills_pre_statement_payments_cents_encrypted" CHECK ("pre_statement_payments_cents" IS NULL OR (typeof("pre_statement_payments_cents") = 'text' AND "pre_statement_payments_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bills_ignored_amount_cents_encrypted" CHECK ("ignored_amount_cents" IS NULL OR (typeof("ignored_amount_cents") = 'text' AND "ignored_amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bills_status_encrypted" CHECK ("status" IS NULL OR (typeof("status") = 'text' AND "status" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bills_paid_at_encrypted" CHECK ("paid_at" IS NULL OR (typeof("paid_at") = 'text' AND "paid_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bills_invoice_month_hash_valid" CHECK ("invoice_month_hash" IS NULL OR (length("invoice_month_hash") = 64 AND "invoice_month_hash" NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "credit_card_bills_invoice_month_hash_present" CHECK (("invoice_month" IS NULL) = ("invoice_month_hash" IS NULL)),
  CONSTRAINT "credit_card_bills_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_bills_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "credit_card_bills_account_month_unique" ON "credit_card_bills" ("account_id","invoice_month_hash");
--> statement-breakpoint
CREATE INDEX "credit_card_bills_account_idx" ON "credit_card_bills" ("account_id");
--> statement-breakpoint
CREATE TABLE "credit_card_charges" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "category_id" text NOT NULL,
  "description" text NOT NULL,
  "notes" text,
  "purchase_date" text NOT NULL,
  "total_amount_cents" text NOT NULL,
  "installment_count" text NOT NULL,
  "kind" text NOT NULL,
  "first_invoice_month" text NOT NULL,
  "import_fingerprint" text,
  "import_fingerprint_hash" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE restrict ON UPDATE no action,
  FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "credit_card_charges_description_encrypted" CHECK ("description" IS NULL OR (typeof("description") = 'text' AND "description" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_charges_notes_encrypted" CHECK ("notes" IS NULL OR (typeof("notes") = 'text' AND "notes" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_charges_purchase_date_encrypted" CHECK ("purchase_date" IS NULL OR (typeof("purchase_date") = 'text' AND "purchase_date" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_charges_total_amount_cents_encrypted" CHECK ("total_amount_cents" IS NULL OR (typeof("total_amount_cents") = 'text' AND "total_amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_charges_installment_count_encrypted" CHECK ("installment_count" IS NULL OR (typeof("installment_count") = 'text' AND "installment_count" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_charges_kind_encrypted" CHECK ("kind" IS NULL OR (typeof("kind") = 'text' AND "kind" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_charges_first_invoice_month_encrypted" CHECK ("first_invoice_month" IS NULL OR (typeof("first_invoice_month") = 'text' AND "first_invoice_month" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_charges_import_fingerprint_encrypted" CHECK ("import_fingerprint" IS NULL OR (typeof("import_fingerprint") = 'text' AND "import_fingerprint" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_charges_import_fingerprint_hash_valid" CHECK ("import_fingerprint_hash" IS NULL OR (length("import_fingerprint_hash") = 64 AND "import_fingerprint_hash" NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "credit_card_charges_import_fingerprint_hash_present" CHECK (("import_fingerprint" IS NULL) = ("import_fingerprint_hash" IS NULL)),
  CONSTRAINT "credit_card_charges_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_charges_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE INDEX "credit_card_charges_account_idx" ON "credit_card_charges" ("account_id");
--> statement-breakpoint
CREATE INDEX "credit_card_charges_category_idx" ON "credit_card_charges" ("category_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "credit_card_charges_import_fingerprint_unique" ON "credit_card_charges" ("import_fingerprint_hash");
--> statement-breakpoint
CREATE TABLE "credit_card_installments" (
  "id" text PRIMARY KEY NOT NULL,
  "charge_id" text NOT NULL,
  "installment_number" text NOT NULL,
  "amount_cents" text NOT NULL,
  "invoice_month" text NOT NULL,
  "installment_number_hash" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("charge_id") REFERENCES "credit_card_charges" ("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "credit_card_installments_installment_number_encrypted" CHECK ("installment_number" IS NULL OR (typeof("installment_number") = 'text' AND "installment_number" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_installments_amount_cents_encrypted" CHECK ("amount_cents" IS NULL OR (typeof("amount_cents") = 'text' AND "amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_installments_invoice_month_encrypted" CHECK ("invoice_month" IS NULL OR (typeof("invoice_month") = 'text' AND "invoice_month" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_installments_installment_number_hash_valid" CHECK ("installment_number_hash" IS NULL OR (length("installment_number_hash") = 64 AND "installment_number_hash" NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "credit_card_installments_installment_number_hash_present" CHECK (("installment_number" IS NULL) = ("installment_number_hash" IS NULL)),
  CONSTRAINT "credit_card_installments_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "credit_card_installments_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE INDEX "credit_card_installments_charge_idx" ON "credit_card_installments" ("charge_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "credit_card_installments_charge_number_unique" ON "credit_card_installments" ("charge_id","installment_number_hash");
--> statement-breakpoint
CREATE TABLE "financial_goal_allocations" (
  "id" text PRIMARY KEY NOT NULL,
  "goal_id" text NOT NULL,
  "transaction_id" text,
  "type" text NOT NULL,
  "amount_cents" text NOT NULL,
  "occurred_on" text NOT NULL,
  "notes" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("goal_id") REFERENCES "financial_goals" ("id") ON DELETE cascade ON UPDATE no action,
  FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "financial_goal_allocations_type_encrypted" CHECK ("type" IS NULL OR (typeof("type") = 'text' AND "type" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goal_allocations_amount_cents_encrypted" CHECK ("amount_cents" IS NULL OR (typeof("amount_cents") = 'text' AND "amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goal_allocations_occurred_on_encrypted" CHECK ("occurred_on" IS NULL OR (typeof("occurred_on") = 'text' AND "occurred_on" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goal_allocations_notes_encrypted" CHECK ("notes" IS NULL OR (typeof("notes") = 'text' AND "notes" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goal_allocations_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goal_allocations_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE INDEX "financial_goal_allocations_goal_idx" ON "financial_goal_allocations" ("goal_id");
--> statement-breakpoint
CREATE INDEX "financial_goal_allocations_transaction_idx" ON "financial_goal_allocations" ("transaction_id");
--> statement-breakpoint
CREATE TABLE "financial_goals" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "target_amount_cents" text NOT NULL,
  "target_date" text,
  "planned_monthly_contribution_cents" text NOT NULL,
  "priority" text NOT NULL,
  "status" text NOT NULL,
  "color" text NOT NULL,
  "notes" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  CONSTRAINT "financial_goals_name_encrypted" CHECK ("name" IS NULL OR (typeof("name") = 'text' AND "name" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goals_category_encrypted" CHECK ("category" IS NULL OR (typeof("category") = 'text' AND "category" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goals_target_amount_cents_encrypted" CHECK ("target_amount_cents" IS NULL OR (typeof("target_amount_cents") = 'text' AND "target_amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goals_target_date_encrypted" CHECK ("target_date" IS NULL OR (typeof("target_date") = 'text' AND "target_date" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goals_planned_monthly_contribution_cents_encrypted" CHECK ("planned_monthly_contribution_cents" IS NULL OR (typeof("planned_monthly_contribution_cents") = 'text' AND "planned_monthly_contribution_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goals_priority_encrypted" CHECK ("priority" IS NULL OR (typeof("priority") = 'text' AND "priority" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goals_status_encrypted" CHECK ("status" IS NULL OR (typeof("status") = 'text' AND "status" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goals_color_encrypted" CHECK ("color" IS NULL OR (typeof("color") = 'text' AND "color" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goals_notes_encrypted" CHECK ("notes" IS NULL OR (typeof("notes") = 'text' AND "notes" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goals_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "financial_goals_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE TABLE "fixed_income_terms" (
  "id" text PRIMARY KEY NOT NULL,
  "holding_id" text NOT NULL UNIQUE,
  "subtype" text NOT NULL,
  "issuer" text,
  "indexer" text,
  "indexer_percentage_bps" text,
  "rate_bps" text,
  "maturity_date" text,
  "liquidity" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("holding_id") REFERENCES "investment_holdings" ("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "fixed_income_terms_subtype_encrypted" CHECK ("subtype" IS NULL OR (typeof("subtype") = 'text' AND "subtype" LIKE 'pfc:v2:%')),
  CONSTRAINT "fixed_income_terms_issuer_encrypted" CHECK ("issuer" IS NULL OR (typeof("issuer") = 'text' AND "issuer" LIKE 'pfc:v2:%')),
  CONSTRAINT "fixed_income_terms_indexer_encrypted" CHECK ("indexer" IS NULL OR (typeof("indexer") = 'text' AND "indexer" LIKE 'pfc:v2:%')),
  CONSTRAINT "fixed_income_terms_indexer_percentage_bps_encrypted" CHECK ("indexer_percentage_bps" IS NULL OR (typeof("indexer_percentage_bps") = 'text' AND "indexer_percentage_bps" LIKE 'pfc:v2:%')),
  CONSTRAINT "fixed_income_terms_rate_bps_encrypted" CHECK ("rate_bps" IS NULL OR (typeof("rate_bps") = 'text' AND "rate_bps" LIKE 'pfc:v2:%')),
  CONSTRAINT "fixed_income_terms_maturity_date_encrypted" CHECK ("maturity_date" IS NULL OR (typeof("maturity_date") = 'text' AND "maturity_date" LIKE 'pfc:v2:%')),
  CONSTRAINT "fixed_income_terms_liquidity_encrypted" CHECK ("liquidity" IS NULL OR (typeof("liquidity") = 'text' AND "liquidity" LIKE 'pfc:v2:%')),
  CONSTRAINT "fixed_income_terms_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "fixed_income_terms_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE TABLE "investment_holdings" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "ticker" text,
  "institution_name" text,
  "asset_class" text NOT NULL,
  "instrument_type" text NOT NULL,
  "valuation_mode" text NOT NULL,
  "currency" text NOT NULL,
  "quote_symbol" text,
  "external_provider" text,
  "external_asset_id" text,
  "current_value_cents" text NOT NULL,
  "value_as_of" text NOT NULL,
  "notes" text,
  "is_archived" text NOT NULL,
  "active_quote_symbol_hash" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  CONSTRAINT "investment_holdings_name_encrypted" CHECK ("name" IS NULL OR (typeof("name") = 'text' AND "name" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_ticker_encrypted" CHECK ("ticker" IS NULL OR (typeof("ticker") = 'text' AND "ticker" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_institution_name_encrypted" CHECK ("institution_name" IS NULL OR (typeof("institution_name") = 'text' AND "institution_name" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_asset_class_encrypted" CHECK ("asset_class" IS NULL OR (typeof("asset_class") = 'text' AND "asset_class" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_instrument_type_encrypted" CHECK ("instrument_type" IS NULL OR (typeof("instrument_type") = 'text' AND "instrument_type" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_valuation_mode_encrypted" CHECK ("valuation_mode" IS NULL OR (typeof("valuation_mode") = 'text' AND "valuation_mode" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_currency_encrypted" CHECK ("currency" IS NULL OR (typeof("currency") = 'text' AND "currency" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_quote_symbol_encrypted" CHECK ("quote_symbol" IS NULL OR (typeof("quote_symbol") = 'text' AND "quote_symbol" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_external_provider_encrypted" CHECK ("external_provider" IS NULL OR (typeof("external_provider") = 'text' AND "external_provider" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_external_asset_id_encrypted" CHECK ("external_asset_id" IS NULL OR (typeof("external_asset_id") = 'text' AND "external_asset_id" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_current_value_cents_encrypted" CHECK ("current_value_cents" IS NULL OR (typeof("current_value_cents") = 'text' AND "current_value_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_value_as_of_encrypted" CHECK ("value_as_of" IS NULL OR (typeof("value_as_of") = 'text' AND "value_as_of" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_notes_encrypted" CHECK ("notes" IS NULL OR (typeof("notes") = 'text' AND "notes" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_is_archived_encrypted" CHECK ("is_archived" IS NULL OR (typeof("is_archived") = 'text' AND "is_archived" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_active_quote_symbol_hash_valid" CHECK ("active_quote_symbol_hash" IS NULL OR (length("active_quote_symbol_hash") = 64 AND "active_quote_symbol_hash" NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "investment_holdings_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_holdings_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "investment_holdings_active_quote_symbol_unique" ON "investment_holdings" ("active_quote_symbol_hash");
--> statement-breakpoint
CREATE TABLE "investment_operations" (
  "id" text PRIMARY KEY NOT NULL,
  "holding_id" text NOT NULL,
  "type" text NOT NULL,
  "operated_on" text NOT NULL,
  "settled_on" text,
  "quantity_units" text NOT NULL,
  "unit_price_cents" text,
  "gross_amount_cents" text NOT NULL,
  "fees_cents" text NOT NULL,
  "target_cost_cents" text,
  "notes" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("holding_id") REFERENCES "investment_holdings" ("id") ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "investment_operations_type_encrypted" CHECK ("type" IS NULL OR (typeof("type") = 'text' AND "type" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_operations_operated_on_encrypted" CHECK ("operated_on" IS NULL OR (typeof("operated_on") = 'text' AND "operated_on" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_operations_settled_on_encrypted" CHECK ("settled_on" IS NULL OR (typeof("settled_on") = 'text' AND "settled_on" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_operations_quantity_units_encrypted" CHECK ("quantity_units" IS NULL OR (typeof("quantity_units") = 'text' AND "quantity_units" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_operations_unit_price_cents_encrypted" CHECK ("unit_price_cents" IS NULL OR (typeof("unit_price_cents") = 'text' AND "unit_price_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_operations_gross_amount_cents_encrypted" CHECK ("gross_amount_cents" IS NULL OR (typeof("gross_amount_cents") = 'text' AND "gross_amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_operations_fees_cents_encrypted" CHECK ("fees_cents" IS NULL OR (typeof("fees_cents") = 'text' AND "fees_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_operations_target_cost_cents_encrypted" CHECK ("target_cost_cents" IS NULL OR (typeof("target_cost_cents") = 'text' AND "target_cost_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_operations_notes_encrypted" CHECK ("notes" IS NULL OR (typeof("notes") = 'text' AND "notes" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_operations_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_operations_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE INDEX "investment_operations_holding_idx" ON "investment_operations" ("holding_id");
--> statement-breakpoint
CREATE TABLE "investment_portfolio" (
  "id" text PRIMARY KEY NOT NULL,
  "checkpoint_balance_cents" text NOT NULL,
  "expected_monthly_rate_bps" text NOT NULL,
  "checkpoint_date" text NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  CONSTRAINT "investment_portfolio_checkpoint_balance_cents_encrypted" CHECK ("checkpoint_balance_cents" IS NULL OR (typeof("checkpoint_balance_cents") = 'text' AND "checkpoint_balance_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_portfolio_expected_monthly_rate_bps_encrypted" CHECK ("expected_monthly_rate_bps" IS NULL OR (typeof("expected_monthly_rate_bps") = 'text' AND "expected_monthly_rate_bps" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_portfolio_checkpoint_date_encrypted" CHECK ("checkpoint_date" IS NULL OR (typeof("checkpoint_date") = 'text' AND "checkpoint_date" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_portfolio_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_portfolio_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE TABLE "investment_portfolio_snapshots" (
  "id" text PRIMARY KEY NOT NULL,
  "snapshot_date" text NOT NULL,
  "known_cost_cents" text NOT NULL,
  "known_value_cents" text NOT NULL,
  "total_value_cents" text NOT NULL,
  "unrealized_result_cents" text NOT NULL,
  "snapshot_date_hash" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  CONSTRAINT "investment_portfolio_snapshots_snapshot_date_encrypted" CHECK ("snapshot_date" IS NULL OR (typeof("snapshot_date") = 'text' AND "snapshot_date" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_portfolio_snapshots_known_cost_cents_encrypted" CHECK ("known_cost_cents" IS NULL OR (typeof("known_cost_cents") = 'text' AND "known_cost_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_portfolio_snapshots_known_value_cents_encrypted" CHECK ("known_value_cents" IS NULL OR (typeof("known_value_cents") = 'text' AND "known_value_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_portfolio_snapshots_total_value_cents_encrypted" CHECK ("total_value_cents" IS NULL OR (typeof("total_value_cents") = 'text' AND "total_value_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_portfolio_snapshots_unrealized_result_cents_encrypted" CHECK ("unrealized_result_cents" IS NULL OR (typeof("unrealized_result_cents") = 'text' AND "unrealized_result_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_portfolio_snapshots_snapshot_date_hash_valid" CHECK ("snapshot_date_hash" IS NULL OR (length("snapshot_date_hash") = 64 AND "snapshot_date_hash" NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "investment_portfolio_snapshots_snapshot_date_hash_present" CHECK (("snapshot_date" IS NULL) = ("snapshot_date_hash" IS NULL)),
  CONSTRAINT "investment_portfolio_snapshots_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_portfolio_snapshots_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "investment_portfolio_snapshots_date_unique" ON "investment_portfolio_snapshots" ("snapshot_date_hash");
--> statement-breakpoint
CREATE TABLE "investment_position_snapshots" (
  "id" text PRIMARY KEY NOT NULL,
  "holding_id" text NOT NULL,
  "snapshot_date" text NOT NULL,
  "quantity_units" text NOT NULL,
  "cost_cents" text,
  "current_value_cents" text NOT NULL,
  "unit_price_cents" text,
  "valuation_source" text NOT NULL,
  "snapshot_date_hash" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("holding_id") REFERENCES "investment_holdings" ("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "investment_position_snapshots_snapshot_date_encrypted" CHECK ("snapshot_date" IS NULL OR (typeof("snapshot_date") = 'text' AND "snapshot_date" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_position_snapshots_quantity_units_encrypted" CHECK ("quantity_units" IS NULL OR (typeof("quantity_units") = 'text' AND "quantity_units" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_position_snapshots_cost_cents_encrypted" CHECK ("cost_cents" IS NULL OR (typeof("cost_cents") = 'text' AND "cost_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_position_snapshots_current_value_cents_encrypted" CHECK ("current_value_cents" IS NULL OR (typeof("current_value_cents") = 'text' AND "current_value_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_position_snapshots_unit_price_cents_encrypted" CHECK ("unit_price_cents" IS NULL OR (typeof("unit_price_cents") = 'text' AND "unit_price_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_position_snapshots_valuation_source_encrypted" CHECK ("valuation_source" IS NULL OR (typeof("valuation_source") = 'text' AND "valuation_source" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_position_snapshots_snapshot_date_hash_valid" CHECK ("snapshot_date_hash" IS NULL OR (length("snapshot_date_hash") = 64 AND "snapshot_date_hash" NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "investment_position_snapshots_snapshot_date_hash_present" CHECK (("snapshot_date" IS NULL) = ("snapshot_date_hash" IS NULL)),
  CONSTRAINT "investment_position_snapshots_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_position_snapshots_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "investment_position_snapshots_holding_date_unique" ON "investment_position_snapshots" ("holding_id","snapshot_date_hash");
--> statement-breakpoint
CREATE INDEX "investment_position_snapshots_date_idx" ON "investment_position_snapshots" ("snapshot_date_hash");
--> statement-breakpoint
CREATE TABLE "investment_purpose_allocations" (
  "id" text PRIMARY KEY NOT NULL,
  "holding_id" text NOT NULL,
  "purpose_id" text NOT NULL,
  "amount_cents" text NOT NULL,
  "allocated_on" text NOT NULL,
  "notes" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("holding_id") REFERENCES "investment_holdings" ("id") ON DELETE restrict ON UPDATE no action,
  FOREIGN KEY ("purpose_id") REFERENCES "investment_purposes" ("id") ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "investment_purpose_allocations_amount_cents_encrypted" CHECK ("amount_cents" IS NULL OR (typeof("amount_cents") = 'text' AND "amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_purpose_allocations_allocated_on_encrypted" CHECK ("allocated_on" IS NULL OR (typeof("allocated_on") = 'text' AND "allocated_on" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_purpose_allocations_notes_encrypted" CHECK ("notes" IS NULL OR (typeof("notes") = 'text' AND "notes" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_purpose_allocations_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_purpose_allocations_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE INDEX "investment_purpose_allocations_holding_idx" ON "investment_purpose_allocations" ("holding_id");
--> statement-breakpoint
CREATE INDEX "investment_purpose_allocations_purpose_idx" ON "investment_purpose_allocations" ("purpose_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "investment_purpose_allocations_holding_purpose_unique" ON "investment_purpose_allocations" ("holding_id","purpose_id");
--> statement-breakpoint
CREATE TABLE "investment_purposes" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "kind" text NOT NULL,
  "target_amount_cents" text,
  "color" text NOT NULL,
  "notes" text,
  "is_archived" text NOT NULL,
  "active_emergency_hash" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  CONSTRAINT "investment_purposes_name_encrypted" CHECK ("name" IS NULL OR (typeof("name") = 'text' AND "name" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_purposes_kind_encrypted" CHECK ("kind" IS NULL OR (typeof("kind") = 'text' AND "kind" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_purposes_target_amount_cents_encrypted" CHECK ("target_amount_cents" IS NULL OR (typeof("target_amount_cents") = 'text' AND "target_amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_purposes_color_encrypted" CHECK ("color" IS NULL OR (typeof("color") = 'text' AND "color" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_purposes_notes_encrypted" CHECK ("notes" IS NULL OR (typeof("notes") = 'text' AND "notes" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_purposes_is_archived_encrypted" CHECK ("is_archived" IS NULL OR (typeof("is_archived") = 'text' AND "is_archived" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_purposes_active_emergency_hash_valid" CHECK ("active_emergency_hash" IS NULL OR (length("active_emergency_hash") = 64 AND "active_emergency_hash" NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "investment_purposes_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_purposes_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "investment_purposes_active_emergency_unique" ON "investment_purposes" ("active_emergency_hash");
--> statement-breakpoint
CREATE TABLE "investment_quotes" (
  "id" text PRIMARY KEY NOT NULL,
  "holding_id" text NOT NULL,
  "quoted_on" text NOT NULL,
  "unit_price_cents" text NOT NULL,
  "source" text NOT NULL,
  "provider" text NOT NULL,
  "symbol" text,
  "currency" text NOT NULL,
  "quoted_at" text,
  "fetched_at" text,
  "market_state" text NOT NULL,
  "is_stale" text NOT NULL,
  "quoted_on_hash" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("holding_id") REFERENCES "investment_holdings" ("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "investment_quotes_quoted_on_encrypted" CHECK ("quoted_on" IS NULL OR (typeof("quoted_on") = 'text' AND "quoted_on" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_quotes_unit_price_cents_encrypted" CHECK ("unit_price_cents" IS NULL OR (typeof("unit_price_cents") = 'text' AND "unit_price_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_quotes_source_encrypted" CHECK ("source" IS NULL OR (typeof("source") = 'text' AND "source" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_quotes_provider_encrypted" CHECK ("provider" IS NULL OR (typeof("provider") = 'text' AND "provider" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_quotes_symbol_encrypted" CHECK ("symbol" IS NULL OR (typeof("symbol") = 'text' AND "symbol" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_quotes_currency_encrypted" CHECK ("currency" IS NULL OR (typeof("currency") = 'text' AND "currency" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_quotes_quoted_at_encrypted" CHECK ("quoted_at" IS NULL OR (typeof("quoted_at") = 'text' AND "quoted_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_quotes_fetched_at_encrypted" CHECK ("fetched_at" IS NULL OR (typeof("fetched_at") = 'text' AND "fetched_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_quotes_market_state_encrypted" CHECK ("market_state" IS NULL OR (typeof("market_state") = 'text' AND "market_state" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_quotes_is_stale_encrypted" CHECK ("is_stale" IS NULL OR (typeof("is_stale") = 'text' AND "is_stale" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_quotes_quoted_on_hash_valid" CHECK ("quoted_on_hash" IS NULL OR (length("quoted_on_hash") = 64 AND "quoted_on_hash" NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "investment_quotes_quoted_on_hash_present" CHECK (("quoted_on" IS NULL) = ("quoted_on_hash" IS NULL)),
  CONSTRAINT "investment_quotes_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_quotes_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE INDEX "investment_quotes_holding_idx" ON "investment_quotes" ("holding_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "investment_quotes_holding_date_unique" ON "investment_quotes" ("holding_id","quoted_on_hash");
--> statement-breakpoint
CREATE TABLE "investment_reduction_events" (
  "id" text PRIMARY KEY NOT NULL,
  "type" text NOT NULL,
  "status" text NOT NULL,
  "transaction_id" text,
  "amount_cents" text NOT NULL,
  "occurred_on" text NOT NULL,
  "reversed_at" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "investment_reduction_events_type_encrypted" CHECK ("type" IS NULL OR (typeof("type") = 'text' AND "type" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_reduction_events_status_encrypted" CHECK ("status" IS NULL OR (typeof("status") = 'text' AND "status" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_reduction_events_amount_cents_encrypted" CHECK ("amount_cents" IS NULL OR (typeof("amount_cents") = 'text' AND "amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_reduction_events_occurred_on_encrypted" CHECK ("occurred_on" IS NULL OR (typeof("occurred_on") = 'text' AND "occurred_on" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_reduction_events_reversed_at_encrypted" CHECK ("reversed_at" IS NULL OR (typeof("reversed_at") = 'text' AND "reversed_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_reduction_events_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_reduction_events_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE INDEX "investment_reduction_events_transaction_idx" ON "investment_reduction_events" ("transaction_id");
--> statement-breakpoint
CREATE TABLE "investment_reduction_sources" (
  "id" text PRIMARY KEY NOT NULL,
  "event_id" text NOT NULL,
  "source_type" text NOT NULL,
  "holding_id" text,
  "purpose_id" text,
  "allocation_id" text,
  "amount_cents" text NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("event_id") REFERENCES "investment_reduction_events" ("id") ON DELETE cascade ON UPDATE no action,
  FOREIGN KEY ("holding_id") REFERENCES "investment_holdings" ("id") ON DELETE set null ON UPDATE no action,
  FOREIGN KEY ("purpose_id") REFERENCES "investment_purposes" ("id") ON DELETE set null ON UPDATE no action,
  FOREIGN KEY ("allocation_id") REFERENCES "investment_purpose_allocations" ("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "investment_reduction_sources_source_type_encrypted" CHECK ("source_type" IS NULL OR (typeof("source_type") = 'text' AND "source_type" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_reduction_sources_amount_cents_encrypted" CHECK ("amount_cents" IS NULL OR (typeof("amount_cents") = 'text' AND "amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_reduction_sources_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "investment_reduction_sources_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE INDEX "investment_reduction_sources_event_idx" ON "investment_reduction_sources" ("event_id");
--> statement-breakpoint
CREATE INDEX "investment_reduction_sources_holding_idx" ON "investment_reduction_sources" ("holding_id");
--> statement-breakpoint
CREATE INDEX "investment_reduction_sources_purpose_idx" ON "investment_reduction_sources" ("purpose_id");
--> statement-breakpoint
CREATE INDEX "investment_reduction_sources_allocation_idx" ON "investment_reduction_sources" ("allocation_id");
--> statement-breakpoint
CREATE TABLE "recurring_templates" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "category_id" text NOT NULL,
  "type" text NOT NULL,
  "status" text NOT NULL,
  "amount_cents" text NOT NULL,
  "day_of_month" text NOT NULL,
  "start_month" text NOT NULL,
  "end_month" text,
  "last_generated_month" text,
  "description" text NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE restrict ON UPDATE no action,
  FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "recurring_templates_type_encrypted" CHECK ("type" IS NULL OR (typeof("type") = 'text' AND "type" LIKE 'pfc:v2:%')),
  CONSTRAINT "recurring_templates_status_encrypted" CHECK ("status" IS NULL OR (typeof("status") = 'text' AND "status" LIKE 'pfc:v2:%')),
  CONSTRAINT "recurring_templates_amount_cents_encrypted" CHECK ("amount_cents" IS NULL OR (typeof("amount_cents") = 'text' AND "amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "recurring_templates_day_of_month_encrypted" CHECK ("day_of_month" IS NULL OR (typeof("day_of_month") = 'text' AND "day_of_month" LIKE 'pfc:v2:%')),
  CONSTRAINT "recurring_templates_start_month_encrypted" CHECK ("start_month" IS NULL OR (typeof("start_month") = 'text' AND "start_month" LIKE 'pfc:v2:%')),
  CONSTRAINT "recurring_templates_end_month_encrypted" CHECK ("end_month" IS NULL OR (typeof("end_month") = 'text' AND "end_month" LIKE 'pfc:v2:%')),
  CONSTRAINT "recurring_templates_last_generated_month_encrypted" CHECK ("last_generated_month" IS NULL OR (typeof("last_generated_month") = 'text' AND "last_generated_month" LIKE 'pfc:v2:%')),
  CONSTRAINT "recurring_templates_description_encrypted" CHECK ("description" IS NULL OR (typeof("description") = 'text' AND "description" LIKE 'pfc:v2:%')),
  CONSTRAINT "recurring_templates_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "recurring_templates_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE INDEX "recurring_templates_account_idx" ON "recurring_templates" ("account_id");
--> statement-breakpoint
CREATE INDEX "recurring_templates_category_idx" ON "recurring_templates" ("category_id");
--> statement-breakpoint
CREATE TABLE "transaction_funding_links" (
  "id" text PRIMARY KEY NOT NULL,
  "expense_transaction_id" text NOT NULL,
  "withdrawal_transaction_id" text NOT NULL,
  "type" text NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("expense_transaction_id") REFERENCES "transactions" ("id") ON DELETE cascade ON UPDATE no action,
  FOREIGN KEY ("withdrawal_transaction_id") REFERENCES "transactions" ("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "transaction_funding_links_type_encrypted" CHECK ("type" IS NULL OR (typeof("type") = 'text' AND "type" LIKE 'pfc:v2:%')),
  CONSTRAINT "transaction_funding_links_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "transaction_funding_links_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_funding_links_expense_unique" ON "transaction_funding_links" ("expense_transaction_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_funding_links_withdrawal_unique" ON "transaction_funding_links" ("withdrawal_transaction_id");
--> statement-breakpoint
CREATE TABLE "transactions" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "category_id" text,
  "recurring_template_id" text,
  "type" text NOT NULL,
  "status" text NOT NULL,
  "amount_cents" text NOT NULL,
  "transaction_date" text NOT NULL,
  "competence_month" text NOT NULL,
  "description" text NOT NULL,
  "notes" text,
  "import_fingerprint" text,
  "is_included_in_investment_checkpoint" text NOT NULL,
  "import_fingerprint_hash" text,
  "competence_month_hash" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE restrict ON UPDATE no action,
  FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE restrict ON UPDATE no action,
  FOREIGN KEY ("recurring_template_id") REFERENCES "recurring_templates" ("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "transactions_type_encrypted" CHECK ("type" IS NULL OR (typeof("type") = 'text' AND "type" LIKE 'pfc:v2:%')),
  CONSTRAINT "transactions_status_encrypted" CHECK ("status" IS NULL OR (typeof("status") = 'text' AND "status" LIKE 'pfc:v2:%')),
  CONSTRAINT "transactions_amount_cents_encrypted" CHECK ("amount_cents" IS NULL OR (typeof("amount_cents") = 'text' AND "amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "transactions_transaction_date_encrypted" CHECK ("transaction_date" IS NULL OR (typeof("transaction_date") = 'text' AND "transaction_date" LIKE 'pfc:v2:%')),
  CONSTRAINT "transactions_competence_month_encrypted" CHECK ("competence_month" IS NULL OR (typeof("competence_month") = 'text' AND "competence_month" LIKE 'pfc:v2:%')),
  CONSTRAINT "transactions_description_encrypted" CHECK ("description" IS NULL OR (typeof("description") = 'text' AND "description" LIKE 'pfc:v2:%')),
  CONSTRAINT "transactions_notes_encrypted" CHECK ("notes" IS NULL OR (typeof("notes") = 'text' AND "notes" LIKE 'pfc:v2:%')),
  CONSTRAINT "transactions_import_fingerprint_encrypted" CHECK ("import_fingerprint" IS NULL OR (typeof("import_fingerprint") = 'text' AND "import_fingerprint" LIKE 'pfc:v2:%')),
  CONSTRAINT "transactions_is_included_in_investment_checkpoint_encrypted" CHECK ("is_included_in_investment_checkpoint" IS NULL OR (typeof("is_included_in_investment_checkpoint") = 'text' AND "is_included_in_investment_checkpoint" LIKE 'pfc:v2:%')),
  CONSTRAINT "transactions_import_fingerprint_hash_valid" CHECK ("import_fingerprint_hash" IS NULL OR (length("import_fingerprint_hash") = 64 AND "import_fingerprint_hash" NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "transactions_import_fingerprint_hash_present" CHECK (("import_fingerprint" IS NULL) = ("import_fingerprint_hash" IS NULL)),
  CONSTRAINT "transactions_competence_month_hash_valid" CHECK ("competence_month_hash" IS NULL OR (length("competence_month_hash") = 64 AND "competence_month_hash" NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "transactions_competence_month_hash_present" CHECK (("competence_month" IS NULL) = ("competence_month_hash" IS NULL)),
  CONSTRAINT "transactions_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "transactions_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE INDEX "transactions_account_idx" ON "transactions" ("account_id");
--> statement-breakpoint
CREATE INDEX "transactions_category_idx" ON "transactions" ("category_id");
--> statement-breakpoint
CREATE INDEX "transactions_competence_idx" ON "transactions" ("competence_month_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_import_fingerprint_unique" ON "transactions" ("import_fingerprint_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_recurring_month_unique" ON "transactions" ("recurring_template_id","competence_month_hash");
--> statement-breakpoint
CREATE TABLE "transfers" (
  "id" text PRIMARY KEY NOT NULL,
  "from_account_id" text NOT NULL,
  "to_account_id" text NOT NULL,
  "amount_cents" text NOT NULL,
  "transfer_date" text NOT NULL,
  "competence_month" text NOT NULL,
  "description" text NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  FOREIGN KEY ("from_account_id") REFERENCES "accounts" ("id") ON DELETE restrict ON UPDATE no action,
  FOREIGN KEY ("to_account_id") REFERENCES "accounts" ("id") ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "transfers_amount_cents_encrypted" CHECK ("amount_cents" IS NULL OR (typeof("amount_cents") = 'text' AND "amount_cents" LIKE 'pfc:v2:%')),
  CONSTRAINT "transfers_transfer_date_encrypted" CHECK ("transfer_date" IS NULL OR (typeof("transfer_date") = 'text' AND "transfer_date" LIKE 'pfc:v2:%')),
  CONSTRAINT "transfers_competence_month_encrypted" CHECK ("competence_month" IS NULL OR (typeof("competence_month") = 'text' AND "competence_month" LIKE 'pfc:v2:%')),
  CONSTRAINT "transfers_description_encrypted" CHECK ("description" IS NULL OR (typeof("description") = 'text' AND "description" LIKE 'pfc:v2:%')),
  CONSTRAINT "transfers_created_at_encrypted" CHECK ("created_at" IS NULL OR (typeof("created_at") = 'text' AND "created_at" LIKE 'pfc:v2:%')),
  CONSTRAINT "transfers_updated_at_encrypted" CHECK ("updated_at" IS NULL OR (typeof("updated_at") = 'text' AND "updated_at" LIKE 'pfc:v2:%'))
);
--> statement-breakpoint
CREATE INDEX "transfers_from_account_idx" ON "transfers" ("from_account_id");
--> statement-breakpoint
CREATE INDEX "transfers_to_account_idx" ON "transfers" ("to_account_id");
