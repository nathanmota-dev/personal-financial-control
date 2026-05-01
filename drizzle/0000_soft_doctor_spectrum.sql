CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`initial_balance_cents` integer DEFAULT 0 NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_name_unique` ON `accounts` (`name`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`group` text NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `investment_portfolio` (
	`id` text PRIMARY KEY NOT NULL,
	`current_balance_cents` integer NOT NULL,
	`monthly_contribution_cents` integer NOT NULL,
	`expected_monthly_rate_bps` integer NOT NULL,
	`reference_date` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recurring_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`amount_cents` integer NOT NULL,
	`day_of_month` integer NOT NULL,
	`start_month` text NOT NULL,
	`end_month` text,
	`last_generated_month` text,
	`description` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `recurring_templates_account_idx` ON `recurring_templates` (`account_id`);--> statement-breakpoint
CREATE INDEX `recurring_templates_category_idx` ON `recurring_templates` (`category_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text NOT NULL,
	`recurring_template_id` text,
	`type` text NOT NULL,
	`status` text DEFAULT 'posted' NOT NULL,
	`amount_cents` integer NOT NULL,
	`transaction_date` text NOT NULL,
	`competence_month` text NOT NULL,
	`description` text NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`recurring_template_id`) REFERENCES `recurring_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `transactions_account_idx` ON `transactions` (`account_id`);--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `transactions_competence_idx` ON `transactions` (`competence_month`);--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_recurring_month_unique` ON `transactions` (`recurring_template_id`,`competence_month`);--> statement-breakpoint
CREATE TABLE `transfers` (
	`id` text PRIMARY KEY NOT NULL,
	`from_account_id` text NOT NULL,
	`to_account_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`transfer_date` text NOT NULL,
	`competence_month` text NOT NULL,
	`description` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`from_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `transfers_from_account_idx` ON `transfers` (`from_account_id`);--> statement-breakpoint
CREATE INDEX `transfers_to_account_idx` ON `transfers` (`to_account_id`);--> statement-breakpoint
CREATE INDEX `transfers_competence_idx` ON `transfers` (`competence_month`);