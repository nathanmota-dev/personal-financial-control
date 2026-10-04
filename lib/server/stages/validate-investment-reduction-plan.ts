import {
investmentHoldings,
investmentPurposeAllocations,
investmentPurposes
} from "@/lib/db/schema";
import type { ValidateInvestmentReductionPlanContext } from "@/lib/interfaces/stages/validate-investment-reduction-plan";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp } from "@/lib/server/finance";
import { eq,inArray } from "drizzle-orm";

export async function validateInvestmentReductionPlan({ transaction, allocationReductions, holdingReductions }: ValidateInvestmentReductionPlanContext) {
const allocationRows = await transaction.query.investmentPurposeAllocations.findMany({
    where: inArray(investmentPurposeAllocations.id, [...allocationReductions.keys()]),
  });

const allocationsById = new Map(allocationRows.map((allocation) => [allocation.id, allocation]));

const holdingRows = await transaction.query.investmentHoldings.findMany({
    where: inArray(investmentHoldings.id, [...holdingReductions.keys()]),
  });

const holdingsById = new Map(holdingRows.map((holding) => [holding.id, holding]));

const purposeIds = allocationRows.map((allocation) => allocation.purposeId);

const purposeRows = purposeIds.length
    ? await transaction.query.investmentPurposes.findMany({
        where: inArray(investmentPurposes.id, purposeIds),
      })
    : [];

const purposesById = new Map(purposeRows.map((purpose) => [purpose.id, purpose]));

for (const [allocationId, amountCents] of allocationReductions) {
    const allocation = allocationsById.get(allocationId);
    invariant(
      allocation,
      "INVESTMENT_REDUCTION_ALLOCATION_NOT_FOUND",
      "A alocação selecionada não existe mais."
    );
    const purpose = purposesById.get(allocation.purposeId);
    const holding = holdingsById.get(allocation.holdingId);
    invariant(
      holding && purpose,
      "INVESTMENT_REDUCTION_SOURCE_NOT_FOUND",
      "O ativo ou a caixinha selecionada não existe mais."
    );
    invariant(!holding.isArchived, "ARCHIVED_HOLDING_REDUCTION", "Ativos arquivados não podem ser reduzidos.");
    invariant(!purpose.isArchived, "ARCHIVED_PURPOSE_REDUCTION", "Caixinhas arquivadas não podem ser reduzidas.");
    invariant(
      amountCents <= allocation.amountCents,
      "INVESTMENT_REDUCTION_EXCEEDS_SOURCE",
      "A redução excede o saldo disponível na alocação."
    );
  }

for (const [holdingId, amountCents] of holdingReductions) {
    const holding = holdingsById.get(holdingId);
invariant(holding, "INVESTMENT_HOLDING_NOT_FOUND", "O ativo selecionado não existe mais.");
invariant(!holding.isArchived, "ARCHIVED_HOLDING_REDUCTION", "Ativos arquivados não podem ser reduzidos.");
invariant(
      amountCents <= holding.currentValueCents,
      "INVESTMENT_REDUCTION_EXCEEDS_SOURCE",
      `O ativo ${holding.name} não possui saldo suficiente para esta redução.`
    );
const allAllocations = await transaction.query.investmentPurposeAllocations.findMany({
      where: eq(investmentPurposeAllocations.holdingId, holdingId),
    });
const currentAllocatedCents = allAllocations.reduce(
      (total, allocation) => total + allocation.amountCents,
      0
    );
const allocationReductionCents = allAllocations.reduce(
      (total, allocation) => total + (allocationReductions.get(allocation.id) ?? 0),
      0
    );
invariant(
      currentAllocatedCents - allocationReductionCents <= holding.currentValueCents - amountCents,
      "INVESTMENT_REDUCTION_BREAKS_ALLOCATION",
      "A redução deixaria as caixinhas acima do valor atual do ativo."
    );
  }

const timestamp = currentTimestamp();
return { timestamp, allocationsById, holdingsById };
}
