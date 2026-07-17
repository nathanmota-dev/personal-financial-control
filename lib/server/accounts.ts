import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import { accounts, transactions, transfers } from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { calculateNetBalance, currentTimestamp, serializeTimestamps } from "@/lib/server/finance";

const dayOfMonthSchema = z.number().int().min(1).max(31);

const createAccountSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["checking", "savings", "cash", "credit", "investment"]),
  initialBalanceCents: z.number().int().default(0),
  creditClosingDay: dayOfMonthSchema.optional(),
  creditDueDay: dayOfMonthSchema.optional(),
});

const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string().uuid(),
});

async function resolveDb(database?: AppDb) {
  return database ?? getFinanceDatabase();
}

function normalizeAccountValues(
  input: z.infer<typeof createAccountSchema>
): {
  name: string;
  type: "checking" | "savings" | "cash" | "credit" | "investment";
  initialBalanceCents: number;
  creditClosingDay: number | null;
  creditDueDay: number;
} {
  if (input.type !== "credit") {
    return {
      ...input,
      creditClosingDay: null,
      creditDueDay: 10,
    };
  }

  return {
    ...input,
    creditClosingDay: input.creditClosingDay ?? null,
    creditDueDay: input.creditDueDay ?? 10,
  };
}

export async function createAccount(input: z.input<typeof createAccountSchema>, database?: AppDb) {
  const db = await resolveDb(database);
  const values = normalizeAccountValues(createAccountSchema.parse(input));

  const [account] = await db
    .insert(accounts)
    .values({
      ...values,
      updatedAt: currentTimestamp(),
    })
    .returning();

  return serializeTimestamps(account);
}

export async function listAccounts(
  options?: { includeArchived?: boolean },
  database?: AppDb
) {
  const db = await resolveDb(database);
  const rows = await db.query.accounts.findMany({
    where: options?.includeArchived ? undefined : eq(accounts.isArchived, false),
    orderBy: (table, { asc }) => [asc(table.name)],
  });

  return Promise.all(rows.map((row) => getAccountDetails(row.id, db)));
}

export async function getAccountById(id: string, database?: AppDb) {
  const db = await resolveDb(database);
  const account = await db.query.accounts.findFirst({
    where: eq(accounts.id, id),
  });

  invariant(account, "ACCOUNT_NOT_FOUND", "Account does not exist.", 404);

  return account;
}

export async function getAccountDetails(id: string, database?: AppDb) {
  const db = await resolveDb(database);
  const account = await getAccountById(id, db);

  const ledgerEntries = await db.query.transactions.findMany({
    where: and(eq(transactions.accountId, id), eq(transactions.status, "posted")),
  });

  const outgoingTransferRows = await db.query.transfers.findMany({
    where: eq(transfers.fromAccountId, id),
  });

  const incomingTransferRows = await db.query.transfers.findMany({
    where: eq(transfers.toAccountId, id),
  });

  const postedIncomeCents = ledgerEntries
    .filter((entry) => entry.type === "income")
    .reduce((total, entry) => total + entry.amountCents, 0);
  const postedExpenseCents = ledgerEntries
    .filter((entry) => entry.type === "expense")
    .reduce((total, entry) => total + entry.amountCents, 0);
  const postedInvestmentContributionCents = ledgerEntries
    .filter((entry) => entry.type === "investment_contribution")
    .reduce((total, entry) => total + entry.amountCents, 0);
  const postedInvestmentWithdrawalCents = ledgerEntries
    .filter((entry) => entry.type === "investment_withdrawal")
    .reduce((total, entry) => total + entry.amountCents, 0);
  const outgoingTransferCents = outgoingTransferRows.reduce(
    (total, entry) => total + entry.amountCents,
    0
  );
  const incomingTransferCents = incomingTransferRows.reduce(
    (total, entry) => total + entry.amountCents,
    0
  );

  const currentBalanceCents = calculateNetBalance({
    initialBalanceCents: account.initialBalanceCents,
    postedIncomeCents,
    postedExpenseCents,
    postedInvestmentContributionCents,
    postedInvestmentWithdrawalCents,
    outgoingTransferCents,
    incomingTransferCents,
  });

  return {
    ...serializeTimestamps(account),
    currentBalanceCents,
    metrics: {
      postedIncomeCents,
      postedExpenseCents,
      postedInvestmentContributionCents,
      postedInvestmentWithdrawalCents,
      outgoingTransferCents,
      incomingTransferCents,
    },
  };
}

export async function updateAccount(input: z.input<typeof updateAccountSchema>, database?: AppDb) {
  const db = await resolveDb(database);
  const { id, ...values } = updateAccountSchema.parse(input);
  const existing = await getAccountById(id, db);
  const normalized = normalizeAccountValues({
    name: values.name ?? existing.name,
    type: values.type ?? existing.type,
    initialBalanceCents: values.initialBalanceCents ?? existing.initialBalanceCents,
    creditClosingDay: values.creditClosingDay ?? existing.creditClosingDay ?? undefined,
    creditDueDay: values.creditDueDay ?? existing.creditDueDay ?? undefined,
  });

  const [account] = await db
    .update(accounts)
    .set({
      ...normalized,
      updatedAt: currentTimestamp(),
    })
    .where(eq(accounts.id, id))
    .returning();

  return serializeTimestamps(account);
}

export async function archiveAccount(id: string, database?: AppDb) {
  const db = await resolveDb(database);
  await getAccountById(id, db);

  const [account] = await db
    .update(accounts)
    .set({
      isArchived: true,
      updatedAt: currentTimestamp(),
    })
    .where(eq(accounts.id, id))
    .returning();

  return serializeTimestamps(account);
}
