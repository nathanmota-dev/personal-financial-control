CREATE TABLE monthly_budgets (
 id TEXT PRIMARY KEY NOT NULL,
 category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
 competence_month TEXT NOT NULL CHECK (competence_month LIKE 'pfc:v2:%'),
 amount_cents TEXT NOT NULL CHECK (amount_cents LIKE 'pfc:v2:%'),
 competence_month_hash TEXT NOT NULL CHECK (length(competence_month_hash) = 64 AND competence_month_hash NOT GLOB '*[^0-9a-f]*'),
 created_at TEXT NOT NULL CHECK (created_at LIKE 'pfc:v2:%'),
 updated_at TEXT NOT NULL CHECK (updated_at LIKE 'pfc:v2:%')
);
--> statement-breakpoint
CREATE UNIQUE INDEX monthly_budgets_category_month_unique ON monthly_budgets(category_id, competence_month_hash);
