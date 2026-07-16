ALTER TABLE `investment_portfolio` RENAME COLUMN `current_balance_cents` TO `checkpoint_balance_cents`;
--> statement-breakpoint
ALTER TABLE `investment_portfolio` RENAME COLUMN `reference_date` TO `checkpoint_date`;
--> statement-breakpoint
ALTER TABLE `investment_portfolio` DROP COLUMN `monthly_contribution_cents`;
--> statement-breakpoint
ALTER TABLE `transactions` RENAME COLUMN `is_included_in_investment_balance` TO `is_included_in_investment_checkpoint`;
