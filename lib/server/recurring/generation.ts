import type { AppDb } from "@/lib/db";
import { recurringTemplates,transactions } from "@/lib/db/schema";
import { currentTimestamp,normalizeCompetenceMonth } from "@/lib/server/finance";
import {
createTransaction
} from "@/lib/server/transactions";
import { buildDateInMonth as buildTransactionDate } from "@/lib/utils/finance-month";
import { and,eq,gte,isNull,lte,or } from "drizzle-orm";
import { RecurringDb,resolveDb } from "./validation";

export { buildDateInMonth as buildTransactionDate } from "@/lib/utils/finance-month";

export async function markTemplateGenerated(
  template: typeof recurringTemplates.$inferSelect,
  competenceMonth: string,
  database: RecurringDb
) {
  const lastGeneratedMonth =
    !template.lastGeneratedMonth || template.lastGeneratedMonth < competenceMonth
      ? competenceMonth
      : template.lastGeneratedMonth;

  await database
    .update(recurringTemplates)
    .set({
      lastGeneratedMonth,
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

  const created = [];

  for (const template of templates) {
    const duplicate = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.recurringTemplateId, template.id),
        eq(transactions.competenceMonth, competenceMonth)
      ),
    });

    if (duplicate) {
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
