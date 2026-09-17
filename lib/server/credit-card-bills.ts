import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
  categories,
  creditCardBillPayments,
  creditCardBills,
  transactions,
} from "@/lib/db/schema";
import { getAccountById } from "@/lib/server/accounts";
import { invariant } from "@/lib/server/errors";
import {
  currentTimestamp,
  normalizeCompetenceMonth,
  normalizeDate,
  serializeTimestamps,
} from "@/lib/server/finance";

export const creditCardBillSchema = z.object({
  accountId: z.string().uuid(),
  invoiceMonth: z.string(),
  dueDate: z.string(),
  statementTotalCents: z.number().int().positive(),
  currentChargesTotalCents: z.number().int().nonnegative(),
  priorBalanceCents: z.number().int().nonnegative().default(0),
  preStatementPaymentsCents: z.number().int().nonnegative().default(0),
  ignoredAmountCents: z.number().int().nonnegative().default(0),
});

export const creditCardBillPaymentSchema = z.object({
  accountId: z.string().uuid(),
  invoiceMonth: z.string(),
  paymentAccountId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  paymentDate: z.string(),
  kind: z.enum(["pre_statement", "settlement", "unlinked"]).default("settlement"),
  idempotencyKey: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1).optional(),
});

export type CreditCardBillInput = z.input<typeof creditCardBillSchema>;
export type CreditCardBillPaymentInput = z.input<typeof creditCardBillPaymentSchema>;

const paymentCategoryName = "Pagamento de fatura de cartão";

async function resolveDb(database?: AppDb) {
  return database ?? getFinanceDatabase();
}

async function getBillByAccountAndMonth(
  accountId: string,
  invoiceMonth: string,
  database: AppDb
) {
  return database.query.creditCardBills.findFirst({
    where: and(
      eq(creditCardBills.accountId, accountId),
      eq(creditCardBills.invoiceMonth, invoiceMonth)
    ),
    with: {
      payments: {
        with: {
          transaction: true,
        },
      },
    },
  });
}

function serializeBill(bill: Awaited<ReturnType<typeof getBillByAccountAndMonth>>) {
  if (!bill) {
    return null;
  }

  return {
    ...serializeTimestamps(bill),
    account: undefined,
    payments: bill.payments.map((payment) => ({
      ...serializeTimestamps(payment),
      transaction: payment.transaction ? serializeTimestamps(payment.transaction) : null,
    })),
  };
}

export async function getCreditCardBill(
  accountId: string,
  invoiceMonth: string,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const normalizedMonth = normalizeCompetenceMonth(invoiceMonth);
  const bill = await getBillByAccountAndMonth(accountId, normalizedMonth, db);

  invariant(bill, "CREDIT_CARD_BILL_NOT_FOUND", "Credit card bill does not exist.", 404);

  return serializeBill(bill);
}

export async function listCreditCardBills(
  options: { accountId?: string; invoiceMonth?: string } = {},
  database?: AppDb
) {
  const db = await resolveDb(database);
  const normalizedMonth = options.invoiceMonth
    ? normalizeCompetenceMonth(options.invoiceMonth)
    : undefined;
  const bills = await db.query.creditCardBills.findMany({
    where: (table, { and: whereAnd, eq: equals }) =>
      whereAnd(
        options.accountId ? equals(table.accountId, options.accountId) : undefined,
        normalizedMonth ? equals(table.invoiceMonth, normalizedMonth) : undefined
      ),
    with: {
      payments: {
        with: {
          transaction: true,
        },
      },
    },
    orderBy: (table, { desc }) => [desc(table.invoiceMonth)],
  });

  return bills.map(serializeBill);
}

export async function upsertCreditCardBill(
  input: CreditCardBillInput,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = creditCardBillSchema.parse(input);
  values.invoiceMonth = normalizeCompetenceMonth(values.invoiceMonth);
  values.dueDate = normalizeDate(values.dueDate);

  const account = await getAccountById(values.accountId, db);
  invariant(!account.isArchived, "ACCOUNT_ARCHIVED", "Cannot use an archived account.");
  invariant(
    account.type === "credit",
    "ACCOUNT_TYPE_MISMATCH",
    "Credit card bills require an account of type credit."
  );

  const existing = await getBillByAccountAndMonth(values.accountId, values.invoiceMonth, db);
  const bill = existing
    ? (
        await db
          .update(creditCardBills)
          .set({
            ...values,
            status: existing.status,
            paidAt: existing.paidAt,
            updatedAt: currentTimestamp(),
          })
          .where(eq(creditCardBills.id, existing.id))
          .returning()
      )[0]
    : (
        await db
          .insert(creditCardBills)
          .values({
            ...values,
            updatedAt: currentTimestamp(),
          })
          .returning()
      )[0];

  invariant(bill, "CREDIT_CARD_BILL_SAVE_FAILED", "Credit card bill could not be saved.", 500);
  return getCreditCardBill(values.accountId, values.invoiceMonth, db);
}

async function getOrCreatePaymentCategory(database: AppDb) {
  const existing = await database.query.categories.findFirst({
    where: and(
      eq(categories.name, paymentCategoryName),
      eq(categories.group, "fixed_expense")
    ),
  });

  if (existing) {
    invariant(!existing.isArchived, "CATEGORY_ARCHIVED", "Payment category is archived.");
    return existing;
  }

  const [category] = await database
    .insert(categories)
    .values({
      name: paymentCategoryName,
      group: "fixed_expense",
      updatedAt: currentTimestamp(),
    })
    .returning();

  invariant(category, "CATEGORY_CREATE_FAILED", "Payment category could not be created.", 500);
  return category;
}

function paymentDescription(invoiceMonth: string, kind: CreditCardBillPaymentInput["kind"]) {
  if (kind === "unlinked") {
    return "Pagamento de fatura anterior do cartão";
  }

  return kind === "pre_statement"
    ? `Pagamento antecipado da fatura do cartão ${invoiceMonth}`
    : `Pagamento da fatura do cartão ${invoiceMonth}`;
}

export async function createCreditCardBillPayment(
  input: CreditCardBillPaymentInput,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = creditCardBillPaymentSchema.parse(input);
  values.invoiceMonth = normalizeCompetenceMonth(values.invoiceMonth);
  values.paymentDate = normalizeDate(values.paymentDate);

  const existingPayment = await db.query.creditCardBillPayments.findFirst({
    where: eq(creditCardBillPayments.idempotencyKey, values.idempotencyKey),
    with: {
      transaction: true,
      bill: true,
    },
  });
  if (existingPayment) {
    return {
      ...serializeTimestamps(existingPayment),
      transaction: serializeTimestamps(existingPayment.transaction),
      bill: existingPayment.bill ? serializeTimestamps(existingPayment.bill) : null,
      idempotent: true,
    };
  }

  const cardAccount = await getAccountById(values.accountId, db);
  const paymentAccount = await getAccountById(values.paymentAccountId, db);
  invariant(!cardAccount.isArchived, "ACCOUNT_ARCHIVED", "Cannot use an archived card account.");
  invariant(!paymentAccount.isArchived, "ACCOUNT_ARCHIVED", "Cannot use an archived payment account.");
  invariant(
    cardAccount.type === "credit",
    "ACCOUNT_TYPE_MISMATCH",
    "Credit card payments require a credit card account."
  );
  invariant(
    paymentAccount.type === "checking" ||
      paymentAccount.type === "savings" ||
      paymentAccount.type === "cash",
    "INVALID_PAYMENT_ACCOUNT",
    "Credit card payments require a checking, savings, or cash account."
  );

  const bill =
    values.kind === "unlinked"
      ? null
      : await getBillByAccountAndMonth(values.accountId, values.invoiceMonth, db);
  if (values.kind !== "unlinked") {
    invariant(bill, "CREDIT_CARD_BILL_NOT_FOUND", "Credit card bill does not exist.", 404);
    invariant(
      bill.status !== "paid",
      "CREDIT_CARD_BILL_ALREADY_PAID",
      "Credit card bill is already paid."
    );
  }

  const category = await getOrCreatePaymentCategory(db);
  const description = values.description ?? paymentDescription(values.invoiceMonth, values.kind);

  return db.transaction(async (tx) => {
    const [transaction] = await tx
      .insert(transactions)
      .values({
        accountId: values.paymentAccountId,
        categoryId: category.id,
        type: "expense",
        status: "posted",
        amountCents: values.amountCents,
        transactionDate: values.paymentDate,
        competenceMonth: values.paymentDate.slice(0, 7),
        description,
        notes: `Pagamento vinculado ao cartão ${cardAccount.name}`,
        isIncludedInInvestmentCheckpoint: true,
        updatedAt: currentTimestamp(),
      })
      .returning();
    invariant(transaction, "TRANSACTION_CREATE_FAILED", "Payment transaction could not be created.", 500);

    const [payment] = await tx
      .insert(creditCardBillPayments)
      .values({
        billId: bill?.id ?? null,
        transactionId: transaction.id,
        paymentDate: values.paymentDate,
        amountCents: values.amountCents,
        kind: values.kind,
        idempotencyKey: values.idempotencyKey,
        updatedAt: currentTimestamp(),
      })
      .returning();
    invariant(payment, "CREDIT_CARD_PAYMENT_CREATE_FAILED", "Credit card payment could not be created.", 500);

    let updatedBillStatus = bill?.status;
    let updatedBillPaidAt = bill?.paidAt ?? null;
    if (bill && values.kind === "settlement") {
      const priorSettlements = bill.payments
        .filter((item) => item.kind === "settlement")
        .reduce((total, item) => total + item.amountCents, 0);
      const paid = priorSettlements + values.amountCents >= bill.statementTotalCents;
      if (paid) {
        const updatedBill = (
          await tx
            .update(creditCardBills)
            .set({
              status: "paid",
              paidAt: values.paymentDate,
              updatedAt: currentTimestamp(),
            })
            .where(eq(creditCardBills.id, bill.id))
            .returning()
        )[0];
        updatedBillStatus = updatedBill?.status ?? updatedBillStatus;
        updatedBillPaidAt = updatedBill?.paidAt ?? updatedBillPaidAt;
      }
    }

    return {
      ...serializeTimestamps(payment),
      transaction: serializeTimestamps(transaction),
      bill: bill
        ? {
            ...serializeTimestamps(bill),
            status: updatedBillStatus,
            paidAt: updatedBillPaidAt,
          }
        : null,
      idempotent: false,
    };
  });
}
