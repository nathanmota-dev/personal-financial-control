CREATE TABLE `credit_card_charges` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text NOT NULL,
	`description` text NOT NULL,
	`notes` text,
	`purchase_date` text NOT NULL,
	`total_amount_cents` integer NOT NULL,
	`installment_count` integer NOT NULL,
	`first_invoice_month` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `credit_card_charges_account_idx` ON `credit_card_charges` (`account_id`);--> statement-breakpoint
CREATE INDEX `credit_card_charges_category_idx` ON `credit_card_charges` (`category_id`);--> statement-breakpoint
CREATE INDEX `credit_card_charges_purchase_date_idx` ON `credit_card_charges` (`purchase_date`);--> statement-breakpoint
CREATE INDEX `credit_card_charges_first_invoice_idx` ON `credit_card_charges` (`first_invoice_month`);--> statement-breakpoint
CREATE TABLE `credit_card_installments` (
	`id` text PRIMARY KEY NOT NULL,
	`charge_id` text NOT NULL,
	`installment_number` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`invoice_month` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`charge_id`) REFERENCES `credit_card_charges`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `credit_card_installments_charge_idx` ON `credit_card_installments` (`charge_id`);--> statement-breakpoint
CREATE INDEX `credit_card_installments_invoice_month_idx` ON `credit_card_installments` (`invoice_month`);--> statement-breakpoint
CREATE UNIQUE INDEX `credit_card_installments_charge_number_unique` ON `credit_card_installments` (`charge_id`,`installment_number`);--> statement-breakpoint
ALTER TABLE `accounts` ADD `credit_closing_day` integer;--> statement-breakpoint
ALTER TABLE `accounts` ADD `credit_due_day` integer DEFAULT 10 NOT NULL;