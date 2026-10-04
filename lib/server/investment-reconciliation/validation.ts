import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
investmentHoldings,
investmentPurposeAllocations,
investmentPurposes
} from "@/lib/db/schema";
import type {
InvestmentReductionSelection
} from "@/lib/interfaces/investment-reconciliation";
import { z } from "zod";


export type AppDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

export type ReconciliationDb = AppDb | AppDbTransaction;

export const sourceSelectionSchema = z
  .object({
    sourceId: z.string().trim().min(1).optional(),
    sourceType: z.enum(["allocation", "holding_free", "not_registered"]).optional(),
    holdingId: z.string().uuid().optional(),
    purposeId: z.string().uuid().optional(),
    allocationId: z.string().uuid().optional(),
    amountCents: z.number().int().positive(),
  })
  .superRefine((value, context) => {
    if (
      !value.sourceId &&
      value.sourceType !== "not_registered" &&
      !value.holdingId &&
      !value.allocationId
    ) {
      context.addIssue({
        code: "custom",
        message: "Investment reduction source is missing an identifier.",
        path: ["sourceId"],
      });
    }
  });

export const investmentReductionSelectionSchema = sourceSelectionSchema;

export const reductionInputSchema = z.object({
  amountCents: z.number().int().positive(),
  eventType: z.enum(["withdrawal", "reconciliation"]),
  occurredOn: z.string(),
  transactionId: z.string().uuid().optional(),
  sourceSelections: z.array(sourceSelectionSchema).optional(),
  sources: z.array(sourceSelectionSchema).optional(),
});

export const investmentReductionSchema = reductionInputSchema;

export type InvestmentReductionSourcesOptions = {
  asOfDate?: string;
  transactionId?: string;
};

export type ReductionInput = z.input<typeof reductionInputSchema>;

export type SourceSelectionInput = z.input<typeof sourceSelectionSchema>;

export type HoldingRow = typeof investmentHoldings.$inferSelect;

export type PurposeRow = typeof investmentPurposes.$inferSelect;

export type AllocationRow = typeof investmentPurposeAllocations.$inferSelect;

export function resolveReadDb(database?: ReconciliationDb) {
  return database ?? getFinanceDatabase();
}

export function sourceIdForAllocation(allocationId: string) {
  return `allocation:${allocationId}`;
}

export function sourceIdForHolding(holdingId: string) {
  return `holding:${holdingId}`;
}

export const notRegisteredSourceId = "not-registered";

export function sourceSelectionsFromInput(input: {
  sourceSelections?: SourceSelectionInput[];
  sources?: SourceSelectionInput[];
}) {
  return input.sourceSelections ?? input.sources ?? [];
}

export function normalizeSelection(selection: SourceSelectionInput): InvestmentReductionSelection & {
  sourceType?: SourceSelectionInput["sourceType"];
  holdingId?: string;
  purposeId?: string;
  allocationId?: string;
} {
  return {
    sourceId: selection.sourceId ?? buildSourceIdFromFields(selection),
    amountCents: selection.amountCents,
    sourceType: selection.sourceType,
    holdingId: selection.holdingId,
    purposeId: selection.purposeId,
    allocationId: selection.allocationId,
  };
}

export function buildSourceIdFromFields(selection: SourceSelectionInput) {
  if (selection.sourceType === "not_registered") {
    return notRegisteredSourceId;
  }

  if (selection.sourceType === "allocation" && selection.allocationId) {
    return sourceIdForAllocation(selection.allocationId);
  }

  if (selection.allocationId) {
    return sourceIdForAllocation(selection.allocationId);
  }

  if (selection.sourceType === "holding_free" && selection.holdingId) {
    return sourceIdForHolding(selection.holdingId);
  }

  if (selection.holdingId) {
    return sourceIdForHolding(selection.holdingId);
  }

  throw new Error("Investment reduction source is missing an identifier.");
}
