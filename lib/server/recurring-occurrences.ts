import { transactions } from "@/lib/db/schema";
import type { FinanceDatabase } from "@/lib/interfaces/database";
import { and,gte,inArray,lte } from "drizzle-orm";

export async function recurringOccurrences(
  database: FinanceDatabase,
  startMonth: string,
  endMonth: string,
  templateIds: string[],
) {
  if (!templateIds.length) return new Set<string>();
  const rows = await database.query.transactions.findMany({
    where: and(
      inArray(transactions.recurringTemplateId, templateIds),
      gte(transactions.competenceMonth, startMonth),
      lte(transactions.competenceMonth, endMonth),
    ),
  });
  return new Set(rows.map((row) => `${row.recurringTemplateId}:${row.competenceMonth}`));
}
