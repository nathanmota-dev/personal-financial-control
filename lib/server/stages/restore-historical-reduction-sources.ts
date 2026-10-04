import type { RestoreHistoricalReductionSourcesContext } from "@/lib/interfaces/stages/restore-historical-reduction-sources";
import { buildAllocationSource,buildHoldingFreeSource,buildNotRegisteredSource } from "@/lib/server/investment-reconciliation/sources";
import { notRegisteredSourceId,sourceIdForAllocation,sourceIdForHolding } from "@/lib/server/investment-reconciliation/validation";

export function restoreHistoricalReductionSources({ sourcesById, previousSelection, previousRows, allocations, holdingsById, purposesById }: RestoreHistoricalReductionSourcesContext) {
if (!sourcesById.has(previousSelection.sourceId)) {
      const historicalSource = previousRows.find((source) => {
        if (source.sourceType === "allocation" && source.allocationId) {
          return sourceIdForAllocation(source.allocationId) === previousSelection.sourceId;
        }
        if (source.sourceType === "holding_free" && source.holdingId) {
          return sourceIdForHolding(source.holdingId) === previousSelection.sourceId;
        }
        return source.sourceType === "not_registered";
      });

      if (historicalSource?.sourceType === "allocation" && historicalSource.allocationId) {
        const allocation = allocations.find((item) => item.id === historicalSource.allocationId);
        const holding = allocation ? holdingsById.get(allocation.holdingId) : undefined;
        const purpose = allocation ? purposesById.get(allocation.purposeId) : undefined;

        if (allocation && holding && purpose) {
          sourcesById.set(
            previousSelection.sourceId,
            buildAllocationSource(allocation, holding, purpose, 0)
          );
        }
      }

      if (historicalSource?.sourceType === "holding_free" && historicalSource.holdingId) {
        const holding = holdingsById.get(historicalSource.holdingId);

        if (holding) {
          sourcesById.set(previousSelection.sourceId, buildHoldingFreeSource(holding, 0));
        }
      }

      if (historicalSource?.sourceType === "not_registered") {
        sourcesById.set(notRegisteredSourceId, buildNotRegisteredSource(0));
      }
    }

}
