CREATE TABLE `transaction_funding_links` (
	`id` text PRIMARY KEY NOT NULL,
	`expense_transaction_id` text NOT NULL,
	`withdrawal_transaction_id` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`expense_transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`withdrawal_transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_funding_links_expense_unique` ON `transaction_funding_links` (`expense_transaction_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_funding_links_withdrawal_unique` ON `transaction_funding_links` (`withdrawal_transaction_id`);
--> statement-breakpoint
CREATE INDEX `transaction_funding_links_type_idx` ON `transaction_funding_links` (`type`);
