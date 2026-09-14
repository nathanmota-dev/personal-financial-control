-- Categories are optional for ordinary income and expense transactions. Keep
-- the encrypted payloads and every existing foreign key while rebuilding the
-- SQLite table, since SQLite cannot remove NOT NULL in place.
PRAGMA foreign_keys = OFF;
--> statement-breakpoint
DROP INDEX IF EXISTS `transactions_account_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `transactions_category_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `transactions_competence_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `transactions_recurring_month_unique`;
--> statement-breakpoint
CREATE TABLE `transactions__pfc_new_0008` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text,
	`recurring_template_id` text,
	`type` text NOT NULL,
	`status` text DEFAULT 'posted' NOT NULL,
	`amount_cents` text NOT NULL CHECK (typeof(`amount_cents`) = 'text' AND `amount_cents` LIKE 'pfc:v1:%'),
	`transaction_date` text NOT NULL,
	`competence_month` text NOT NULL,
	`description` text NOT NULL,
	`notes` text,
	`is_included_in_investment_checkpoint` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`recurring_template_id`) REFERENCES `recurring_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `transactions__pfc_new_0008` (`id`, `account_id`, `category_id`, `recurring_template_id`, `type`, `status`, `amount_cents`, `transaction_date`, `competence_month`, `description`, `notes`, `is_included_in_investment_checkpoint`, `created_at`, `updated_at`)
SELECT `id`, `account_id`, `category_id`, `recurring_template_id`, `type`, `status`, `amount_cents`, `transaction_date`, `competence_month`, `description`, `notes`, `is_included_in_investment_checkpoint`, `created_at`, `updated_at`
FROM `transactions`;
--> statement-breakpoint
DROP TABLE `transactions`;
--> statement-breakpoint
ALTER TABLE `transactions__pfc_new_0008` RENAME TO `transactions`;
--> statement-breakpoint
CREATE INDEX `transactions_account_idx` ON `transactions` (`account_id`);
--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category_id`);
--> statement-breakpoint
CREATE INDEX `transactions_competence_idx` ON `transactions` (`competence_month`);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_recurring_month_unique` ON `transactions` (`recurring_template_id`,`competence_month`);
--> statement-breakpoint
INSERT INTO `categories` (`id`, `name`, `group`, `is_archived`, `created_at`, `updated_at`) VALUES
	('b0000000-0000-4000-8000-000000000101', 'Salário', 'income', 0, unixepoch() * 1000, unixepoch() * 1000),
	('b0000000-0000-4000-8000-000000000102', 'Moradia', 'fixed_expense', 0, unixepoch() * 1000, unixepoch() * 1000),
	('b0000000-0000-4000-8000-000000000103', 'Contas da casa', 'fixed_expense', 0, unixepoch() * 1000, unixepoch() * 1000),
	('b0000000-0000-4000-8000-000000000104', 'Alimentação', 'variable_expense', 0, unixepoch() * 1000, unixepoch() * 1000),
	('b0000000-0000-4000-8000-000000000105', 'Transporte', 'variable_expense', 0, unixepoch() * 1000, unixepoch() * 1000),
	('b0000000-0000-4000-8000-000000000106', 'Investimentos', 'investment', 0, unixepoch() * 1000, unixepoch() * 1000),
	('b0000000-0000-4000-8000-000000000107', 'Outros', 'variable_expense', 0, unixepoch() * 1000, unixepoch() * 1000)
ON CONFLICT(`name`) DO NOTHING;
--> statement-breakpoint
PRAGMA foreign_keys = ON;
