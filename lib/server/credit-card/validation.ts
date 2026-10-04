import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
creditCardChargeKinds,
creditCardCharges,
creditCardInstallments
} from "@/lib/db/schema";
import { getAccountById } from "@/lib/server/accounts";
import { getCategoryById } from "@/lib/server/categories";
import { invariant } from "@/lib/server/errors";
import {
normalizeCompetenceMonth,
normalizeDate,
serializeTimestamps
} from "@/lib/server/finance";
import { z } from "zod";


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

export async function resolveDb(database?: AppDb) {
  return database ?? getFinanceDatabase();
}

export function shiftMonth(value: string, delta: number) {
  const [year, month] = normalizeCompetenceMonth(value).split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1 + delta, 1));

  return `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getMonthFromDate(value: string) {
  return normalizeDate(value).slice(0, 7);
}

export function resolveFirstInvoiceMonth(purchaseDate: string, creditClosingDay: number) {
  const normalizedDate = normalizeDate(purchaseDate);
  const purchaseDay = Number(normalizedDate.slice(8, 10));
  const purchaseMonth = getMonthFromDate(normalizedDate);

  return purchaseDay <= creditClosingDay ? purchaseMonth : shiftMonth(purchaseMonth, 1);
}

export function splitInstallmentAmounts(totalAmountCents: number, installmentCount: number) {
  const baseAmountCents = Math.floor(totalAmountCents / installmentCount);
  const remainderCents = totalAmountCents % installmentCount;

  return Array.from({ length: installmentCount }, (_, index) =>
    baseAmountCents + (index < remainderCents ? 1 : 0)
  );
}

export async function validateCreditCardChargeDependencies(
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

export function serializeCreditCardCharge(
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
