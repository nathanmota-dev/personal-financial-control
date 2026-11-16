ALTER TABLE categories ADD description TEXT CONSTRAINT categories_description_encrypted CHECK (description IS NULL OR (typeof(description) = 'text' AND description LIKE 'pfc:v2:%'));
--> statement-breakpoint
CREATE TABLE pluggy_category_suggestions (
 id TEXT PRIMARY KEY NOT NULL,
 normalized_description TEXT NOT NULL CHECK (normalized_description LIKE 'pfc:v2:%'),
 normalized_description_hash TEXT NOT NULL CHECK (length(normalized_description_hash) = 64 AND normalized_description_hash NOT GLOB '*[^0-9a-f]*'),
 direction TEXT NOT NULL CHECK (direction LIKE 'pfc:v2:%'),
 direction_hash TEXT NOT NULL CHECK (length(direction_hash) = 64 AND direction_hash NOT GLOB '*[^0-9a-f]*'),
 category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
 reason TEXT CHECK (reason IS NULL OR (typeof(reason) = 'text' AND reason LIKE 'pfc:v2:%')),
 confidence TEXT NOT NULL CHECK (confidence LIKE 'pfc:v2:%'),
 created_at TEXT NOT NULL CHECK (created_at LIKE 'pfc:v2:%'),
 updated_at TEXT NOT NULL CHECK (updated_at LIKE 'pfc:v2:%')
);
--> statement-breakpoint
CREATE UNIQUE INDEX pluggy_category_suggestions_description_direction_unique ON pluggy_category_suggestions(normalized_description_hash, direction_hash);
--> statement-breakpoint
CREATE INDEX pluggy_category_suggestions_category_idx ON pluggy_category_suggestions(category_id);
