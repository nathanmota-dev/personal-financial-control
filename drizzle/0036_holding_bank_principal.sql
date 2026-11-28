ALTER TABLE investment_holdings ADD principal_cents TEXT CONSTRAINT investment_holdings_principal_cents_encrypted CHECK (principal_cents IS NULL OR (typeof(principal_cents) = 'text' AND principal_cents LIKE 'pfc:v2:%'));
--> statement-breakpoint
ALTER TABLE investment_holdings ADD purchased_on TEXT CONSTRAINT investment_holdings_purchased_on_encrypted CHECK (purchased_on IS NULL OR (typeof(purchased_on) = 'text' AND purchased_on LIKE 'pfc:v2:%'));
