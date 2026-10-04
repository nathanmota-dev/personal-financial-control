import type { RegisterMcpTransactionMutationToolsContext } from "@/lib/interfaces/stages/register-mcp-transaction-mutation-tools";
import { destructiveAnnotations,transactionFields } from "@/lib/mcp/tool-support";
import {
deleteTransaction,
updateTransaction
} from "@/lib/server/transactions";
import { z } from "zod";

export function registerMcpTransactionMutationTools({ server, handler, requireCommonTransaction, database, requireNonCreditAccount }: RegisterMcpTransactionMutationToolsContext) {
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

}
