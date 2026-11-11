import type { AppDb } from "@/lib/db";
import { recurringTemplates,transactions } from "@/lib/db/schema";
import { currentTimestamp,normalizeCompetenceMonth } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import {
createTransaction
} from "@/lib/server/transactions";
import { buildDateInMonth as buildTransactionDate } from "@/lib/utils/finance-month";
import { and,eq,gte,inArray,isNotNull,isNull,lte,or } from "drizzle-orm";
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

/** Recurring expenses are paid on their due date: pending ones that reached it become posted. */
export async function settleDueRecurringExpenses(today: string, db: AppDb) {
  const pending = await db.query.transactions.findMany({
    where: and(eq(transactions.status, "pending"), eq(transactions.type, "expense"), isNotNull(transactions.recurringTemplateId)),
  });
  const due = pending.filter((row) => row.transactionDate <= today).map((row) => row.id);
  if (!due.length) return;
  await db.update(transactions).set({ status: "posted", updatedAt: currentTimestamp() }).where(inArray(transactions.id, due));
}

export async function generateRecurringTransactions(month: string, database?: AppDb) {
  const db = await resolveDb(database);
  const today = getFinanceToday();
  await settleDueRecurringExpenses(today, db);
  const competenceMonth = normalizeCompetenceMonth(month);

  const [candidates, links] = await Promise.all([
    db.query.recurringTemplates.findMany({
      where: and(
        eq(recurringTemplates.status, "active"),
        lte(recurringTemplates.startMonth, competenceMonth),
        or(
          isNull(recurringTemplates.endMonth),
          gte(recurringTemplates.endMonth, competenceMonth)
        )
      ),
    }),
    db.query.pluggyAccountLinks.findMany(),
  ]);
  // The bank is the ledger of a linked account: a generated record would duplicate it. These templates only feed the projection.
  const bankOwned = new Set(links.filter((link) => link.isEnabled).map((link) => link.accountId));
  const templates = candidates.filter((template) => !bankOwned.has(template.accountId));

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

    const transactionDate = buildTransactionDate(competenceMonth, template.dayOfMonth);
    const transaction = await createTransaction(
      {
        accountId: template.accountId,
        categoryId: template.categoryId,
        type: template.type,
        amountCents: template.amountCents,
        competenceMonth,
        transactionDate,
        description: template.description,
        // An expense stays pending until its due date (or until marked as paid earlier).
        status: template.type === "expense" && transactionDate > today ? "pending" : "posted",
        recurringTemplateId: template.id,
      },
      db
    );

    await markTemplateGenerated(template, competenceMonth, db);

    created.push(transaction);
  }

  return created;
}
