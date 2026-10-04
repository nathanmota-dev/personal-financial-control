import type { BuildInvestmentReductionPlanContext } from "@/lib/interfaces/stages/build-investment-reduction-plan";
import { invariant } from "@/lib/server/errors";
import { selectionSourceType,sourceMap } from "@/lib/server/investment-reconciliation/selection";

export function buildInvestmentReductionPlan({ sourceResult, selections }: BuildInvestmentReductionPlanContext) {
const sourcesById = sourceMap(sourceResult);

const allocationReductions = new Map<string, number>();

const holdingReductions = new Map<string, number>();

const sourceRows: Array<{
    sourceType: "allocation" | "holding_free" | "not_registered";
    holdingId: string | null;
    purposeId: string | null;
    allocationId: string | null;
    amountCents: number;
  }> = [];

for (const selection of selections) {
    const source = sourcesById.get(selection.sourceId);
    invariant(source, "INVESTMENT_REDUCTION_SOURCE_NOT_FOUND", "Investment reduction source not found.");
    const sourceType = selectionSourceType(selection, source);

    invariant(
      sourceType === source.sourceType,
      "INVESTMENT_REDUCTION_SOURCE_MISMATCH",
      "A fonte selecionada não corresponde ao tipo esperado."
    );

    if (sourceType === "allocation") {
      invariant(source.allocationId && source.holdingId, "INVESTMENT_REDUCTION_SOURCE_NOT_FOUND", "A alocação selecionada não existe mais.");
      allocationReductions.set(
        source.allocationId,
        (allocationReductions.get(source.allocationId) ?? 0) + selection.amountCents
      );
      holdingReductions.set(
        source.holdingId,
        (holdingReductions.get(source.holdingId) ?? 0) + selection.amountCents
      );
      sourceRows.push({
        sourceType,
        holdingId: source.holdingId,
        purposeId: source.purposeId,
        allocationId: source.allocationId,
        amountCents: selection.amountCents,
      });
      continue;
    }

    if (sourceType === "holding_free") {
      invariant(source.holdingId, "INVESTMENT_REDUCTION_SOURCE_NOT_FOUND", "O ativo selecionado não existe mais.");
holdingReductions.set(
        source.holdingId,
        (holdingReductions.get(source.holdingId) ?? 0) + selection.amountCents
      );
sourceRows.push({
        sourceType,
        holdingId: source.holdingId,
        purposeId: null,
        allocationId: null,
        amountCents: selection.amountCents,
      });
continue;
    }

    sourceRows.push({
      sourceType: "not_registered",
      holdingId: null,
      purposeId: null,
      allocationId: null,
      amountCents: selection.amountCents,
    });
  }
return { allocationReductions, holdingReductions, sourceRows };
}
