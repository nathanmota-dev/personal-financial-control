import type { RegisterMcpCreditCardToolsContext } from "@/lib/interfaces/stages/register-mcp-credit-card-tools";
import { matchesRecordFilters,recordFilterFields } from "@/lib/mcp/record-filters";
import { chargeFields,createAnnotations,destructiveAnnotations,readAnnotations } from "@/lib/mcp/tool-support";
import { getFinanceDatabase } from "@/lib/db";
import { getAccountById } from "@/lib/server/accounts";
import {
createIdempotentCreditCardCharge,
deleteCreditCardCharge,
getCreditCardCharge,
listCreditCardCharges,
updateCreditCardCharge,
} from "@/lib/server/credit-card";
import { DomainError } from "@/lib/server/errors";
import { findPendingCategory } from "@/lib/server/pending-category";
import { z } from "zod";

export function registerMcpCreditCardTools({ server, handler, database }: RegisterMcpCreditCardToolsContext) {
server.registerTool("list_credit_card_charges", {
    description: "List card purchases and adjustments. With invoiceMonth, only charges with an installment in that invoice, showing just those installments. Also filters by card, purchase date range, description text or uncategorized (the pending placeholder).",
    inputSchema: z.object({
      accountId: z.string().uuid().optional(),
      invoiceMonth: z.string().optional(),
      ...recordFilterFields,
    }),
    annotations: readAnnotations,
  }, handler(async (input) => {
    if (input.accountId) {
      const account = await getAccountById(input.accountId, database);
      if (account.type !== "credit") throw new DomainError("ACCOUNT_TYPE_MISMATCH", "A credit account is required.");
    }
    // Card purchases always have a category, so "uncategorized" means the pending placeholder.
    const pending = input.uncategorized ? await findPendingCategory(database ?? await getFinanceDatabase()) : null;
    const rows = await listCreditCardCharges(input, database);
    return rows.filter((row) =>
      (!input.invoiceMonth || row.installments.length > 0) &&
      (!input.uncategorized || row.categoryId === pending?.id) &&
      matchesRecordFilters({ date: row.purchaseDate, description: row.description }, input)
    );
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

}
