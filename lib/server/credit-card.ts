import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
  creditCardBills,
  creditCardChargeKinds,
  creditCardCharges,
  creditCardInstallments,
} from "@/lib/db/schema";
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

export const createCreditCardChargeSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  description: z.string().trim().min(1),
  notes: z.string().trim().nullable().optional(),
  purchaseDate: z.string(),
  totalAmountCents: z.number().int().refine((value) => value !== 0, "Amount cannot be zero."),
  installmentCount: z.number().int().min(1).max(60),
  kind: z.enum(creditCardChargeKinds).default("purchase"),
  firstInvoiceMonth: z.string().optional(),
  importFingerprint: z.string().trim().min(1).max(255).optional(),
});

export const updateCreditCardChargeSchema = createCreditCardChargeSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateCreditCardChargeInput = z.input<typeof createCreditCardChargeSchema>;
export type UpdateCreditCardChargeInput = z.input<typeof updateCreditCardChargeSchema>;

export type CreditCardExpenseEntry = {
  id: string;
  chargeId?: string;
  source: "installment" | "legacy_transaction";
  amountCents: number;
  kind?: "purchase" | "adjustment";
  totalAmountCents?: number;
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
  invariant(
    input.kind === "purchase" || input.installmentCount === 1,
    "ADJUSTMENT_INSTALLMENT_MISMATCH",
    "Credit card adjustments must use a single installment."
  );

  return { account, category };
}

function serializeCreditCardCharge(
  charge: typeof creditCardCharges.$inferSelect,
  account: typeof creditCardCharges.$inferSelect extends never ? never : unknown,
  category: unknown,
  installments: Array<typeof creditCardInstallments.$inferSelect>
) {
  return {
    ...serializeTimestamps(charge),
    account: account ? serializeTimestamps(account as Parameters<typeof serializeTimestamps>[0]) : null,
    category: category
      ? serializeTimestamps(category as Parameters<typeof serializeTimestamps>[0])
      : null,
    installments: installments.map(serializeTimestamps),
  };
}

export async function getCreditCardCharge(id: string, database?: AppDb) {
  const db = await resolveDb(database);
  const charge = await db.query.creditCardCharges.findFirst({
    where: eq(creditCardCharges.id, id),
    with: {
      account: true,
      category: true,
      installments: {
        orderBy: (table, { asc }) => [asc(table.installmentNumber)],
      },
    },
  });

  invariant(charge, "CREDIT_CARD_CHARGE_NOT_FOUND", "Credit card purchase does not exist.", 404);

  return serializeCreditCardCharge(
    charge,
    charge.account,
    charge.category,
    charge.installments
  );
}

export async function listCreditCardCharges(
  options: { accountId?: string; invoiceMonth?: string } = {},
  database?: AppDb
) {
  const db = await resolveDb(database);
  const normalizedMonth = options.invoiceMonth
    ? normalizeCompetenceMonth(options.invoiceMonth)
    : undefined;
  const chargeRows = await db.query.creditCardCharges.findMany({
    where: options.accountId ? eq(creditCardCharges.accountId, options.accountId) : undefined,
    with: {
      account: true,
      category: true,
      installments: {
        where: normalizedMonth
          ? eq(creditCardInstallments.invoiceMonth, normalizedMonth)
          : undefined,
        orderBy: (table, { asc }) => [asc(table.installmentNumber)],
      },
    },
    orderBy: (table, { desc: orderDesc }) => [
      orderDesc(table.purchaseDate),
      orderDesc(table.createdAt),
    ],
  });

  return chargeRows.map((charge) =>
    serializeCreditCardCharge(charge, charge.account, charge.category, charge.installments)
  );
}

async function assertChargeCanMutate(id: string, database: AppDb) {
  const charge = await dbGetCharge(id, database);
  const installmentRows = await database.query.creditCardInstallments.findMany({
    where: eq(creditCardInstallments.chargeId, id),
  });
  const invoiceMonths = installmentRows.map((installment) => installment.invoiceMonth);

  if (!invoiceMonths.length) {
    return charge;
  }

  const paidBill = await database.query.creditCardBills.findFirst({
    where: and(
      eq(creditCardBills.accountId, charge.accountId),
      eq(creditCardBills.status, "paid"),
      inArray(creditCardBills.invoiceMonth, invoiceMonths)
    ),
  });

  invariant(
    !paidBill,
    "CREDIT_CARD_CHARGE_BILL_PAID",
    "Purchases belonging to a paid credit card bill cannot be changed."
  );

  return charge;
}

async function dbGetCharge(id: string, database: AppDb) {
  const charge = await database.query.creditCardCharges.findFirst({
    where: eq(creditCardCharges.id, id),
  });

  invariant(charge, "CREDIT_CARD_CHARGE_NOT_FOUND", "Credit card purchase does not exist.", 404);

  return charge;
}

export async function createCreditCardCharge(
  input: CreateCreditCardChargeInput,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = createCreditCardChargeSchema.parse(input);
  values.purchaseDate = normalizeDate(values.purchaseDate);

  if (values.importFingerprint) {
    const existing = await db.query.creditCardCharges.findFirst({
      where: eq(creditCardCharges.importFingerprint, values.importFingerprint),
    });

    if (existing) {
      const normalizedFirstInvoiceMonth = values.firstInvoiceMonth
        ? normalizeCompetenceMonth(values.firstInvoiceMonth)
        : resolveFirstInvoiceMonth(values.purchaseDate, (await getAccountById(values.accountId, db)).creditClosingDay as number);
      const samePayload =
        existing.accountId === values.accountId &&
        existing.categoryId === values.categoryId &&
        existing.description === values.description &&
        existing.notes === (values.notes ?? null) &&
        existing.purchaseDate === values.purchaseDate &&
        existing.totalAmountCents === values.totalAmountCents &&
        existing.installmentCount === values.installmentCount &&
        existing.kind === values.kind &&
        existing.firstInvoiceMonth === normalizedFirstInvoiceMonth;
      invariant(
        samePayload,
        "IDEMPOTENCY_KEY_CONFLICT",
        "The idempotency key is already associated with a different credit card charge payload."
      );
      return getCreditCardCharge(existing.id, db);
    }
  }

  const { account, category } = await validateCreditCardChargeDependencies(values, db);
  const firstInvoiceMonth = values.firstInvoiceMonth
    ? normalizeCompetenceMonth(values.firstInvoiceMonth)
    : resolveFirstInvoiceMonth(values.purchaseDate, account.creditClosingDay as number);
  const installmentAmounts = splitInstallmentAmounts(
    values.totalAmountCents,
    values.installmentCount
  );

  return db.transaction(async (tx) => {
    const [charge] = await tx
      .insert(creditCardCharges)
      .values({
        ...values,
        importFingerprint: values.importFingerprint ?? null,
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

export async function createIdempotentCreditCardCharge(
  input: CreateCreditCardChargeInput & { importFingerprint: string },
  database?: AppDb
) {
  const db = await resolveDb(database);
  const existing = await db.query.creditCardCharges.findFirst({
    where: eq(creditCardCharges.importFingerprint, input.importFingerprint),
  });
  const charge = await createCreditCardCharge(input, db);

  return { charge, created: !existing };
}

export async function updateCreditCardCharge(
  input: UpdateCreditCardChargeInput,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const parsedInput = updateCreditCardChargeSchema.parse(input);
  const existing = await assertChargeCanMutate(parsedInput.id, db);
  const values = createCreditCardChargeSchema.parse({
    accountId: parsedInput.accountId ?? existing.accountId,
    categoryId: parsedInput.categoryId ?? existing.categoryId,
    description: parsedInput.description ?? existing.description,
    notes: parsedInput.notes === undefined ? existing.notes : parsedInput.notes,
    purchaseDate: parsedInput.purchaseDate ?? existing.purchaseDate,
    totalAmountCents: parsedInput.totalAmountCents ?? existing.totalAmountCents,
    installmentCount: parsedInput.installmentCount ?? existing.installmentCount,
    kind: parsedInput.kind ?? existing.kind,
    firstInvoiceMonth: parsedInput.firstInvoiceMonth,
    importFingerprint:
      parsedInput.importFingerprint === undefined
        ? existing.importFingerprint ?? undefined
        : parsedInput.importFingerprint,
  });
  values.purchaseDate = normalizeDate(values.purchaseDate);

  const duplicate = values.importFingerprint
    ? await db.query.creditCardCharges.findFirst({
        where: eq(creditCardCharges.importFingerprint, values.importFingerprint),
      })
    : null;
  invariant(
    !duplicate || duplicate.id === parsedInput.id,
    "CREDIT_CARD_CHARGE_DUPLICATE_IMPORT",
    "Another credit card purchase already uses this import fingerprint."
  );

  const { account, category } = await validateCreditCardChargeDependencies(values, db);
  const firstInvoiceMonth = parsedInput.firstInvoiceMonth
    ? normalizeCompetenceMonth(parsedInput.firstInvoiceMonth)
    : parsedInput.purchaseDate || parsedInput.accountId
      ? resolveFirstInvoiceMonth(values.purchaseDate, account.creditClosingDay as number)
      : existing.firstInvoiceMonth;
  const installmentAmounts = splitInstallmentAmounts(
    values.totalAmountCents,
    values.installmentCount
  );

  return db.transaction(async (tx) => {
    const [updatedCharge] = await tx
      .update(creditCardCharges)
      .set({
        ...values,
        importFingerprint: values.importFingerprint ?? null,
        firstInvoiceMonth,
        updatedAt: currentTimestamp(),
      })
      .where(eq(creditCardCharges.id, parsedInput.id))
      .returning();
    invariant(updatedCharge, "CREDIT_CARD_CHARGE_UPDATE_FAILED", "Credit card purchase could not be updated.", 500);

    await tx
      .delete(creditCardInstallments)
      .where(eq(creditCardInstallments.chargeId, parsedInput.id));
    const installments = await tx
      .insert(creditCardInstallments)
      .values(
        installmentAmounts.map((amountCents, index) => ({
          chargeId: parsedInput.id,
          installmentNumber: index + 1,
          amountCents,
          invoiceMonth: shiftMonth(firstInvoiceMonth, index),
          updatedAt: currentTimestamp(),
        }))
      )
      .returning();

    return serializeCreditCardCharge(updatedCharge, account, category, installments);
  });
}

export async function deleteCreditCardCharge(id: string, database?: AppDb) {
  const db = await resolveDb(database);
  await assertChargeCanMutate(id, db);

  await db.transaction(async (tx) => {
    await tx.delete(creditCardInstallments).where(eq(creditCardInstallments.chargeId, id));
    const deleted = await tx
      .delete(creditCardCharges)
      .where(eq(creditCardCharges.id, id))
      .returning({ id: creditCardCharges.id });
    invariant(deleted.length > 0, "CREDIT_CARD_CHARGE_DELETE_FAILED", "Credit card purchase could not be deleted.", 500);
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
  const [invoiceEntries, monthTransactions, futureChargeRows, cardTransactions, billRows] = await Promise.all([
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
    listTransactions({ accountId: account.id }, db),
    db.query.creditCardBills.findMany({
      where: eq(creditCardBills.accountId, account.id),
    }),
  ]);

  const bill = await db.query.creditCardBills.findFirst({
    where: and(
      eq(creditCardBills.accountId, account.id),
      eq(creditCardBills.invoiceMonth, normalizedMonth)
    ),
    with: {
      payments: true,
    },
  });
  const paymentTransactionIds = new Set(
    (await db.query.creditCardBillPayments.findMany()).map((payment) => payment.transactionId)
  );

  const timelineByMonth = new Map<
    string,
    {
      month: string;
      totalAmountCents: number;
      purchaseCount: number;
      billStatus: "open" | "paid" | null;
    }
  >();

  function timelinePoint(month: string) {
    const existing = timelineByMonth.get(month);
    if (existing) {
      return existing;
    }

    const created = {
      month,
      totalAmountCents: 0,
      purchaseCount: 0,
      billStatus: null as "open" | "paid" | null,
    };
    timelineByMonth.set(month, created);
    return created;
  }

  for (const charge of futureChargeRows) {
    for (const installment of charge.installments) {
      const point = timelinePoint(installment.invoiceMonth);
      point.totalAmountCents += installment.amountCents;
      point.purchaseCount += 1;
    }
  }

  for (const transaction of cardTransactions) {
    if (transaction.type !== "expense" || transaction.status === "cancelled") {
      continue;
    }

    const point = timelinePoint(transaction.competenceMonth);
    point.totalAmountCents += transaction.amountCents;
    point.purchaseCount += 1;
  }

  for (const billRow of billRows) {
    const point = timelinePoint(billRow.invoiceMonth);
    point.totalAmountCents = billRow.statementTotalCents;
    point.billStatus = billRow.status;
  }

  const timeline = Array.from(timelineByMonth.values()).sort((left, right) =>
    left.month.localeCompare(right.month)
  );

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

  const activeTransactions = monthTransactions.filter(
    (row) => row.status !== "cancelled" && !paymentTransactionIds.has(row.id)
  );
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
  const calculatedInvoiceTotalCents = invoiceEntries.reduce(
    (total, entry) => total + entry.amountCents,
    0
  );
  const invoiceTotalCents = bill?.statementTotalCents ?? calculatedInvoiceTotalCents;
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
        categoryId: charge.categoryId,
        description: charge.description,
        purchaseDate: charge.purchaseDate,
        totalAmountCents: charge.totalAmountCents,
        installmentCount: charge.installmentCount,
        kind: charge.kind,
        notes: charge.notes,
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
    timeline,
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
      calculatedTotalAmountCents: calculatedInvoiceTotalCents,
      ignoredAmountCents: bill?.ignoredAmountCents ?? 0,
      bill: bill
        ? {
            id: bill.id,
            status: bill.status,
            dueDate: bill.dueDate,
            statementTotalCents: bill.statementTotalCents,
            currentChargesTotalCents: bill.currentChargesTotalCents,
            priorBalanceCents: bill.priorBalanceCents,
            preStatementPaymentsCents: bill.preStatementPaymentsCents,
            ignoredAmountCents: bill.ignoredAmountCents,
            paidAt: bill.paidAt,
          }
        : null,
      purchaseCount: invoiceEntries.length,
      entries: invoiceEntries,
      categoryTotals: Array.from(categoryTotals.values()).sort(
        (left, right) => right.amountCents - left.amountCents
      ),
      futureInstallments,
    },
  };
}
