import type { RegisterMcpReadAndCreateToolsContext } from "@/lib/interfaces/stages/register-mcp-read-and-create-tools";
import { createAnnotations,readAnnotations,transactionFields } from "@/lib/mcp/tool-support";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";
import {
createIdempotentTransaction,
listTransactions
} from "@/lib/server/transactions";
import { z } from "zod";

export function registerMcpReadAndCreateTools({ server, handler, database, requireNonCreditAccount, requireCommonTransaction }: RegisterMcpReadAndCreateToolsContext) {
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

}
