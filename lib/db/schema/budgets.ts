import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { encryptedInteger, encryptedText } from "@/lib/db/encrypted-content";
import { encryptionChecks } from "@/lib/db/encryption-checks";
import { categories, timestampColumns } from "./accounts";
import { recordId, referenceColumn } from "./columns";

export const monthlyBudgets = sqliteTable("monthly_budgets", {
  id: recordId(),
  categoryId: referenceColumn("category_id", () => categories.id, "restrict").notNull(),
  competenceMonth: encryptedText("competence_month", "monthly_budgets.competence_month").notNull(),
  amountCents: encryptedInteger("amount_cents", "monthly_budgets.amount_cents").notNull(),
  competenceMonthHash: text("competence_month_hash"),
  ...timestampColumns("monthly_budgets"),
}, (table) => [
  ...encryptionChecks(table),
  uniqueIndex("monthly_budgets_category_month_unique").on(table.categoryId, table.competenceMonthHash),
]);
