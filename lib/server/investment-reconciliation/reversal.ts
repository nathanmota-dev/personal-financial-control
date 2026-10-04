import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
investmentHoldings,
investmentPurposeAllocations,
investmentPurposes,
investmentReductionEvents,
investmentReductionSources
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp } from "@/lib/server/finance";
import { buildInvestmentReductionRestorationPlan } from "@/lib/server/stages/build-investment-reduction-restoration-plan";
import { and,eq,inArray } from "drizzle-orm";
import { z } from "zod";
import { applyInvestmentReductionInTransaction } from "./apply";
import { AppDbTransaction,investmentReductionSchema } from "./validation";

export async function applyInvestmentReduction(
  input: z.input<typeof investmentReductionSchema>,
  database?: AppDb
) {
  const db = database ?? (await getFinanceDatabase());
  return db.transaction((transaction) => applyInvestmentReductionInTransaction(transaction, input));
}

export async function reverseInvestmentReductionEvent(
  eventId: string,
  transaction: AppDbTransaction
) {
  const event = await transaction.query.investmentReductionEvents.findFirst({
    where: and(
      eq(investmentReductionEvents.id, eventId),
      eq(investmentReductionEvents.status, "active")
    ),
  });

  if (!event) {
    return false;
  }

  const sources = await transaction.query.investmentReductionSources.findMany({
    where: eq(investmentReductionSources.eventId, event.id),
  });
  const { allocationRestores, holdingRestores } = buildInvestmentReductionRestorationPlan({ sources });

  const allocationRows = await transaction.query.investmentPurposeAllocations.findMany({
    where: inArray(investmentPurposeAllocations.id, [...allocationRestores.keys()]),
  });
  const allocationsById = new Map(allocationRows.map((allocation) => [allocation.id, allocation]));
  const holdingRows = await transaction.query.investmentHoldings.findMany({
    where: inArray(investmentHoldings.id, [...holdingRestores.keys()]),
  });
  const holdingsById = new Map(holdingRows.map((holding) => [holding.id, holding]));
  const purposeRows = allocationRows.length
    ? await transaction.query.investmentPurposes.findMany({
        where: inArray(
          investmentPurposes.id,
          allocationRows.map((allocation) => allocation.purposeId)
        ),
      })
    : [];
  const purposesById = new Map(purposeRows.map((purpose) => [purpose.id, purpose]));

  for (const [allocationId, amountCents] of allocationRestores) {
    const allocation = allocationsById.get(allocationId);
    invariant(allocation, "INVESTMENT_REDUCTION_SOURCE_MISSING", "A alocação de uma redução não existe mais.");
    const purpose = purposesById.get(allocation.purposeId);
    invariant(purpose && !purpose.isArchived, "ARCHIVED_PURPOSE_REDUCTION", "Reative a caixinha antes de editar este resgate.");
    const [updated] = await transaction
      .update(investmentPurposeAllocations)
      .set({ amountCents: allocation.amountCents + amountCents, updatedAt: currentTimestamp() })
      .where(eq(investmentPurposeAllocations.id, allocationId))
      .returning();
    invariant(updated, "INVESTMENT_REDUCTION_RESTORE_FAILED", "Não foi possível restaurar a alocação.", 500);
  }

  for (const [holdingId, amountCents] of holdingRestores) {
    const holding = holdingsById.get(holdingId);
    invariant(holding && !holding.isArchived, "ARCHIVED_HOLDING_REDUCTION", "Reative o ativo antes de editar este resgate.");
    const [updated] = await transaction
      .update(investmentHoldings)
      .set({ currentValueCents: holding.currentValueCents + amountCents, updatedAt: currentTimestamp() })
      .where(eq(investmentHoldings.id, holdingId))
      .returning();
    invariant(updated, "INVESTMENT_REDUCTION_RESTORE_FAILED", "Não foi possível restaurar o ativo.", 500);
  }

  const [reversed] = await transaction
    .update(investmentReductionEvents)
    .set({ status: "reversed", reversedAt: currentTimestamp(), updatedAt: currentTimestamp() })
    .where(eq(investmentReductionEvents.id, event.id))
    .returning();
  invariant(reversed, "INVESTMENT_REDUCTION_REVERSE_FAILED", "Não foi possível reverter a redução.", 500);

  return true;
}

export async function reverseInvestmentReductionForTransaction(
  transactionId: string,
  database: AppDbTransaction
) {
  const event = await database.query.investmentReductionEvents.findFirst({
    where: and(
      eq(investmentReductionEvents.transactionId, transactionId),
      eq(investmentReductionEvents.status, "active")
    ),
  });

  return event ? reverseInvestmentReductionEvent(event.id, database) : false;
}

export async function applyInvestmentReductionInExistingTransaction(
  database: AppDbTransaction,
  input: z.input<typeof investmentReductionSchema>
) {
  return applyInvestmentReductionInTransaction(database, input);
}
