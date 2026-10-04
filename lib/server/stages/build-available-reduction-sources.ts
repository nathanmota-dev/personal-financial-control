import type {
InvestmentReductionSource
} from "@/lib/interfaces/investment-reconciliation";
import type { BuildAvailableReductionSourcesContext } from "@/lib/interfaces/stages/build-available-reduction-sources";
import { buildAllocationSource,buildHoldingFreeSource,buildNotRegisteredSource } from "@/lib/server/investment-reconciliation/sources";
import { notRegisteredSourceId } from "@/lib/server/investment-reconciliation/validation";

export function buildAvailableReductionSources({ holdings, purposes, allocations, balance }: BuildAvailableReductionSourcesContext) {
const holdingsById = new Map(holdings.map((holding) => [holding.id, holding]));

const purposesById = new Map(purposes.map((purpose) => [purpose.id, purpose]));

const reservePurposeIds = new Set(
    purposes.filter((purpose) => purpose.kind === "emergency_reserve").map((purpose) => purpose.id)
  );

const reserveHoldingIds = new Set(
    allocations
      .filter((allocation) => reservePurposeIds.has(allocation.purposeId))
      .map((allocation) => allocation.holdingId)
  );

const allocatedByHolding = new Map<string, number>();

const sourcesById = new Map<string, InvestmentReductionSource>();

for (const allocation of allocations) {
    const holding = holdingsById.get(allocation.holdingId);
    const purpose = purposesById.get(allocation.purposeId);

    if (!holding || !purpose) {
      continue;
    }

    if (reservePurposeIds.size > 0 && !reservePurposeIds.has(purpose.id)) continue;

    allocatedByHolding.set(
      holding.id,
      (allocatedByHolding.get(holding.id) ?? 0) + allocation.amountCents
    );

    if (allocation.amountCents > 0) {
      const source = buildAllocationSource(allocation, holding, purpose, allocation.amountCents);
      sourcesById.set(source.id, source);
    }
  }

for (const holding of holdings) {
    if (reservePurposeIds.size > 0 && !reserveHoldingIds.has(holding.id)) continue;
    const freeCents = Math.max(
      holding.currentValueCents - (allocatedByHolding.get(holding.id) ?? 0),
      0
    );

    if (freeCents > 0) {
      const source = buildHoldingFreeSource(holding, freeCents);
      sourcesById.set(source.id, source);
    }
  }

const totalRegisteredCents = holdings.filter((holding) => reservePurposeIds.size === 0 || reserveHoldingIds.has(holding.id)).reduce(
    (total, holding) => total + holding.currentValueCents,
    0
  );

const notRegisteredCents = Math.max(
    (balance?.balanceCents ?? 0) - totalRegisteredCents,
    0
  );

if (notRegisteredCents > 0) {
    sourcesById.set(notRegisteredSourceId, buildNotRegisteredSource(notRegisteredCents));
  }
return { sourcesById, holdingsById, purposesById };
}
