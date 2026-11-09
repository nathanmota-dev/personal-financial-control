CREATE TABLE pluggy_items (
 id TEXT PRIMARY KEY NOT NULL,
 external_item_id TEXT NOT NULL CHECK (external_item_id LIKE 'pfc:v2:%'),
 external_item_id_hash TEXT NOT NULL CHECK (length(external_item_id_hash) = 64 AND external_item_id_hash NOT GLOB '*[^0-9a-f]*'),
 label TEXT NOT NULL CHECK (label LIKE 'pfc:v2:%'),
 connector_name TEXT NOT NULL CHECK (connector_name LIKE 'pfc:v2:%'),
 status TEXT NOT NULL CHECK (status LIKE 'pfc:v2:%'),
 collected_at TEXT CHECK (collected_at IS NULL OR collected_at LIKE 'pfc:v2:%'),
 next_auto_sync_at TEXT CHECK (next_auto_sync_at IS NULL OR next_auto_sync_at LIKE 'pfc:v2:%'),
 last_synced_at TEXT CHECK (last_synced_at IS NULL OR last_synced_at LIKE 'pfc:v2:%'),
 last_error_code TEXT CHECK (last_error_code IS NULL OR last_error_code LIKE 'pfc:v2:%'),
 created_at TEXT NOT NULL CHECK (created_at LIKE 'pfc:v2:%'),
 updated_at TEXT NOT NULL CHECK (updated_at LIKE 'pfc:v2:%')
);
--> statement-breakpoint
CREATE UNIQUE INDEX pluggy_items_external_item_unique ON pluggy_items(external_item_id_hash);
--> statement-breakpoint
CREATE TABLE pluggy_account_links (
 id TEXT PRIMARY KEY NOT NULL,
 item_id TEXT NOT NULL REFERENCES pluggy_items(id) ON DELETE CASCADE,
 external_account_id TEXT NOT NULL CHECK (external_account_id LIKE 'pfc:v2:%'),
 external_account_id_hash TEXT NOT NULL CHECK (length(external_account_id_hash) = 64 AND external_account_id_hash NOT GLOB '*[^0-9a-f]*'),
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
 remote_name TEXT NOT NULL CHECK (remote_name LIKE 'pfc:v2:%'),
 kind TEXT NOT NULL CHECK (kind LIKE 'pfc:v2:%'),
 cutoff_date TEXT NOT NULL CHECK (cutoff_date LIKE 'pfc:v2:%'),
 is_enabled TEXT NOT NULL CHECK (is_enabled LIKE 'pfc:v2:%'),
 created_at TEXT NOT NULL CHECK (created_at LIKE 'pfc:v2:%'),
 updated_at TEXT NOT NULL CHECK (updated_at LIKE 'pfc:v2:%')
);
--> statement-breakpoint
CREATE INDEX pluggy_account_links_item_idx ON pluggy_account_links(item_id);
--> statement-breakpoint
CREATE INDEX pluggy_account_links_account_idx ON pluggy_account_links(account_id);
--> statement-breakpoint
CREATE UNIQUE INDEX pluggy_account_links_external_account_unique ON pluggy_account_links(external_account_id_hash);
--> statement-breakpoint
CREATE TABLE pluggy_sync_runs (
 id TEXT PRIMARY KEY NOT NULL,
 started_at TEXT NOT NULL CHECK (started_at LIKE 'pfc:v2:%'),
 finished_at TEXT CHECK (finished_at IS NULL OR finished_at LIKE 'pfc:v2:%'),
 status TEXT NOT NULL CHECK (status LIKE 'pfc:v2:%'),
 summary TEXT CHECK (summary IS NULL OR summary LIKE 'pfc:v2:%'),
 error_code TEXT CHECK (error_code IS NULL OR error_code LIKE 'pfc:v2:%'),
 created_at TEXT NOT NULL CHECK (created_at LIKE 'pfc:v2:%'),
 updated_at TEXT NOT NULL CHECK (updated_at LIKE 'pfc:v2:%')
);
--> statement-breakpoint
CREATE TABLE pluggy_import_ledger (
 id TEXT PRIMARY KEY NOT NULL,
 fingerprint TEXT NOT NULL CHECK (fingerprint LIKE 'pfc:v2:%'),
 fingerprint_hash TEXT NOT NULL CHECK (length(fingerprint_hash) = 64 AND fingerprint_hash NOT GLOB '*[^0-9a-f]*'),
 outcome TEXT NOT NULL CHECK (outcome LIKE 'pfc:v2:%'),
 local_table TEXT CHECK (local_table IS NULL OR local_table LIKE 'pfc:v2:%'),
 local_id TEXT CHECK (local_id IS NULL OR local_id LIKE 'pfc:v2:%'),
 last_seen_at TEXT NOT NULL CHECK (last_seen_at LIKE 'pfc:v2:%'),
 created_at TEXT NOT NULL CHECK (created_at LIKE 'pfc:v2:%'),
 updated_at TEXT NOT NULL CHECK (updated_at LIKE 'pfc:v2:%')
);
--> statement-breakpoint
CREATE UNIQUE INDEX pluggy_import_ledger_fingerprint_unique ON pluggy_import_ledger(fingerprint_hash);
