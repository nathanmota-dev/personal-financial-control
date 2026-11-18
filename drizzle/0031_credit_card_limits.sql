CREATE TABLE credit_card_limits (
 id TEXT PRIMARY KEY NOT NULL,
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 limit_cents TEXT NOT NULL CHECK (limit_cents LIKE 'pfc:v2:%'),
 available_cents TEXT NOT NULL CHECK (available_cents LIKE 'pfc:v2:%'),
 collected_at TEXT NOT NULL CHECK (collected_at LIKE 'pfc:v2:%'),
 created_at TEXT NOT NULL CHECK (created_at LIKE 'pfc:v2:%'),
 updated_at TEXT NOT NULL CHECK (updated_at LIKE 'pfc:v2:%')
);
--> statement-breakpoint
CREATE UNIQUE INDEX credit_card_limits_account_unique ON credit_card_limits(account_id);
