import {
investmentReductionEvents
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { normalizeDate,serializeTimestamps } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import { buildInvestmentReductionPlan } from "@/lib/server/stages/build-investment-reduction-plan";
import { persistInvestmentReductionPlan } from "@/lib/server/stages/persist-investment-reduction-plan";
import { validateInvestmentReductionPlan } from "@/lib/server/stages/validate-investment-reduction-plan";
import { ensureSelectionsClose,ensureSourceAmounts,hasRegisteredSources } from "./selection";
import { getInvestmentReductionSources } from "./source-overview";
import { AppDbTransaction,normalizeSelection,notRegisteredSourceId,ReductionInput,reductionInputSchema,sourceIdForAllocation,sourceIdForHolding,sourceSelectionsFromInput } from "./validation";

export async function applyInvestmentReductionInTransaction(
  transaction: AppDbTransaction,
  rawInput: ReductionInput
) {
  const values = reductionInputSchema.parse(rawInput);
  const occurredOn = normalizeDate(values.occurredOn);
  const rawSelections = sourceSelectionsFromInput(values);
  const selections = rawSelections.map(normalizeSelection);
  const sourceResult = await getInvestmentReductionSources(transaction, {
    asOfDate: getFinanceToday(),
    transactionId: values.transactionId,
  });

  if (values.eventType === "withdrawal") {
    const notRegistered = sourceResult.sources.find(
      (source) => source.sourceType === "not_registered"
    );
    if (notRegistered) {
      notRegistered.availableCents += values.amountCents;
    }
  }

  if (selections.length === 0) {
    invariant(
      !hasRegisteredSources(sourceResult.sources),
      "INVESTMENT_REDUCTION_SELECTION_REQUIRED",
      "Escolha de quais ativos e caixinhas saiu esta redução."
    );
  } else {
    ensureSelectionsClose(values.amountCents, selections);
    ensureSourceAmounts(selections, sourceResult);
  }

  const { allocationReductions, holdingReductions, sourceRows } = buildInvestmentReductionPlan({ sourceResult, selections });

  const { timestamp, allocationsById, holdingsById } = await validateInvestmentReductionPlan({ transaction, allocationReductions, holdingReductions });
  const [event] = await transaction
    .insert(investmentReductionEvents)
    .values({
      type: values.eventType,
      status: "active",
      transactionId: values.transactionId ?? null,
      amountCents: values.amountCents,
      occurredOn,
      updatedAt: timestamp,
    })
    .returning();
  const { insertedSources } = await persistInvestmentReductionPlan({ event, allocationReductions, allocationsById, transaction, timestamp, holdingReductions, holdingsById, sourceRows });

  invariant(
    insertedSources.length === sourceRows.length,
    "INVESTMENT_REDUCTION_SOURCE_FAILED",
    "Não foi possível registrar todas as fontes da redução.",
    500
  );

  return {
    event: serializeTimestamps(event),
    selections: sourceRows.map((source) => ({
      sourceId:
        source.sourceType === "allocation" && source.allocationId
          ? sourceIdForAllocation(source.allocationId)
          : source.sourceType === "holding_free" && source.holdingId
            ? sourceIdForHolding(source.holdingId)
            : notRegisteredSourceId,
      amountCents: source.amountCents,
    })),
  };
}
