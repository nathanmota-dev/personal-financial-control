CREATE TABLE `financial_goal_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`transaction_id` text,
	`type` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`occurred_on` text NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `financial_goals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `financial_goal_allocations_goal_idx` ON `financial_goal_allocations` (`goal_id`);--> statement-breakpoint
CREATE INDEX `financial_goal_allocations_transaction_idx` ON `financial_goal_allocations` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `financial_goal_allocations_occurred_idx` ON `financial_goal_allocations` (`occurred_on`);--> statement-breakpoint
CREATE TABLE `financial_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`target_amount_cents` integer NOT NULL,
	`target_date` text,
	`planned_monthly_contribution_cents` integer DEFAULT 0 NOT NULL,
	`priority` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`color` text DEFAULT '#38bdf8' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `financial_goals_status_idx` ON `financial_goals` (`status`);--> statement-breakpoint
CREATE INDEX `financial_goals_priority_idx` ON `financial_goals` (`priority`);
