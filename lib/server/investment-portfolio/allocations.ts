import type { AppDb } from "@/lib/db";
import {
investmentHoldings,
investmentPurposeAllocations,
investmentPurposes
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp } from "@/lib/server/finance";
import { validatePurposeAllocationCapacity } from "@/lib/server/stages/validate-purpose-allocation-capacity";
import { and,eq } from "drizzle-orm";
import { z } from "zod";
import { assertNoActiveReductionSource,deleteAllocationSchema,investmentPurposeAllocationSchema,normalizeNullableText,normalizePortfolioDate,resolveDb,serializeAllocation } from "./validation";

export async function upsertInvestmentPurposeAllocation(
  input: z.input<typeof investmentPurposeAllocationSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = investmentPurposeAllocationSchema.parse(input);

  invariant(
    values.amountCents > 0,
    "ALLOCATION_AMOUNT_REQUIRED",
    "Informe um valor alocado maior que zero."
  );

  return db.transaction(async (transaction) => {
    const [holding, purpose, existing] = await Promise.all([
      transaction.query.investmentHoldings.findFirst({
        where: eq(investmentHoldings.id, values.holdingId),
      }),
      transaction.query.investmentPurposes.findFirst({
        where: eq(investmentPurposes.id, values.purposeId),
      }),
      transaction.query.investmentPurposeAllocations.findFirst({
        where: and(
          eq(investmentPurposeAllocations.holdingId, values.holdingId),
          eq(investmentPurposeAllocations.purposeId, values.purposeId)
        ),
      }),
    ]);

    invariant(holding, "INVESTMENT_HOLDING_NOT_FOUND", "Investment holding does not exist.", 404);
    invariant(purpose, "INVESTMENT_PURPOSE_NOT_FOUND", "Investment purpose does not exist.", 404);
    invariant(!holding.isArchived, "ARCHIVED_HOLDING_ALLOCATION", "Archived holdings cannot be allocated.");
    invariant(!purpose.isArchived, "ARCHIVED_PURPOSE_ALLOCATION", "Archived purposes cannot receive allocations.");

    await validatePurposeAllocationCapacity({ transaction, holding, existing, purpose, values });

    const allocationValues = {
      amountCents: values.amountCents,
      allocatedOn: normalizePortfolioDate(values.allocatedOn),
      notes: normalizeNullableText(values.notes),
      updatedAt: currentTimestamp(),
    };

    if (existing) {
      const [updated] = await transaction
        .update(investmentPurposeAllocations)
        .set(allocationValues)
        .where(eq(investmentPurposeAllocations.id, existing.id))
        .returning();

      invariant(
        updated,
        "ALLOCATION_UPDATE_FAILED",
        "Investment purpose allocation could not be updated.",
        500
      );

      return serializeAllocation(updated);
    }

    const [created] = await transaction
      .insert(investmentPurposeAllocations)
      .values({
        holdingId: values.holdingId,
        purposeId: values.purposeId,
        ...allocationValues,
      })
      .returning();

    invariant(
      created,
      "ALLOCATION_CREATE_FAILED",
      "Investment purpose allocation could not be created.",
      500
    );

    return serializeAllocation(created);
  });
}

export async function deleteInvestmentPurposeAllocation(
  input: string | z.input<typeof deleteAllocationSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = typeof input === "string" ? { id: input } : deleteAllocationSchema.parse(input);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentPurposeAllocations.findFirst({
      where:
        "id" in values
          ? eq(investmentPurposeAllocations.id, values.id)
          : and(
              eq(investmentPurposeAllocations.holdingId, values.holdingId),
              eq(investmentPurposeAllocations.purposeId, values.purposeId)
            ),
    });

    invariant(existing, "INVESTMENT_ALLOCATION_NOT_FOUND", "Investment purpose allocation does not exist.", 404);
    await assertNoActiveReductionSource(transaction, { allocationId: existing.id });

    const [deleted] = await transaction
      .delete(investmentPurposeAllocations)
      .where(eq(investmentPurposeAllocations.id, existing.id))
      .returning();

    invariant(
      deleted,
      "ALLOCATION_DELETE_FAILED",
      "Investment purpose allocation could not be deleted.",
      500
    );

    return serializeAllocation(deleted);
  });
}
