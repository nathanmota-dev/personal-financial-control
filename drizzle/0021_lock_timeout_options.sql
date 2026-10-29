CREATE TABLE `__new_authorized_users` (
  `email` text PRIMARY KEY NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `display_name` text,
  `pin_hash` text,
  `pin_failed_attempts` integer DEFAULT 0 NOT NULL,
  `pin_reset_requested` integer DEFAULT 0 NOT NULL,
  `session_version` integer DEFAULT 0 NOT NULL,
  `lock_timeout_minutes` integer DEFAULT 15 NOT NULL CONSTRAINT `lock_timeout_range` CHECK (`lock_timeout_minutes` BETWEEN 0 AND 60),
  `lock_on_close` integer DEFAULT 1 NOT NULL,
  `mcp_token_hash` text
);
--> statement-breakpoint
INSERT INTO `__new_authorized_users` (`email`, `created_at`, `display_name`, `pin_hash`, `pin_failed_attempts`, `pin_reset_requested`, `session_version`, `lock_timeout_minutes`, `lock_on_close`, `mcp_token_hash`)
SELECT `email`, `created_at`, `display_name`, `pin_hash`, `pin_failed_attempts`, `pin_reset_requested`, `session_version`, MIN(`lock_timeout_minutes`, 60), `lock_on_close`, `mcp_token_hash` FROM `authorized_users`;
--> statement-breakpoint
DROP TABLE `authorized_users`;
--> statement-breakpoint
ALTER TABLE `__new_authorized_users` RENAME TO `authorized_users`;
