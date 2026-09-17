ALTER TABLE `credit_card_charges` ADD `import_fingerprint` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_card_charges_import_fingerprint_unique` ON `credit_card_charges` (`import_fingerprint`);
--> statement-breakpoint
CREATE TABLE `credit_card_bills` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`invoice_month` text NOT NULL,
	`due_date` text NOT NULL,
	`statement_total_cents` text NOT NULL CHECK (typeof(`statement_total_cents`) = 'text' AND `statement_total_cents` LIKE 'pfc:v1:%'),
	`current_charges_total_cents` text NOT NULL CHECK (typeof(`current_charges_total_cents`) = 'text' AND `current_charges_total_cents` LIKE 'pfc:v1:%'),
	`prior_balance_cents` text NOT NULL CHECK (typeof(`prior_balance_cents`) = 'text' AND `prior_balance_cents` LIKE 'pfc:v1:%'),
	`pre_statement_payments_cents` text NOT NULL CHECK (typeof(`pre_statement_payments_cents`) = 'text' AND `pre_statement_payments_cents` LIKE 'pfc:v1:%'),
	`ignored_amount_cents` text NOT NULL CHECK (typeof(`ignored_amount_cents`) = 'text' AND `ignored_amount_cents` LIKE 'pfc:v1:%'),
	`status` text DEFAULT 'open' NOT NULL,
	`paid_at` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_card_bills_account_month_unique` ON `credit_card_bills` (`account_id`,`invoice_month`);
--> statement-breakpoint
CREATE INDEX `credit_card_bills_account_idx` ON `credit_card_bills` (`account_id`);
--> statement-breakpoint
CREATE INDEX `credit_card_bills_status_idx` ON `credit_card_bills` (`status`);
--> statement-breakpoint
CREATE TABLE `credit_card_bill_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`bill_id` text,
	`transaction_id` text NOT NULL,
	`payment_date` text NOT NULL,
	`amount_cents` text NOT NULL CHECK (typeof(`amount_cents`) = 'text' AND `amount_cents` LIKE 'pfc:v1:%'),
	`kind` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`bill_id`) REFERENCES `credit_card_bills`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_card_bill_payments_transaction_unique` ON `credit_card_bill_payments` (`transaction_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_card_bill_payments_idempotency_unique` ON `credit_card_bill_payments` (`idempotency_key`);
--> statement-breakpoint
CREATE INDEX `credit_card_bill_payments_bill_idx` ON `credit_card_bill_payments` (`bill_id`);
--> statement-breakpoint
CREATE INDEX `credit_card_bill_payments_date_idx` ON `credit_card_bill_payments` (`payment_date`);
