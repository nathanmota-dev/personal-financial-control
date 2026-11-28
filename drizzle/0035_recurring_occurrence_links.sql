CREATE TABLE recurring_occurrence_links (
 id TEXT PRIMARY KEY NOT NULL,
 recurring_template_id TEXT NOT NULL REFERENCES recurring_templates(id) ON DELETE CASCADE,
 competence_month TEXT NOT NULL CHECK (competence_month LIKE 'pfc:v2:%'),
 transaction_id TEXT REFERENCES transactions(id) ON DELETE CASCADE,
 credit_card_charge_id TEXT REFERENCES credit_card_charges(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK (kind LIKE 'pfc:v2:%'),
 competence_month_hash TEXT NOT NULL CHECK (length(competence_month_hash) = 64 AND competence_month_hash NOT GLOB '*[^0-9a-f]*'),
 created_at TEXT NOT NULL CHECK (created_at LIKE 'pfc:v2:%'),
 updated_at TEXT NOT NULL CHECK (updated_at LIKE 'pfc:v2:%'),
 CHECK ((transaction_id IS NULL) <> (credit_card_charge_id IS NULL))
);
--> statement-breakpoint
CREATE INDEX recurring_occurrence_links_template_month_idx ON recurring_occurrence_links(recurring_template_id, competence_month_hash);
--> statement-breakpoint
CREATE INDEX recurring_occurrence_links_transaction_idx ON recurring_occurrence_links(transaction_id);
--> statement-breakpoint
CREATE INDEX recurring_occurrence_links_charge_idx ON recurring_occurrence_links(credit_card_charge_id);
