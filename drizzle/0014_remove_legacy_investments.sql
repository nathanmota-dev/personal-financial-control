UPDATE `investment_purposes`
SET `kind` = 'emergency_reserve', `updated_at` = (unixepoch() * 1000)
WHERE `is_archived` = 0
  AND lower(trim(`name`)) IN ('reserva', 'reserva de emergência')
  AND (
    SELECT count(*)
    FROM `investment_purposes`
    WHERE `is_archived` = 0
      AND lower(trim(`name`)) IN ('reserva', 'reserva de emergência')
  ) = 1;
--> statement-breakpoint
ALTER TABLE `investment_holdings` DROP COLUMN `tracking_mode`;
