import {
investmentHoldings,
investmentPurposes,
investmentReductionEvents,
investmentReductionSources
} from "@/lib/db/schema";
import type {
InvestmentReductionSelection,
InvestmentReductionSourcesResult
} from "@/lib/interfaces/investment-reconciliation";
import { normalizeDate } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import { buildAvailableReductionSources } from "@/lib/server/stages/build-available-reduction-sources";
import { restoreHistoricalReductionSources } from "@/lib/server/stages/restore-historical-reduction-sources";
import { and,eq } from "drizzle-orm";
import { addPreviousSelectionToSource,getInvestmentBalance } from "./sources";
import { InvestmentReductionSourcesOptions,notRegisteredSourceId,ReconciliationDb,resolveReadDb,sourceIdForAllocation,sourceIdForHolding } from "./validation";

export async function getInvestmentReductionSources(
  database?: ReconciliationDb,
  options: InvestmentReductionSourcesOptions = {}
): Promise<InvestmentReductionSourcesResult> {
  const db = await resolveReadDb(database);
  const asOfDate = normalizeDate(options.asOfDate ?? getFinanceToday());
  const portfolio = await db.query.investmentPortfolio.findFirst();

  if (!portfolio) {
    return {
      currentBalanceCents: 0,
      checkpointDate: null,
      totalAvailableCents: 0,
      sources: [],
      previousSelections: [],
    };
  }

  const [balance, holdings, purposes, allocations, previousEvent] = await Promise.all([
    getInvestmentBalance(db, asOfDate, portfolio),
    db.query.investmentHoldings.findMany({
      where: eq(investmentHoldings.isArchived, false),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.investmentPurposes.findMany({
      where: eq(investmentPurposes.isArchived, false),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.investmentPurposeAllocations.findMany({
      orderBy: (table, { asc }) => [asc(table.allocatedOn), asc(table.createdAt)],
    }),
    options.transactionId
      ? db.query.investmentReductionEvents.findFirst({
          where: and(
            eq(investmentReductionEvents.transactionId, options.transactionId),
            eq(investmentReductionEvents.status, "active")
          ),
        })
      : Promise.resolve(undefined),
  ]);

  const previousRows = previousEvent
    ? await db.query.investmentReductionSources.findMany({
        where: eq(investmentReductionSources.eventId, previousEvent.id),
      })
    : [];
  const previousSelections = previousRows
    .map((source) => {
      if (source.sourceType === "allocation" && source.allocationId) {
        return { sourceId: sourceIdForAllocation(source.allocationId), amountCents: source.amountCents };
      }

      if (source.sourceType === "holding_free" && source.holdingId) {
        return { sourceId: sourceIdForHolding(source.holdingId), amountCents: source.amountCents };
      }

      if (source.sourceType === "not_registered") {
        return { sourceId: notRegisteredSourceId, amountCents: source.amountCents };
      }

      return null;
    })
    .filter((source): source is InvestmentReductionSelection => source !== null);

  const { sourcesById, holdingsById, purposesById } = buildAvailableReductionSources({ holdings, purposes, allocations, balance });

  for (const previousSelection of previousSelections) {
    restoreHistoricalReductionSources({ sourcesById, previousSelection, previousRows, allocations, holdingsById, purposesById });
  }

  const sources = [...sourcesById.values()]
    .map((source) => addPreviousSelectionToSource(source, previousSelections))
    .sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));

  return {
    currentBalanceCents: balance?.balanceCents ?? 0,
    checkpointDate: portfolio.checkpointDate,
    totalAvailableCents: sources.reduce((total, source) => total + source.availableCents, 0),
    sources,
    previousSelections,
  };
}
