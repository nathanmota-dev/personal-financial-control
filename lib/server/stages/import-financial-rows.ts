import { categories,transactions } from "@/lib/db/schema";
import type { ImportFinancialRowsContext } from "@/lib/interfaces/stages/import-financial-rows";
import { createCategory } from "@/lib/server/categories";
import { parseMoneyToCents } from "@/lib/server/finance";
import { createTransaction } from "@/lib/server/transactions";
import { and,eq } from "drizzle-orm";

export async function importFinancialRows({ flattenPayload, payload, db, account }: ImportFinancialRowsContext) {
const rows = flattenPayload(payload);

const createdCategories: string[] = [];

const reusedCategories: string[] = [];

const createdTransactions: Array<{
      id: string;
      section: string;
      name: string;
      amountCents: number;
      type: string;
    }> = [];

const skippedTransactions: Array<{
      section: string;
      name: string;
      reason: string;
    }> = [];

for (const row of rows) {
      let category = await db.query.categories.findFirst({
        where: eq(categories.name, row.item.name),
      });

      if (!category) {
        category = await createCategory(
          {
            name: row.item.name,
            group: row.categoryGroup,
          },
          db
        );
        createdCategories.push(category.name);
      } else {
        reusedCategories.push(category.name);
      }

      const amountCents = parseMoneyToCents(row.item.value);

      const duplicateCandidates = await db.query.transactions.findMany({
        where: and(
          eq(transactions.accountId, account.id),
          eq(transactions.categoryId, category.id),
          eq(transactions.type, row.transactionType),
          eq(transactions.transactionDate, payload.context.transactionDate),
          eq(transactions.competenceMonth, payload.context.competenceMonth),
          eq(transactions.description, row.item.name)
        ),
      });
      const duplicate = duplicateCandidates.find(
        (candidate) => candidate.amountCents === amountCents
      );

      if (duplicate) {
        skippedTransactions.push({
          section: row.section,
          name: row.item.name,
          reason: "duplicate_exact_match",
        });
        continue;
      }

      const transaction = await createTransaction(
        {
          accountId: account.id,
          categoryId: category.id,
          type: row.transactionType,
          status: payload.context.status,
          amountCents,
          transactionDate: payload.context.transactionDate,
          competenceMonth: payload.context.competenceMonth,
          description: row.item.name,
          notes: `Imported from grouped JSON (${row.section})`,
        },
        db
      );

      createdTransactions.push({
        id: transaction.id,
        section: row.section,
        name: row.item.name,
        amountCents,
        type: row.transactionType,
      });
    }
return { createdCategories, reusedCategories, createdTransactions, skippedTransactions };
}
