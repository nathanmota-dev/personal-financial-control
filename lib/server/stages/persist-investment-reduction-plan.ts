import {
investmentHoldings,
investmentPurposeAllocations,
investmentReductionSources
} from "@/lib/db/schema";
import type { PersistInvestmentReductionPlanContext } from "@/lib/interfaces/stages/persist-investment-reduction-plan";
import { invariant } from "@/lib/server/errors";
import { eq } from "drizzle-orm";

export async function persistInvestmentReductionPlan({ event, allocationReductions, allocationsById, transaction, timestamp, holdingReductions, holdingsById, sourceRows }: PersistInvestmentReductionPlanContext) {
invariant(event, "INVESTMENT_REDUCTION_EVENT_FAILED", "Não foi possível registrar a redução.", 500);

for (const [allocationId, amountCents] of allocationReductions) {
    const allocation = allocationsById.get(allocationId);
    invariant(allocation, "INVESTMENT_REDUCTION_ALLOCATION_NOT_FOUND", "A alocação selecionada não existe mais.");
    const [updated] = await transaction
      .update(investmentPurposeAllocations)
      .set({ amountCents: allocation.amountCents - amountCents, updatedAt: timestamp })
      .where(eq(investmentPurposeAllocations.id, allocationId))
      .returning();
    invariant(updated, "INVESTMENT_REDUCTION_ALLOCATION_UPDATE_FAILED", "Não foi possível reduzir a alocação.", 500);
  }

for (const [holdingId, amountCents] of holdingReductions) {
    const holding = holdingsById.get(holdingId);
invariant(holding, "INVESTMENT_HOLDING_NOT_FOUND", "O ativo selecionado não existe mais.");
const [updated] = await transaction
      .update(investmentHoldings)
      .set({ currentValueCents: holding.currentValueCents - amountCents, updatedAt: timestamp })
      .where(eq(investmentHoldings.id, holdingId))
      .returning();
invariant(updated, "INVESTMENT_REDUCTION_HOLDING_UPDATE_FAILED", "Não foi possível reduzir o ativo.", 500);
  }

const insertedSources = sourceRows.length
    ? await transaction
        .insert(investmentReductionSources)
        .values(
          sourceRows.map((source) => ({
            eventId: event.id,
            ...source,
            updatedAt: timestamp,
          }))
        )
        .returning()
    : [];
return { insertedSources };
}
