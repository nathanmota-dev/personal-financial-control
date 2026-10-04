import type { BuildPortfolioPositionCardsContext } from "@/lib/interfaces/stages/build-portfolio-position-cards";
import { buildPercentage,serializeAllocation,serializeHolding,serializePurpose,sortAllocations,sumAllocationAmounts } from "@/lib/server/investment-portfolio/validation";

export function buildPortfolioPositionCards({ globalBalanceCents, totalRegisteredCents, groupAllocations, allocationRows, holdingRows, purposeRows, comparisonBalanceCents }: BuildPortfolioPositionCardsContext) {
const registrationDifferenceCents = globalBalanceCents === null
    ? null
    : totalRegisteredCents - globalBalanceCents;

const allocationsByHolding = groupAllocations(allocationRows, "holdingId");

const allocationsByPurpose = groupAllocations(allocationRows, "purposeId");

const holdingsById = new Map(holdingRows.map((holding) => [holding.id, holding]));

const purposesById = new Map(purposeRows.map((purpose) => [purpose.id, purpose]));

const serializedAllocations = allocationRows.map((allocation) => ({
    ...serializeAllocation(allocation),
    holdingName: holdingsById.get(allocation.holdingId)?.name ?? "Ativo arquivado",
    purposeName: purposesById.get(allocation.purposeId)?.name ?? "Caixinha arquivada",
    purposeColor: purposesById.get(allocation.purposeId)?.color ?? "#64748b",
  }));

const holdings = holdingRows.map((holding) => {
    const allocations = (allocationsByHolding.get(holding.id) ?? []).sort(sortAllocations);
    const allocatedCents = sumAllocationAmounts(allocations);

    return {
      ...serializeHolding(holding),
      allocatedCents,
      freeValueCents: holding.currentValueCents - allocatedCents,
      allocationCount: allocations.length,
      allocations: allocations.map((allocation) => ({
        ...serializeAllocation(allocation),
        purposeName: purposesById.get(allocation.purposeId)?.name ?? "Caixinha arquivada",
        purposeColor: purposesById.get(allocation.purposeId)?.color ?? "#64748b",
      })),
    };
  });

const purposes = purposeRows.map((purpose) => {
    const allocations = (allocationsByPurpose.get(purpose.id) ?? []).sort(sortAllocations);
const allocatedCents = sumAllocationAmounts(allocations);
const relatedHoldingIds = new Set(allocations.map((allocation) => allocation.holdingId));
return {
      ...serializePurpose(purpose),
      allocatedCents,
      percentage: buildPercentage(allocatedCents, comparisonBalanceCents),
      holdingCount: relatedHoldingIds.size,
      lastAllocatedOn: allocations[0]?.allocatedOn ?? null,
      progressPercentage:
        purpose.targetAmountCents && purpose.targetAmountCents > 0
          ? Math.min((allocatedCents / purpose.targetAmountCents) * 100, 100)
          : null,
      allocations: allocations.map((allocation) => ({
        ...serializeAllocation(allocation),
        holdingName: holdingsById.get(allocation.holdingId)?.name ?? "Ativo arquivado",
      })),
    };
  });
return { registrationDifferenceCents, holdings, purposes, serializedAllocations };
}
