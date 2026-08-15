CREATE TABLE `investment_holdings` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`ticker` text,
	`institution_name` text,
	`asset_class` text NOT NULL,
	`instrument_type` text NOT NULL,
	`current_value_cents` text NOT NULL CHECK (typeof(`current_value_cents`) = 'text' AND `current_value_cents` LIKE 'pfc:v1:%'),
	`value_as_of` text NOT NULL,
	`notes` text,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `investment_holdings_class_idx` ON `investment_holdings` (`asset_class`);
--> statement-breakpoint
CREATE INDEX `investment_holdings_archived_idx` ON `investment_holdings` (`is_archived`);
--> statement-breakpoint
CREATE TABLE `investment_purposes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`target_amount_cents` text CHECK (`target_amount_cents` IS NULL OR (typeof(`target_amount_cents`) = 'text' AND `target_amount_cents` LIKE 'pfc:v1:%')),
	`color` text DEFAULT '#22d3ee' NOT NULL,
	`notes` text,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `investment_purposes_archived_idx` ON `investment_purposes` (`is_archived`);
--> statement-breakpoint
CREATE TABLE `investment_purpose_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`holding_id` text NOT NULL,
	`purpose_id` text NOT NULL,
	`amount_cents` text NOT NULL CHECK (typeof(`amount_cents`) = 'text' AND `amount_cents` LIKE 'pfc:v1:%'),
	`allocated_on` text NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`holding_id`) REFERENCES `investment_holdings`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`purpose_id`) REFERENCES `investment_purposes`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `investment_purpose_allocations_holding_idx` ON `investment_purpose_allocations` (`holding_id`);
--> statement-breakpoint
CREATE INDEX `investment_purpose_allocations_purpose_idx` ON `investment_purpose_allocations` (`purpose_id`);
--> statement-breakpoint
CREATE INDEX `investment_purpose_allocations_allocated_idx` ON `investment_purpose_allocations` (`allocated_on`);
--> statement-breakpoint
CREATE UNIQUE INDEX `investment_purpose_allocations_holding_purpose_unique` ON `investment_purpose_allocations` (`holding_id`,`purpose_id`);
