import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getDatabase } from "@/lib/db";
import { transfers } from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp, normalizeCompetenceMonth, normalizeDate, serializeTimestamps } from "@/lib/server/finance";
import { getAccountById } from "@/lib/server/accounts";

const transferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  transferDate: z.string(),
  competenceMonth: z.string(),
  description: z.string().trim().min(1),
});

function resolveDb(database?: AppDb) {
  return database ?? getDatabase();
}

export async function createTransfer(input: z.input<typeof transferSchema>, database?: AppDb) {
  const db = resolveDb(database);
  const values = transferSchema.parse(input);

  values.transferDate = normalizeDate(values.transferDate);
  values.competenceMonth = normalizeCompetenceMonth(values.competenceMonth);

  invariant(
    values.fromAccountId !== values.toAccountId,
    "INVALID_TRANSFER",
    "Transfer origin and destination must be different."
  );

  const [fromAccount, toAccount] = await Promise.all([
    getAccountById(values.fromAccountId, db),
    getAccountById(values.toAccountId, db),
  ]);

  invariant(!fromAccount.isArchived, "ACCOUNT_ARCHIVED", "Origin account is archived.");
  invariant(!toAccount.isArchived, "ACCOUNT_ARCHIVED", "Destination account is archived.");

  const [transfer] = await db
    .insert(transfers)
    .values({
      ...values,
      updatedAt: currentTimestamp(),
    })
    .returning();

  return serializeTimestamps(transfer);
}

export async function listTransfers(
  filters: { competenceMonth?: string; accountId?: string } = {},
  database?: AppDb
) {
  const db = resolveDb(database);
  const rows = await db.query.transfers.findMany({
    where: (table, { and, or, eq: equals }) =>
      and(
        filters.competenceMonth
          ? equals(table.competenceMonth, normalizeCompetenceMonth(filters.competenceMonth))
          : undefined,
        filters.accountId
          ? or(
              equals(table.fromAccountId, filters.accountId),
              equals(table.toAccountId, filters.accountId)
            )
          : undefined
      ),
    with: {
      fromAccount: true,
      toAccount: true,
    },
  });

  return rows.map((row) => ({
    ...serializeTimestamps(row),
    fromAccount: row.fromAccount ? serializeTimestamps(row.fromAccount) : null,
    toAccount: row.toAccount ? serializeTimestamps(row.toAccount) : null,
  }));
}
