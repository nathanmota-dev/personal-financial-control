ALTER TABLE `investment_holdings` ADD `tracking_mode` text DEFAULT 'legacy_balance' NOT NULL;
--> statement-breakpoint
ALTER TABLE `investment_holdings` ADD `valuation_mode` text DEFAULT 'manual_balance' NOT NULL;
--> statement-breakpoint
ALTER TABLE `investment_holdings` ADD `currency` text DEFAULT 'BRL' NOT NULL;
--> statement-breakpoint
ALTER TABLE `investment_holdings` ADD `quote_symbol` text;
--> statement-breakpoint
ALTER TABLE `investment_holdings` ADD `external_provider` text;
--> statement-breakpoint
ALTER TABLE `investment_holdings` ADD `external_asset_id` text;
--> statement-breakpoint
ALTER TABLE `investment_purposes` ADD `kind` text DEFAULT 'general' NOT NULL;
--> statement-breakpoint
UPDATE `investment_purposes`
SET `kind` = 'emergency_reserve'
WHERE lower(trim(`name`)) = 'reserva de emergência'
  AND (SELECT count(*) FROM `investment_purposes` WHERE lower(trim(`name`)) = 'reserva de emergência' AND `is_archived` = 0) = 1;
--> statement-breakpoint
CREATE UNIQUE INDEX `investment_purposes_single_active_reserve`
ON `investment_purposes` (`kind`)
WHERE `kind` = 'emergency_reserve' AND `is_archived` = 0;
--> statement-breakpoint
CREATE TABLE `investment_operations` (
  `id` text PRIMARY KEY NOT NULL,
  `holding_id` text NOT NULL,
  `type` text NOT NULL,
  `operated_on` text NOT NULL,
  `settled_on` text,
  `quantity_units` integer DEFAULT 0 NOT NULL,
  `unit_price_cents` text,
  `gross_amount_cents` text NOT NULL,
  `fees_cents` text NOT NULL,
  `target_cost_cents` text,
  `notes` text,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`holding_id`) REFERENCES `investment_holdings`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `investment_operations_holding_idx` ON `investment_operations` (`holding_id`);
--> statement-breakpoint
CREATE INDEX `investment_operations_date_idx` ON `investment_operations` (`operated_on`);
--> statement-breakpoint
CREATE TABLE `investment_quotes` (
  `id` text PRIMARY KEY NOT NULL,
  `holding_id` text NOT NULL,
  `quoted_on` text NOT NULL,
  `unit_price_cents` text NOT NULL,
  `source` text DEFAULT 'manual' NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`holding_id`) REFERENCES `investment_holdings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `investment_quotes_holding_idx` ON `investment_quotes` (`holding_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `investment_quotes_holding_date_unique` ON `investment_quotes` (`holding_id`,`quoted_on`);
--> statement-breakpoint
CREATE TABLE `fixed_income_terms` (
  `id` text PRIMARY KEY NOT NULL,
  `holding_id` text NOT NULL UNIQUE,
  `subtype` text NOT NULL,
  `issuer` text,
  `indexer` text,
  `rate_bps` integer,
  `maturity_date` text,
  `liquidity` text,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`holding_id`) REFERENCES `investment_holdings`(`id`) ON UPDATE no action ON DELETE cascade
);
