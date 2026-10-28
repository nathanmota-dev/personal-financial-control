ALTER TABLE authorized_users ADD COLUMN display_name text;
--> statement-breakpoint
ALTER TABLE authorized_users ADD COLUMN pin_hash text;
--> statement-breakpoint
ALTER TABLE authorized_users ADD COLUMN pin_failed_attempts integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE authorized_users ADD COLUMN pin_reset_requested integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE authorized_users ADD COLUMN session_version integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE authorized_users ADD COLUMN lock_timeout_minutes integer NOT NULL DEFAULT 15 CHECK (lock_timeout_minutes BETWEEN 1 AND 120);
--> statement-breakpoint
ALTER TABLE authorized_users ADD COLUMN lock_on_close integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE authorized_users ADD COLUMN mcp_token_hash text;
