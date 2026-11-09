CREATE TABLE pluggy_category_rules (
 id TEXT PRIMARY KEY NOT NULL,
 normalized_description TEXT NOT NULL CHECK (normalized_description LIKE 'pfc:v2:%'),
 normalized_description_hash TEXT NOT NULL CHECK (length(normalized_description_hash) = 64 AND normalized_description_hash NOT GLOB '*[^0-9a-f]*'),
 direction TEXT NOT NULL CHECK (direction LIKE 'pfc:v2:%'),
 direction_hash TEXT NOT NULL CHECK (length(direction_hash) = 64 AND direction_hash NOT GLOB '*[^0-9a-f]*'),
 category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
 created_at TEXT NOT NULL CHECK (created_at LIKE 'pfc:v2:%'),
 updated_at TEXT NOT NULL CHECK (updated_at LIKE 'pfc:v2:%')
);
--> statement-breakpoint
CREATE UNIQUE INDEX pluggy_category_rules_description_direction_unique ON pluggy_category_rules(normalized_description_hash, direction_hash);
--> statement-breakpoint
CREATE INDEX pluggy_category_rules_category_idx ON pluggy_category_rules(category_id);
