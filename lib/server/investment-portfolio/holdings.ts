import type { AppDb } from "@/lib/db";
import {
investmentHoldings,
investmentPurposeAllocations,
investmentPurposes
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import { and,eq } from "drizzle-orm";
import { z } from "zod";
import { assertNoActiveReductionSource,investmentHoldingSchema,normalizeNullableText,normalizePortfolioDate,resolveDb,serializeHolding,sumAllocationAmounts,updateInvestmentHoldingSchema } from "./validation";

export async function createInvestmentHolding(
  input: z.input<typeof investmentHoldingSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = investmentHoldingSchema.parse(input);
  const [created] = await db
    .insert(investmentHoldings)
    .values({
      name: values.name,
      ticker: normalizeNullableText(values.ticker),
      institutionName: normalizeNullableText(values.institutionName),
      assetClass: values.assetClass,
      instrumentType: values.instrumentType,
      currentValueCents: values.currentValueCents,
      valueAsOf: normalizePortfolioDate(values.valueAsOf ?? getFinanceToday()),
      notes: normalizeNullableText(values.notes),
    })
    .returning();

  invariant(created, "HOLDING_CREATE_FAILED", "Investment holding could not be created.", 500);

  return serializeHolding(created);
}

export async function updateInvestmentHolding(
  input: z.input<typeof updateInvestmentHoldingSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = updateInvestmentHoldingSchema.parse(input);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentHoldings.findFirst({
      where: eq(investmentHoldings.id, values.id),
    });

    invariant(existing, "INVESTMENT_HOLDING_NOT_FOUND", "Investment holding does not exist.", 404);

    const allocations = await transaction.query.investmentPurposeAllocations.findMany({
      where: eq(investmentPurposeAllocations.holdingId, existing.id),
    });
    const allocatedCents = sumAllocationAmounts(allocations);
    const currentValueCents = values.currentValueCents ?? existing.currentValueCents;

    invariant(
      currentValueCents >= allocatedCents,
      "HOLDING_VALUE_BELOW_ALLOCATIONS",
      "The current value cannot be lower than the holding allocations."
    );

    const [updated] = await transaction
      .update(investmentHoldings)
      .set({
        name: values.name ?? existing.name,
        ticker:
          values.ticker === undefined
            ? existing.ticker
            : normalizeNullableText(values.ticker),
        institutionName:
          values.institutionName === undefined
            ? existing.institutionName
            : normalizeNullableText(values.institutionName),
        assetClass: values.assetClass ?? existing.assetClass,
        instrumentType: values.instrumentType ?? existing.instrumentType,
        currentValueCents,
        valueAsOf:
          values.valueAsOf === undefined
            ? existing.valueAsOf
            : normalizePortfolioDate(values.valueAsOf),
        notes:
          values.notes === undefined ? existing.notes : normalizeNullableText(values.notes),
        updatedAt: currentTimestamp(),
      })
      .where(eq(investmentHoldings.id, existing.id))
      .returning();

    invariant(updated, "HOLDING_UPDATE_FAILED", "Investment holding could not be updated.", 500);

    const reservePurpose = await transaction.query.investmentPurposes.findFirst({
      where: and(
        eq(investmentPurposes.kind, "emergency_reserve"),
        eq(investmentPurposes.isArchived, false)
      ),
    });
    if (reservePurpose) {
      await transaction
        .update(investmentPurposeAllocations)
        .set({ amountCents: updated.currentValueCents, updatedAt: currentTimestamp() })
        .where(
          and(
            eq(investmentPurposeAllocations.holdingId, updated.id),
            eq(investmentPurposeAllocations.purposeId, reservePurpose.id)
          )
        );
    }

    return serializeHolding(updated);
  });
}

export async function archiveInvestmentHolding(id: string, database?: AppDb) {
  const db = await resolveDb(database);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentHoldings.findFirst({
      where: eq(investmentHoldings.id, id),
    });

    invariant(existing, "INVESTMENT_HOLDING_NOT_FOUND", "Investment holding does not exist.", 404);
    invariant(
      existing.currentValueCents === 0,
      "HOLDING_ARCHIVE_REQUIRES_ZERO_VALUE",
      "An investment holding can only be archived when its current value is zero."
    );

    const allocations = await transaction.query.investmentPurposeAllocations.findMany({
      where: eq(investmentPurposeAllocations.holdingId, id),
    });
    await assertNoActiveReductionSource(transaction, { holdingId: id });
    invariant(
      allocations.length === 0,
      "HOLDING_ARCHIVE_REQUIRES_NO_ALLOCATIONS",
      "Remove all holding allocations before archiving it."
    );

    const [archived] = await transaction
      .update(investmentHoldings)
      .set({ isArchived: true, updatedAt: currentTimestamp() })
      .where(eq(investmentHoldings.id, id))
      .returning();

    invariant(archived, "HOLDING_ARCHIVE_FAILED", "Investment holding could not be archived.", 500);

    return serializeHolding(archived);
  });
}
