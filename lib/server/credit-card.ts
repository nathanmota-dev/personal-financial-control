import { eq } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import { creditCardCharges, creditCardInstallments } from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import {
  currentTimestamp,
  normalizeCompetenceMonth,
  normalizeDate,
  serializeTimestamps,
} from "@/lib/server/finance";
import { getAccountById, listAccounts } from "@/lib/server/accounts";
import { getCategoryById } from "@/lib/server/categories";
import { listTransactions } from "@/lib/server/transactions";

const createCreditCardChargeSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  description: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  purchaseDate: z.string(),
  totalAmountCents: z.number().int().positive(),
  installmentCount: z.number().int().min(1).max(60),
});

export type CreditCardExpenseEntry = {
  id: string;
  source: "installment" | "legacy_transaction";
  amountCents: number;
  description: string;
  expenseDate: string;
  invoiceMonth: string;
  category: {
    id: string;
    name: string;
    group: string;
  } | null;
  account: {
    id: string;
    name: string;
    type: string;
  } | null;
  purchaseDate: string;
  notes?: string | null;
  installmentNumber?: number;
  installmentCount?: number;
};

async function resolveDb(database?: AppDb) {
  return database ?? getFinanceDatabase();
}

function shiftMonth(value: string, delta: number) {
  const [year, month] = normalizeCompetenceMonth(value).split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1 + delta, 1));

  return `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getMonthFromDate(value: string) {
  return normalizeDate(value).slice(0, 7);
}

function resolveFirstInvoiceMonth(purchaseDate: string, creditClosingDay: number) {
  const normalizedDate = normalizeDate(purchaseDate);
  const purchaseDay = Number(normalizedDate.slice(8, 10));
  const purchaseMonth = getMonthFromDate(normalizedDate);

  return purchaseDay <= creditClosingDay ? purchaseMonth : shiftMonth(purchaseMonth, 1);
}

function splitInstallmentAmounts(totalAmountCents: number, installmentCount: number) {
  const baseAmountCents = Math.floor(totalAmountCents / installmentCount);
  const remainderCents = totalAmountCents % installmentCount;

  return Array.from({ length: installmentCount }, (_, index) =>
    baseAmountCents + (index < remainderCents ? 1 : 0)
  );
}

async function validateCreditCardChargeDependencies(
  input: z.infer<typeof createCreditCardChargeSchema>,
  database: AppDb
) {
  const [account, category] = await Promise.all([
    getAccountById(input.accountId, database),
    getCategoryById(input.categoryId, database),
  ]);

  invariant(!account.isArchived, "ACCOUNT_ARCHIVED", "Cannot use an archived account.");
  invariant(!category.isArchived, "CATEGORY_ARCHIVED", "Cannot use an archived category.");
  invariant(
    account.type === "credit",
    "ACCOUNT_TYPE_MISMATCH",
    "Credit card purchases require an account of type credit."
  );
  invariant(
    category.group === "fixed_expense" || category.group === "variable_expense",
    "CATEGORY_TYPE_MISMATCH",
    "Credit card purchases require a fixed or variable expense category."
  );
  invariant(
    Boolean(account.creditClosingDay),
    "CREDIT_CARD_CLOSING_DAY_REQUIRED",
    "Configure the card closing day before creating purchases."
  );

  return { account, category };
}

export async function createCreditCardCharge(
  input: z.input<typeof createCreditCardChargeSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = createCreditCardChargeSchema.parse(input);
  values.purchaseDate = normalizeDate(values.purchaseDate);

  const { account, category } = await validateCreditCardChargeDependencies(values, db);
  const firstInvoiceMonth = resolveFirstInvoiceMonth(
    values.purchaseDate,
    account.creditClosingDay as number
  );
  const installmentAmounts = splitInstallmentAmounts(
    values.totalAmountCents,
    values.installmentCount
  );

  return db.transaction(async (tx) => {
    const [charge] = await tx
      .insert(creditCardCharges)
      .values({
        ...values,
        firstInvoiceMonth,
        updatedAt: currentTimestamp(),
      })
      .returning();

    const installments = await tx
      .insert(creditCardInstallments)
      .values(
        installmentAmounts.map((amountCents, index) => ({
          chargeId: charge.id,
          installmentNumber: index + 1,
          amountCents,
          invoiceMonth: shiftMonth(firstInvoiceMonth, index),
          updatedAt: currentTimestamp(),
        }))
      )
      .returning();

    return {
      ...serializeTimestamps(charge),
      account: serializeTimestamps(account),
      category: serializeTimestamps(category),
      installments: installments.map(serializeTimestamps),
    };
  });
}

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
      source: "installment" as const,
      amountCents: row.amountCents,
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

export async function getCreditCardOverview(invoiceMonth: string, database?: AppDb) {
  const db = await resolveDb(database);
  const normalizedMonth = normalizeCompetenceMonth(invoiceMonth);
  const creditAccounts = (await listAccounts(undefined, db)).filter(
    (account) => account.type === "credit"
  );

  if (!creditAccounts.length) {
    return {
      state: "no_account" as const,
      month: normalizedMonth,
    };
  }

  if (creditAccounts.length > 1) {
    return {
      state: "multiple_accounts" as const,
      month: normalizedMonth,
      accounts: creditAccounts,
    };
  }

  const [account] = creditAccounts;
  const [invoiceEntries, monthTransactions, futureChargeRows] = await Promise.all([
    listCreditCardExpenseEntries(normalizedMonth, db, { accountId: account.id }),
    listTransactions({ competenceMonth: normalizedMonth }, db),
    db.query.creditCardCharges.findMany({
      where: eq(creditCardCharges.accountId, account.id),
      with: {
        category: true,
        installments: true,
      },
      orderBy: (table, { desc: orderDesc }) => [
        orderDesc(table.purchaseDate),
        orderDesc(table.createdAt),
      ],
    }),
  ]);

  const categoryTotals = new Map<
    string,
    { categoryId: string; categoryName: string; amountCents: number; group: string }
  >();

  for (const entry of invoiceEntries) {
    if (!entry.category) {
      continue;
    }

    const current = categoryTotals.get(entry.category.id) ?? {
      categoryId: entry.category.id,
      categoryName: entry.category.name,
      amountCents: 0,
      group: entry.category.group,
    };
    current.amountCents += entry.amountCents;
    categoryTotals.set(entry.category.id, current);
  }

  const activeTransactions = monthTransactions.filter((row) => row.status !== "cancelled");
  const incomeCents = activeTransactions
    .filter((row) => row.type === "income")
    .reduce((total, row) => total + row.amountCents, 0);
  const nonCardExpenseCents = activeTransactions
    .filter((row) => row.type === "expense" && row.account?.type !== "credit")
    .reduce((total, row) => total + row.amountCents, 0);
  const investmentContributionCents = activeTransactions
    .filter((row) => row.type === "investment_contribution")
    .reduce((total, row) => total + row.amountCents, 0);
  const investmentWithdrawalCents = activeTransactions
    .filter((row) => row.type === "investment_withdrawal")
    .reduce((total, row) => total + row.amountCents, 0);
  const invoiceTotalCents = invoiceEntries.reduce((total, entry) => total + entry.amountCents, 0);
  const availableForInvoiceCents =
    incomeCents - nonCardExpenseCents - investmentContributionCents + investmentWithdrawalCents;

  const futureInstallments = futureChargeRows
    .map((charge) => {
      const remainingInstallments = charge.installments
        .filter((installment) => installment.invoiceMonth > normalizedMonth)
        .sort((left, right) => {
          return (
            left.invoiceMonth.localeCompare(right.invoiceMonth) ||
            left.installmentNumber - right.installmentNumber
          );
        });

      return {
        id: charge.id,
        description: charge.description,
        purchaseDate: charge.purchaseDate,
        totalAmountCents: charge.totalAmountCents,
        installmentCount: charge.installmentCount,
        category: charge.category ? serializeTimestamps(charge.category) : null,
        remainingAmountCents: remainingInstallments.reduce(
          (total, installment) => total + installment.amountCents,
          0
        ),
        installments: remainingInstallments.map((installment) => ({
          ...serializeTimestamps(installment),
        })),
      };
    })
    .filter((charge) => charge.installments.length > 0);

  return {
    state: "ready" as const,
    month: normalizedMonth,
    account,
    needsConfiguration: !account.creditClosingDay,
    budgetSummary: {
      incomeCents,
      nonCardExpenseCents,
      investmentContributionCents,
      investmentWithdrawalCents,
      availableForInvoiceCents,
      invoiceTotalCents,
      remainingAfterInvoiceCents: availableForInvoiceCents - invoiceTotalCents,
    },
    invoice: {
      totalAmountCents: invoiceTotalCents,
      purchaseCount: invoiceEntries.length,
      entries: invoiceEntries,
      categoryTotals: Array.from(categoryTotals.values()).sort(
        (left, right) => right.amountCents - left.amountCents
      ),
      futureInstallments,
    },
  };
}
