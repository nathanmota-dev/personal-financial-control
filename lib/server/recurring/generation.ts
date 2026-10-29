import type { AppDb } from "@/lib/db";
import { recurringTemplates,transactions } from "@/lib/db/schema";
import { currentTimestamp,normalizeCompetenceMonth } from "@/lib/server/finance";
import {
createTransaction
} from "@/lib/server/transactions";
import { buildDateInMonth as buildTransactionDate } from "@/lib/utils/finance-month";
import { and,eq,gte,inArray,isNull,lte,or } from "drizzle-orm";
import { RecurringDb,resolveDb } from "./validation";

export { buildDateInMonth as buildTransactionDate } from "@/lib/utils/finance-month";

export async function markTemplateGenerated(
  template: typeof recurringTemplates.$inferSelect,
  competenceMonth: string,
  database: RecurringDb
) {
  // Revisiting an already generated month must not rewrite the template.
  if (template.lastGeneratedMonth && template.lastGeneratedMonth >= competenceMonth) {
    return;
  }

  await database
    .update(recurringTemplates)
    .set({
      lastGeneratedMonth: competenceMonth,
      updatedAt: currentTimestamp(),
    })
    .where(eq(recurringTemplates.id, template.id));
}

export async function generateRecurringTransactions(month: string, database?: AppDb) {
  const db = await resolveDb(database);
  const competenceMonth = normalizeCompetenceMonth(month);

  const templates = await db.query.recurringTemplates.findMany({
    where: and(
      eq(recurringTemplates.status, "active"),
      lte(recurringTemplates.startMonth, competenceMonth),
      or(
        isNull(recurringTemplates.endMonth),
        gte(recurringTemplates.endMonth, competenceMonth)
      )
    ),
  });

  if (!templates.length) {
    return [];
  }

  // One lookup for the whole month instead of one round trip per template.
  const existing = await db.query.transactions.findMany({
    where: and(
      eq(transactions.competenceMonth, competenceMonth),
      inArray(
        transactions.recurringTemplateId,
        templates.map((template) => template.id)
      )
    ),
  });
  const generatedTemplateIds = new Set(
    existing.map((transaction) => transaction.recurringTemplateId)
  );
  const created = [];

  for (const template of templates) {
    if (generatedTemplateIds.has(template.id)) {
      await markTemplateGenerated(template, competenceMonth, db);
      continue;
    }

    const transaction = await createTransaction(
      {
        accountId: template.accountId,
        categoryId: template.categoryId,
        type: template.type,
        amountCents: template.amountCents,
        competenceMonth,
        transactionDate: buildTransactionDate(competenceMonth, template.dayOfMonth),
        description: template.description,
        status: "posted",
        recurringTemplateId: template.id,
      },
      db
    );

    await markTemplateGenerated(template, competenceMonth, db);

    created.push(transaction);
  }

  return created;
}
