CREATE TABLE `investment_reduction_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`transaction_id` text,
	`amount_cents` text NOT NULL CHECK (typeof(`amount_cents`) = 'text' AND `amount_cents` LIKE 'pfc:v1:%'),
	`occurred_on` text NOT NULL,
	`reversed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `investment_reduction_events_transaction_idx` ON `investment_reduction_events` (`transaction_id`);
--> statement-breakpoint
CREATE INDEX `investment_reduction_events_status_idx` ON `investment_reduction_events` (`status`);
--> statement-breakpoint
CREATE INDEX `investment_reduction_events_occurred_idx` ON `investment_reduction_events` (`occurred_on`);
--> statement-breakpoint
CREATE TABLE `investment_reduction_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`source_type` text NOT NULL,
	`holding_id` text,
	`purpose_id` text,
	`allocation_id` text,
	`amount_cents` text NOT NULL CHECK (typeof(`amount_cents`) = 'text' AND `amount_cents` LIKE 'pfc:v1:%'),
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `investment_reduction_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`holding_id`) REFERENCES `investment_holdings`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`purpose_id`) REFERENCES `investment_purposes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`allocation_id`) REFERENCES `investment_purpose_allocations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `investment_reduction_sources_event_idx` ON `investment_reduction_sources` (`event_id`);
--> statement-breakpoint
CREATE INDEX `investment_reduction_sources_holding_idx` ON `investment_reduction_sources` (`holding_id`);
--> statement-breakpoint
CREATE INDEX `investment_reduction_sources_purpose_idx` ON `investment_reduction_sources` (`purpose_id`);
--> statement-breakpoint
CREATE INDEX `investment_reduction_sources_allocation_idx` ON `investment_reduction_sources` (`allocation_id`);
