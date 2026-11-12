import type { AppDb } from "@/lib/db";
import { recurringTemplates, transactions } from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { normalizeCompetenceMonth } from "@/lib/server/finance";
import { createTransaction, updateTransaction } from "@/lib/server/transactions";
import { buildDateInMonth } from "@/lib/utils/finance-month";
import { and, eq } from "drizzle-orm";
import { markTemplateGenerated } from "./generation";
import { resolveDb } from "./validation";

/** Marks the occurrence of a recurring expense in `month` as paid, creating it when it was not generated yet. */
export async function markRecurringExpensePaid(templateId: string, month: string, database?: AppDb) {
  const db = await resolveDb(database);
  const competenceMonth = normalizeCompetenceMonth(month);
  const template = await db.query.recurringTemplates.findFirst({ where: eq(recurringTemplates.id, templateId) });
  invariant(template && template.type === "expense", "RECURRING_NOT_FOUND", "Recorrência de despesa não encontrada.", 404);
  const existing = await db.query.transactions.findFirst({
    where: and(eq(transactions.recurringTemplateId, templateId), eq(transactions.competenceMonth, competenceMonth)),
  });
  if (existing) {
    invariant(existing.status !== "cancelled", "RECURRING_CANCELLED", "Esta ocorrência foi cancelada.");
    return existing.status === "posted" ? existing : updateTransaction({ id: existing.id, status: "posted" }, db);
  }
  const created = await createTransaction({
    accountId: template.accountId,
    categoryId: template.categoryId,
    type: "expense",
    amountCents: template.amountCents,
    competenceMonth,
    transactionDate: buildDateInMonth(competenceMonth, template.dayOfMonth),
    description: template.description,
    status: "posted",
    recurringTemplateId: template.id,
  }, db);
  await markTemplateGenerated(template, competenceMonth, db);
  return created;
}
