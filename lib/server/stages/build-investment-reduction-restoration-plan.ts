import type { BuildInvestmentReductionRestorationPlanContext } from "@/lib/interfaces/stages/build-investment-reduction-restoration-plan";
import { invariant } from "@/lib/server/errors";

export function buildInvestmentReductionRestorationPlan({ sources }: BuildInvestmentReductionRestorationPlanContext) {
const allocationRestores = new Map<string, number>();

const holdingRestores = new Map<string, number>();

for (const source of sources) {
    if (source.sourceType === "allocation") {
      invariant(
        source.allocationId && source.holdingId,
        "INVESTMENT_REDUCTION_SOURCE_MISSING",
        "A origem de uma redução não está mais disponível para reversão."
      );
      allocationRestores.set(
        source.allocationId,
        (allocationRestores.get(source.allocationId) ?? 0) + source.amountCents
      );
      holdingRestores.set(
        source.holdingId,
        (holdingRestores.get(source.holdingId) ?? 0) + source.amountCents
      );
    }

    if (source.sourceType === "holding_free") {
      invariant(
        source.holdingId,
        "INVESTMENT_REDUCTION_SOURCE_MISSING",
        "A origem de uma redução não está mais disponível para reversão."
      );
      holdingRestores.set(
        source.holdingId,
        (holdingRestores.get(source.holdingId) ?? 0) + source.amountCents
      );
    }
  }
return { allocationRestores, holdingRestores };
}
