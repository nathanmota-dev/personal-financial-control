import type { AppDb } from "@/lib/db";
import {
creditCardInstallments
} from "@/lib/db/schema";
import {
normalizeCompetenceMonth,
serializeTimestamps
} from "@/lib/server/finance";
import { listTransactions } from "@/lib/server/transactions";
import { eq } from "drizzle-orm";
import { CreditCardExpenseEntry,resolveDb } from "./validation";

export async function listCreditCardExpenseEntries(
  invoiceMonth: string,
  database?: AppDb,
  options?: { accountId?: string }
) {
  const db = await resolveDb(database);
  const normalizedMonth = normalizeCompetenceMonth(invoiceMonth);

  const [installmentRows, legacyTransactions] = await Promise.all([
    db.query.creditCardInstallments.findMany({
      where: eq(creditCardInstallments.invoiceMonth, normalizedMonth),
      with: {
        charge: {
          with: {
            account: true,
            category: true,
          },
        },
      },
      orderBy: (table, { asc }) => [asc(table.installmentNumber)],
    }),
    listTransactions({ competenceMonth: normalizedMonth }, db),
  ]);

  const installmentEntries: CreditCardExpenseEntry[] = installmentRows
    .filter((row) => !options?.accountId || row.charge.accountId === options.accountId)
    .map((row) => ({
      id: row.id,
      chargeId: row.chargeId,
      source: "installment" as const,
      amountCents: row.amountCents,
      totalAmountCents: row.charge.totalAmountCents,
      kind: row.charge.kind,
      description: row.charge.description,
      expenseDate: row.charge.purchaseDate,
      invoiceMonth: row.invoiceMonth,
      category: row.charge.category ? serializeTimestamps(row.charge.category) : null,
      account: row.charge.account ? serializeTimestamps(row.charge.account) : null,
      purchaseDate: row.charge.purchaseDate,
      notes: row.charge.notes,
      installmentNumber: row.installmentNumber,
      installmentCount: row.charge.installmentCount,
    }));

  const legacyEntries: CreditCardExpenseEntry[] = legacyTransactions
    .filter(
      (row) =>
        row.type === "expense" &&
        row.status !== "cancelled" &&
        row.account?.type === "credit" &&
        (!options?.accountId || row.accountId === options.accountId)
    )
    .map((row) => ({
      id: row.id,
      source: "legacy_transaction" as const,
      amountCents: row.amountCents,
      description: row.description,
      expenseDate: row.transactionDate,
      invoiceMonth: row.competenceMonth,
      category: row.category,
      account: row.account,
      purchaseDate: row.transactionDate,
      notes: row.notes,
    }));

  return [...installmentEntries, ...legacyEntries].sort((left, right) => {
    return (
      right.expenseDate.localeCompare(left.expenseDate) ||
      right.amountCents - left.amountCents ||
      left.description.localeCompare(right.description)
    );
  });
}
