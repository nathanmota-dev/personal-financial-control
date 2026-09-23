ALTER TABLE `investment_quotes` ADD `provider` text DEFAULT 'manual' NOT NULL;
--> statement-breakpoint
ALTER TABLE `investment_quotes` ADD `symbol` text;
--> statement-breakpoint
ALTER TABLE `investment_quotes` ADD `currency` text DEFAULT 'BRL' NOT NULL;
--> statement-breakpoint
ALTER TABLE `investment_quotes` ADD `quoted_at` integer;
--> statement-breakpoint
ALTER TABLE `investment_quotes` ADD `fetched_at` integer;
--> statement-breakpoint
ALTER TABLE `investment_quotes` ADD `market_state` text DEFAULT 'unknown' NOT NULL;
--> statement-breakpoint
ALTER TABLE `investment_quotes` ADD `is_stale` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE `investment_quotes` SET `provider` = 'manual', `fetched_at` = `updated_at`;
--> statement-breakpoint
ALTER TABLE `fixed_income_terms` ADD `indexer_percentage_bps` integer;
--> statement-breakpoint
CREATE UNIQUE INDEX `investment_holdings_active_quote_symbol_unique`
ON `investment_holdings` (upper(trim(`quote_symbol`)))
WHERE `is_archived` = 0 AND `quote_symbol` IS NOT NULL;
--> statement-breakpoint
CREATE TABLE `investment_position_snapshots` (
  `id` text PRIMARY KEY NOT NULL,
  `holding_id` text NOT NULL,
  `snapshot_date` text NOT NULL,
  `quantity_units` integer DEFAULT 0 NOT NULL,
  `cost_cents` text,
  `current_value_cents` text NOT NULL,
  `unit_price_cents` text,
  `valuation_source` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`holding_id`) REFERENCES `investment_holdings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `investment_position_snapshots_holding_date_unique` ON `investment_position_snapshots` (`holding_id`,`snapshot_date`);
--> statement-breakpoint
CREATE INDEX `investment_position_snapshots_date_idx` ON `investment_position_snapshots` (`snapshot_date`);
--> statement-breakpoint
CREATE TABLE `investment_portfolio_snapshots` (
  `id` text PRIMARY KEY NOT NULL,
  `snapshot_date` text NOT NULL,
  `known_cost_cents` text NOT NULL,
  `known_value_cents` text NOT NULL,
  `total_value_cents` text NOT NULL,
  `unrealized_result_cents` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `investment_portfolio_snapshots_date_unique` ON `investment_portfolio_snapshots` (`snapshot_date`);
