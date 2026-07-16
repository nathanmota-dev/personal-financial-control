-- Monetary values are stored as authenticated ciphertext. This migration is
-- intentionally fail-closed for existing plaintext rows: the CHECK constraints
-- below reject a copy unless the source value already has the pfc:v1: format.
PRAGMA foreign_keys = OFF;
--> statement-breakpoint
DROP INDEX IF EXISTS `accounts_name_unique`;
--> statement-breakpoint
DROP INDEX IF EXISTS `recurring_templates_account_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `recurring_templates_category_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `transactions_account_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `transactions_category_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `transactions_competence_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `transactions_recurring_month_unique`;
--> statement-breakpoint
DROP INDEX IF EXISTS `transfers_from_account_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `transfers_to_account_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `transfers_competence_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `credit_card_charges_account_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `credit_card_charges_category_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `credit_card_charges_purchase_date_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `credit_card_charges_first_invoice_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `credit_card_installments_charge_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `credit_card_installments_invoice_month_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `credit_card_installments_charge_number_unique`;
--> statement-breakpoint
DROP INDEX IF EXISTS `financial_goals_status_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `financial_goals_priority_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `financial_goal_allocations_goal_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `financial_goal_allocations_transaction_idx`;
--> statement-breakpoint
DROP INDEX IF EXISTS `financial_goal_allocations_occurred_idx`;
--> statement-breakpoint
ALTER TABLE `accounts` RENAME TO `accounts__pfc_legacy_0005`;
--> statement-breakpoint
ALTER TABLE `recurring_templates` RENAME TO `recurring_templates__pfc_legacy_0005`;
--> statement-breakpoint
ALTER TABLE `transactions` RENAME TO `transactions__pfc_legacy_0005`;
--> statement-breakpoint
ALTER TABLE `transfers` RENAME TO `transfers__pfc_legacy_0005`;
--> statement-breakpoint
ALTER TABLE `credit_card_charges` RENAME TO `credit_card_charges__pfc_legacy_0005`;
--> statement-breakpoint
ALTER TABLE `credit_card_installments` RENAME TO `credit_card_installments__pfc_legacy_0005`;
--> statement-breakpoint
ALTER TABLE `investment_portfolio` RENAME TO `investment_portfolio__pfc_legacy_0005`;
--> statement-breakpoint
ALTER TABLE `financial_goals` RENAME TO `financial_goals__pfc_legacy_0005`;
--> statement-breakpoint
ALTER TABLE `financial_goal_allocations` RENAME TO `financial_goal_allocations__pfc_legacy_0005`;
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`initial_balance_cents` text NOT NULL CHECK (typeof(`initial_balance_cents`) = 'text' AND `initial_balance_cents` LIKE 'pfc:v1:%'),
	`credit_closing_day` integer,
	`credit_due_day` integer DEFAULT 10 NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_name_unique` ON `accounts` (`name`);
--> statement-breakpoint
CREATE TABLE `recurring_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`amount_cents` text NOT NULL CHECK (typeof(`amount_cents`) = 'text' AND `amount_cents` LIKE 'pfc:v1:%'),
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
CREATE INDEX `recurring_templates_account_idx` ON `recurring_templates` (`account_id`);
--> statement-breakpoint
CREATE INDEX `recurring_templates_category_idx` ON `recurring_templates` (`category_id`);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text NOT NULL,
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
CREATE INDEX `transactions_account_idx` ON `transactions` (`account_id`);
--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category_id`);
--> statement-breakpoint
CREATE INDEX `transactions_competence_idx` ON `transactions` (`competence_month`);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_recurring_month_unique` ON `transactions` (`recurring_template_id`,`competence_month`);
--> statement-breakpoint
CREATE TABLE `transfers` (
	`id` text PRIMARY KEY NOT NULL,
	`from_account_id` text NOT NULL,
	`to_account_id` text NOT NULL,
	`amount_cents` text NOT NULL CHECK (typeof(`amount_cents`) = 'text' AND `amount_cents` LIKE 'pfc:v1:%'),
	`transfer_date` text NOT NULL,
	`competence_month` text NOT NULL,
	`description` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`from_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `transfers_from_account_idx` ON `transfers` (`from_account_id`);
--> statement-breakpoint
CREATE INDEX `transfers_to_account_idx` ON `transfers` (`to_account_id`);
--> statement-breakpoint
CREATE INDEX `transfers_competence_idx` ON `transfers` (`competence_month`);
--> statement-breakpoint
CREATE TABLE `credit_card_charges` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text NOT NULL,
	`description` text NOT NULL,
	`notes` text,
	`purchase_date` text NOT NULL,
	`total_amount_cents` text NOT NULL CHECK (typeof(`total_amount_cents`) = 'text' AND `total_amount_cents` LIKE 'pfc:v1:%'),
	`installment_count` integer NOT NULL,
	`first_invoice_month` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `credit_card_charges_account_idx` ON `credit_card_charges` (`account_id`);
--> statement-breakpoint
CREATE INDEX `credit_card_charges_category_idx` ON `credit_card_charges` (`category_id`);
--> statement-breakpoint
CREATE INDEX `credit_card_charges_purchase_date_idx` ON `credit_card_charges` (`purchase_date`);
--> statement-breakpoint
CREATE INDEX `credit_card_charges_first_invoice_idx` ON `credit_card_charges` (`first_invoice_month`);
--> statement-breakpoint
CREATE TABLE `credit_card_installments` (
	`id` text PRIMARY KEY NOT NULL,
	`charge_id` text NOT NULL,
	`installment_number` integer NOT NULL,
	`amount_cents` text NOT NULL CHECK (typeof(`amount_cents`) = 'text' AND `amount_cents` LIKE 'pfc:v1:%'),
	`invoice_month` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`charge_id`) REFERENCES `credit_card_charges`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `credit_card_installments_charge_idx` ON `credit_card_installments` (`charge_id`);
--> statement-breakpoint
CREATE INDEX `credit_card_installments_invoice_month_idx` ON `credit_card_installments` (`invoice_month`);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_card_installments_charge_number_unique` ON `credit_card_installments` (`charge_id`,`installment_number`);
--> statement-breakpoint
CREATE TABLE `investment_portfolio` (
	`id` text PRIMARY KEY NOT NULL,
	`checkpoint_balance_cents` text NOT NULL CHECK (typeof(`checkpoint_balance_cents`) = 'text' AND `checkpoint_balance_cents` LIKE 'pfc:v1:%'),
	`expected_monthly_rate_bps` integer NOT NULL,
	`checkpoint_date` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `financial_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`target_amount_cents` text NOT NULL CHECK (typeof(`target_amount_cents`) = 'text' AND `target_amount_cents` LIKE 'pfc:v1:%'),
	`target_date` text,
	`planned_monthly_contribution_cents` text NOT NULL CHECK (typeof(`planned_monthly_contribution_cents`) = 'text' AND `planned_monthly_contribution_cents` LIKE 'pfc:v1:%'),
	`priority` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`color` text DEFAULT '#38bdf8' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `financial_goals_status_idx` ON `financial_goals` (`status`);
--> statement-breakpoint
CREATE INDEX `financial_goals_priority_idx` ON `financial_goals` (`priority`);
--> statement-breakpoint
CREATE TABLE `financial_goal_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`transaction_id` text,
	`type` text NOT NULL,
	`amount_cents` text NOT NULL CHECK (typeof(`amount_cents`) = 'text' AND `amount_cents` LIKE 'pfc:v1:%'),
	`occurred_on` text NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `financial_goals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `financial_goal_allocations_goal_idx` ON `financial_goal_allocations` (`goal_id`);
--> statement-breakpoint
CREATE INDEX `financial_goal_allocations_transaction_idx` ON `financial_goal_allocations` (`transaction_id`);
--> statement-breakpoint
CREATE INDEX `financial_goal_allocations_occurred_idx` ON `financial_goal_allocations` (`occurred_on`);
--> statement-breakpoint
INSERT INTO `accounts` (`id`, `name`, `type`, `initial_balance_cents`, `credit_closing_day`, `credit_due_day`, `is_archived`, `created_at`, `updated_at`)
SELECT `id`, `name`, `type`, `initial_balance_cents`, `credit_closing_day`, `credit_due_day`, `is_archived`, `created_at`, `updated_at`
FROM `accounts__pfc_legacy_0005`;
--> statement-breakpoint
INSERT INTO `recurring_templates` (`id`, `account_id`, `category_id`, `type`, `status`, `amount_cents`, `day_of_month`, `start_month`, `end_month`, `last_generated_month`, `description`, `created_at`, `updated_at`)
SELECT `id`, `account_id`, `category_id`, `type`, `status`, `amount_cents`, `day_of_month`, `start_month`, `end_month`, `last_generated_month`, `description`, `created_at`, `updated_at`
FROM `recurring_templates__pfc_legacy_0005`;
--> statement-breakpoint
INSERT INTO `transactions` (`id`, `account_id`, `category_id`, `recurring_template_id`, `type`, `status`, `amount_cents`, `transaction_date`, `competence_month`, `description`, `notes`, `is_included_in_investment_checkpoint`, `created_at`, `updated_at`)
SELECT `id`, `account_id`, `category_id`, `recurring_template_id`, `type`, `status`, `amount_cents`, `transaction_date`, `competence_month`, `description`, `notes`, `is_included_in_investment_checkpoint`, `created_at`, `updated_at`
FROM `transactions__pfc_legacy_0005`;
--> statement-breakpoint
INSERT INTO `transfers` (`id`, `from_account_id`, `to_account_id`, `amount_cents`, `transfer_date`, `competence_month`, `description`, `created_at`, `updated_at`)
SELECT `id`, `from_account_id`, `to_account_id`, `amount_cents`, `transfer_date`, `competence_month`, `description`, `created_at`, `updated_at`
FROM `transfers__pfc_legacy_0005`;
--> statement-breakpoint
INSERT INTO `credit_card_charges` (`id`, `account_id`, `category_id`, `description`, `notes`, `purchase_date`, `total_amount_cents`, `installment_count`, `first_invoice_month`, `created_at`, `updated_at`)
SELECT `id`, `account_id`, `category_id`, `description`, `notes`, `purchase_date`, `total_amount_cents`, `installment_count`, `first_invoice_month`, `created_at`, `updated_at`
FROM `credit_card_charges__pfc_legacy_0005`;
--> statement-breakpoint
INSERT INTO `credit_card_installments` (`id`, `charge_id`, `installment_number`, `amount_cents`, `invoice_month`, `created_at`, `updated_at`)
SELECT `id`, `charge_id`, `installment_number`, `amount_cents`, `invoice_month`, `created_at`, `updated_at`
FROM `credit_card_installments__pfc_legacy_0005`;
--> statement-breakpoint
INSERT INTO `investment_portfolio` (`id`, `checkpoint_balance_cents`, `expected_monthly_rate_bps`, `checkpoint_date`, `created_at`, `updated_at`)
SELECT `id`, `checkpoint_balance_cents`, `expected_monthly_rate_bps`, `checkpoint_date`, `created_at`, `updated_at`
FROM `investment_portfolio__pfc_legacy_0005`;
--> statement-breakpoint
INSERT INTO `financial_goals` (`id`, `name`, `category`, `target_amount_cents`, `target_date`, `planned_monthly_contribution_cents`, `priority`, `status`, `color`, `notes`, `created_at`, `updated_at`)
SELECT `id`, `name`, `category`, `target_amount_cents`, `target_date`, `planned_monthly_contribution_cents`, `priority`, `status`, `color`, `notes`, `created_at`, `updated_at`
FROM `financial_goals__pfc_legacy_0005`;
--> statement-breakpoint
INSERT INTO `financial_goal_allocations` (`id`, `goal_id`, `transaction_id`, `type`, `amount_cents`, `occurred_on`, `notes`, `created_at`, `updated_at`)
SELECT `id`, `goal_id`, `transaction_id`, `type`, `amount_cents`, `occurred_on`, `notes`, `created_at`, `updated_at`
FROM `financial_goal_allocations__pfc_legacy_0005`;
--> statement-breakpoint
DROP TABLE `financial_goal_allocations__pfc_legacy_0005`;
--> statement-breakpoint
DROP TABLE `credit_card_installments__pfc_legacy_0005`;
--> statement-breakpoint
DROP TABLE `transactions__pfc_legacy_0005`;
--> statement-breakpoint
DROP TABLE `recurring_templates__pfc_legacy_0005`;
--> statement-breakpoint
DROP TABLE `transfers__pfc_legacy_0005`;
--> statement-breakpoint
DROP TABLE `credit_card_charges__pfc_legacy_0005`;
--> statement-breakpoint
DROP TABLE `financial_goals__pfc_legacy_0005`;
--> statement-breakpoint
DROP TABLE `investment_portfolio__pfc_legacy_0005`;
--> statement-breakpoint
DROP TABLE `accounts__pfc_legacy_0005`;
--> statement-breakpoint
PRAGMA foreign_keys = ON;
