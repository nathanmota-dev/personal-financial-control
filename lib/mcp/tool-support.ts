import type { AppDb } from "@/lib/db";
import { getAccountById } from "@/lib/server/accounts";
import { DomainError } from "@/lib/server/errors";
import {
getTransactionById
} from "@/lib/server/transactions";
import { z,ZodError } from "zod";

export const instructions = `Use list_finance_references before writing so account and category UUIDs are valid. Dates use ISO YYYY-MM-DD and competence/invoice months use YYYY-MM. Monetary values are integer cents. For PDF imports, call one create tool per source line and use a stable idempotency key in the format origem:periodo:linha. Ask the human for confirmation before deletion; delete tools also require confirm=true. Common transactions only support income/expense on non-credit accounts. Card purchases and adjustments must use the credit-card tools.`;

export const readAnnotations = { readOnlyHint: true, openWorldHint: false } as const;

export const createAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const destructiveAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false,
} as const;

export function success(data: unknown) {
  const structuredContent = { ok: true, data };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(structuredContent) }],
    structuredContent,
  };
}

export function failure(error: unknown) {
  const body = error instanceof DomainError
    ? { code: error.code, message: error.message }
    : error instanceof ZodError
      ? { code: "VALIDATION_ERROR", message: "Invalid tool input.", issues: error.issues }
      : { code: "INTERNAL_ERROR", message: "The operation could not be completed." };
  const structuredContent = { ok: false, ...body };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(structuredContent) }],
    structuredContent,
    isError: true,
  };
}

export function handler<T>(callback: (input: T) => Promise<unknown>) {
  return async (input: T) => {
    try {
      return success(await callback(input));
    } catch (error) {
      return failure(error);
    }
  };
}

export async function requireNonCreditAccount(accountId: string, database?: AppDb) {
  const account = await getAccountById(accountId, database);
  if (account.type === "credit") {
    throw new DomainError(
      "ACCOUNT_TYPE_MISMATCH",
      "Common transactions cannot use a credit account; use a credit-card tool."
    );
  }
  return account;
}

export async function requireCommonTransaction(id: string, database?: AppDb) {
  const transaction = await getTransactionById(id, database);
  if (transaction.type !== "income" && transaction.type !== "expense") {
    throw new DomainError("TRANSACTION_OUT_OF_SCOPE", "Only income and expense transactions are available through MCP.");
  }
  await requireNonCreditAccount(transaction.accountId, database);
  return transaction;
}

export const transactionFields = {
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  type: z.enum(["income", "expense"]),
  status: z.enum(["pending", "posted", "cancelled"]).optional(),
  amountCents: z.number().int().positive(),
  transactionDate: z.string(),
  competenceMonth: z.string(),
  description: z.string().trim().min(1),
  notes: z.string().trim().optional(),
};

export const chargeFields = {
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  description: z.string().trim().min(1),
  purchaseDate: z.string(),
  totalAmountCents: z.number().int().refine((value) => value !== 0, "Amount cannot be zero."),
  installmentCount: z.number().int().min(1).max(60),
  kind: z.enum(["purchase", "adjustment"]),
  notes: z.string().trim().nullable().optional(),
  firstInvoiceMonth: z.string().optional(),
};