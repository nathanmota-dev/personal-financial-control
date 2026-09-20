import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z, ZodError } from "zod";

import type { AppDb } from "@/lib/db";
import { listAccounts, getAccountById } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";
import {
  createIdempotentCreditCardCharge,
  deleteCreditCardCharge,
  getCreditCardCharge,
  listCreditCardCharges,
  updateCreditCardCharge,
} from "@/lib/server/credit-card";
import { DomainError } from "@/lib/server/errors";
import {
  createIdempotentTransaction,
  deleteTransaction,
  getTransactionById,
  listTransactions,
  updateTransaction,
} from "@/lib/server/transactions";

const instructions = `Use list_finance_references before writing so account and category UUIDs are valid. Dates use ISO YYYY-MM-DD and competence/invoice months use YYYY-MM. Monetary values are integer cents. For PDF imports, call one create tool per source line and use a stable idempotency key in the format origem:periodo:linha. Ask the human for confirmation before deletion; delete tools also require confirm=true. Common transactions only support income/expense on non-credit accounts. Card purchases and adjustments must use the credit-card tools.`;

const readAnnotations = { readOnlyHint: true, openWorldHint: false } as const;
const createAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;
const destructiveAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false,
} as const;

function success(data: unknown) {
  const structuredContent = { ok: true, data };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(structuredContent) }],
    structuredContent,
  };
}

function failure(error: unknown) {
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

function handler<T>(callback: (input: T) => Promise<unknown>) {
  return async (input: T) => {
    try {
      return success(await callback(input));
    } catch (error) {
      return failure(error);
    }
  };
}

async function requireNonCreditAccount(accountId: string, database?: AppDb) {
  const account = await getAccountById(accountId, database);
  if (account.type === "credit") {
    throw new DomainError(
      "ACCOUNT_TYPE_MISMATCH",
      "Common transactions cannot use a credit account; use a credit-card tool."
    );
  }
  return account;
}

async function requireCommonTransaction(id: string, database?: AppDb) {
  const transaction = await getTransactionById(id, database);
  if (transaction.type !== "income" && transaction.type !== "expense") {
    throw new DomainError("TRANSACTION_OUT_OF_SCOPE", "Only income and expense transactions are available through MCP.");
  }
  await requireNonCreditAccount(transaction.accountId, database);
  return transaction;
}

const transactionFields = {
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

const chargeFields = {
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

export function createPersonalFinanceMcpServer(database?: AppDb) {
  const server = new McpServer(
    { name: "personal-financial-control", version: "1.0.0" },
    { instructions }
  );

  server.registerTool("list_finance_references", {
    description: "List active accounts and categories without balances.",
    inputSchema: z.object({}),
    annotations: readAnnotations,
  }, handler(async () => {
    const [accounts, categories] = await Promise.all([
      listAccounts(undefined, database),
      listCategories(undefined, database),
    ]);
    return {
      accounts: accounts.map(({ id, name, type, creditClosingDay, creditDueDay }) => ({
        id, name, type, creditClosingDay, creditDueDay,
      })),
      categories: categories.map(({ id, name, group }) => ({ id, name, group })),
    };
  }));

  server.registerTool("list_transactions", {
    description: "List income and expense entries on non-credit accounts for a competence month.",
    inputSchema: z.object({
      competenceMonth: z.string(),
      accountId: z.string().uuid().optional(),
      categoryId: z.string().uuid().optional(),
      type: z.enum(["income", "expense"]).optional(),
      status: z.enum(["pending", "posted", "cancelled"]).optional(),
    }),
    annotations: readAnnotations,
  }, handler(async (input) => {
    if (input.accountId) await requireNonCreditAccount(input.accountId, database);
    const rows = await listTransactions(input, database);
    return rows.filter((row) =>
      (row.type === "income" || row.type === "expense") &&
      row.account?.type !== "credit" &&
      (!input.type || row.type === input.type)
    );
  }));

  server.registerTool("get_transaction", {
    description: "Get one in-scope income or expense transaction by UUID.",
    inputSchema: z.object({ id: z.string().uuid() }),
    annotations: readAnnotations,
  }, handler(async ({ id }) => requireCommonTransaction(id, database)));

  server.registerTool("create_transaction", {
    description: "Idempotently create one income or expense transaction.",
    inputSchema: z.object({ idempotencyKey: z.string().trim().min(1).max(255), ...transactionFields }),
    annotations: createAnnotations,
  }, handler(async ({ idempotencyKey, ...input }) => {
    await requireNonCreditAccount(input.accountId, database);
    const result = await createIdempotentTransaction({ ...input, importFingerprint: idempotencyKey }, database);
    return { ...result.transaction, created: result.created };
  }));

  const transactionUpdateSchema = z.object({
    id: z.string().uuid(),
    accountId: transactionFields.accountId.optional(),
    categoryId: transactionFields.categoryId,
    type: transactionFields.type.optional(),
    status: transactionFields.status,
    amountCents: transactionFields.amountCents.optional(),
    transactionDate: transactionFields.transactionDate.optional(),
    competenceMonth: transactionFields.competenceMonth.optional(),
    description: transactionFields.description.optional(),
    notes: transactionFields.notes,
  }).refine((values) => Object.entries(values).some(([key, value]) => key !== "id" && value !== undefined), {
    message: "At least one field must be changed.",
  });
  server.registerTool("update_transaction", {
    description: "Partially update an in-scope income or expense transaction.",
    inputSchema: transactionUpdateSchema,
    annotations: destructiveAnnotations,
  }, handler(async ({ id, ...input }) => {
    await requireCommonTransaction(id, database);
    if (input.accountId) await requireNonCreditAccount(input.accountId, database);
    return updateTransaction({ id, ...input }, database);
  }));

  server.registerTool("delete_transaction", {
    description: "Delete an in-scope transaction after explicit confirmation.",
    inputSchema: z.object({ id: z.string().uuid(), confirm: z.literal(true) }),
    annotations: destructiveAnnotations,
  }, handler(async ({ id }) => {
    await requireCommonTransaction(id, database);
    await deleteTransaction(id, database);
    return { id, deleted: true };
  }));

  server.registerTool("list_credit_card_charges", {
    description: "List card charges that have an installment in the requested invoice month.",
    inputSchema: z.object({ accountId: z.string().uuid(), invoiceMonth: z.string() }),
    annotations: readAnnotations,
  }, handler(async (input) => {
    const account = await getAccountById(input.accountId, database);
    if (account.type !== "credit") throw new DomainError("ACCOUNT_TYPE_MISMATCH", "A credit account is required.");
    const rows = await listCreditCardCharges(input, database);
    return rows.filter((row) => row.installments.length > 0);
  }));

  server.registerTool("get_credit_card_charge", {
    description: "Get one credit-card purchase or adjustment by UUID.",
    inputSchema: z.object({ id: z.string().uuid() }),
    annotations: readAnnotations,
  }, handler(async ({ id }) => getCreditCardCharge(id, database)));

  server.registerTool("create_credit_card_charge", {
    description: "Idempotently create one card purchase or adjustment and its installments.",
    inputSchema: z.object({ idempotencyKey: z.string().trim().min(1).max(255), ...chargeFields }),
    annotations: createAnnotations,
  }, handler(async ({ idempotencyKey, ...input }) => {
    const result = await createIdempotentCreditCardCharge({ ...input, importFingerprint: idempotencyKey }, database);
    return { ...result.charge, created: result.created };
  }));

  const chargeUpdateSchema = z.object({
    id: z.string().uuid(),
    accountId: chargeFields.accountId.optional(),
    categoryId: chargeFields.categoryId.optional(),
    description: chargeFields.description.optional(),
    purchaseDate: chargeFields.purchaseDate.optional(),
    totalAmountCents: chargeFields.totalAmountCents.optional(),
    installmentCount: chargeFields.installmentCount.optional(),
    kind: chargeFields.kind.optional(),
    notes: chargeFields.notes,
    firstInvoiceMonth: chargeFields.firstInvoiceMonth,
  }).refine((values) => Object.entries(values).some(([key, value]) => key !== "id" && value !== undefined), {
    message: "At least one field must be changed.",
  });
  server.registerTool("update_credit_card_charge", {
    description: "Partially update a card charge and recalculate its installments.",
    inputSchema: chargeUpdateSchema,
    annotations: destructiveAnnotations,
  }, handler(async (input) => updateCreditCardCharge(input, database)));

  server.registerTool("delete_credit_card_charge", {
    description: "Delete a card charge after explicit confirmation.",
    inputSchema: z.object({ id: z.string().uuid(), confirm: z.literal(true) }),
    annotations: destructiveAnnotations,
  }, handler(async ({ id }) => {
    await deleteCreditCardCharge(id, database);
    return { id, deleted: true };
  }));

  return server;
}

export { instructions as personalFinanceMcpInstructions };
