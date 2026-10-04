import type { AppDb } from "@/lib/db";
import {
investmentPurposeAllocations,
investmentPurposes
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp } from "@/lib/server/finance";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { assertNoActiveReductionSource,investmentPurposeSchema,normalizeNullableText,resolveDb,serializePurpose,sumAllocationAmounts,updateInvestmentPurposeSchema } from "./validation";

export async function createInvestmentPurpose(
  input: z.input<typeof investmentPurposeSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = investmentPurposeSchema.parse(input);
  const [created] = await db
    .insert(investmentPurposes)
    .values({
      name: values.name,
      kind: values.kind,
      targetAmountCents: values.targetAmountCents ?? null,
      color: values.color,
      notes: normalizeNullableText(values.notes),
    })
    .returning();

  invariant(created, "PURPOSE_CREATE_FAILED", "Investment purpose could not be created.", 500);

  return serializePurpose(created);
}

export async function updateInvestmentPurpose(
  input: z.input<typeof updateInvestmentPurposeSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = updateInvestmentPurposeSchema.parse(input);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentPurposes.findFirst({
      where: eq(investmentPurposes.id, values.id),
    });

    invariant(existing, "INVESTMENT_PURPOSE_NOT_FOUND", "Investment purpose does not exist.", 404);

    const [updated] = await transaction
      .update(investmentPurposes)
      .set({
        name: values.name ?? existing.name,
        kind: values.kind ?? existing.kind,
        targetAmountCents:
          values.targetAmountCents === undefined
            ? existing.targetAmountCents
            : values.targetAmountCents,
        color: values.color ?? existing.color,
        notes:
          values.notes === undefined ? existing.notes : normalizeNullableText(values.notes),
        updatedAt: currentTimestamp(),
      })
      .where(eq(investmentPurposes.id, values.id))
      .returning();

    invariant(updated, "PURPOSE_UPDATE_FAILED", "Investment purpose could not be updated.", 500);

    return serializePurpose(updated);
  });
}

export async function archiveInvestmentPurpose(id: string, database?: AppDb) {
  const db = await resolveDb(database);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentPurposes.findFirst({
      where: eq(investmentPurposes.id, id),
    });

    invariant(existing, "INVESTMENT_PURPOSE_NOT_FOUND", "Investment purpose does not exist.", 404);

    const allocations = await transaction.query.investmentPurposeAllocations.findMany({
      where: eq(investmentPurposeAllocations.purposeId, id),
    });
    await assertNoActiveReductionSource(transaction, { purposeId: id });
    invariant(
      sumAllocationAmounts(allocations) === 0,
      "PURPOSE_ARCHIVE_REQUIRES_ZERO_BALANCE",
      "A purpose can only be archived when it has no allocated balance."
    );

    const [archived] = await transaction
      .update(investmentPurposes)
      .set({ isArchived: true, updatedAt: currentTimestamp() })
      .where(eq(investmentPurposes.id, id))
      .returning();

    invariant(archived, "PURPOSE_ARCHIVE_FAILED", "Investment purpose could not be archived.", 500);

    return serializePurpose(archived);
  });
}
