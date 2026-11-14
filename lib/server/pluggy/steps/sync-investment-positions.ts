import { eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { investmentOperations } from "@/lib/db/schema";
import type { PluggyAttentionItem, PluggyAttentionReason, PluggyItemRecord, PluggyItemSyncStep, PluggySyncStepContext, PluggySyncStepResult } from "@/lib/interfaces/pluggy";
import type { PluggyLocalHolding, PluggyMappedInvestment } from "@/lib/interfaces/pluggy-investments";
import { DomainError, invariant } from "@/lib/server/errors";
import { calculateInvestmentPosition } from "@/lib/server/investment-operations/position";
import { writeInvestmentSnapshots } from "@/lib/server/investment-operations/snapshots";
import { updateInvestmentHolding } from "@/lib/server/investment-portfolio";
import { sumBlockingAllocations } from "@/lib/server/investment-portfolio/validation";
import { getFinanceToday } from "@/lib/server/runtime";
import { bump } from "../bank-import/scope";
import { linkedHoldingsByAsset } from "../investments/match-holdings";
import { readRemoteInvestments } from "../investments/read-positions";
import { mapPluggyInvestment } from "../mappers/investment";

const BELOW_ALLOCATIONS = "HOLDING_VALUE_BELOW_ALLOCATIONS";

type PositionScope = {
  context: PluggySyncStepContext;
  item: PluggyItemRecord;
  counts: Record<string, number>;
  attention: PluggyAttentionItem[];
};

function flag(scope: PositionScope, reason: PluggyAttentionReason, position: PluggyMappedInvestment, amountCents: number) {
  scope.attention.push({ reason, accountLabel: scope.item.label, description: position.name, date: position.valueAsOf, amountCents });
}

async function writeBankValue(db: AppDb, holdingId: string, currentValueCents: number, valueAsOf: string) {
  const operations = await db.query.investmentOperations.findMany({ where: eq(investmentOperations.holdingId, holdingId) });
  const position = calculateInvestmentPosition(operations);
  await updateInvestmentHolding({ id: holdingId, currentValueCents, valueAsOf }, db);
  await writeInvestmentSnapshots(db, holdingId, { ...position, currentValueCents, unitPriceCents: null, valuationSource: "manual_balance", costKnown: operations.length > 0 });
}

/** A dry run skips the write that would raise this, so it checks the same rule by reading. */
async function assertCoversAllocations(db: AppDb, holdingId: string, currentValueCents: number) {
  invariant(currentValueCents >= await sumBlockingAllocations(db, holdingId), BELOW_ALLOCATIONS, "The current value cannot be lower than the holding allocations.");
}

async function applyBankValue(scope: PositionScope, holding: PluggyLocalHolding, position: PluggyMappedInvestment, valueCents: number) {
  const { context } = scope;
  try {
    if (context.dryRun) await assertCoversAllocations(context.db, holding.id, valueCents);
    await context.write((db) => writeBankValue(db, holding.id, valueCents, position.valueAsOf));
    bump(scope, "investmentsUpdated");
  } catch (error) {
    if (!(error instanceof DomainError) || error.code !== BELOW_ALLOCATIONS) throw error;
    bump(scope, "investmentsBelowAllocations");
    flag(scope, "investment_below_allocations", position, valueCents);
  }
}

/** Quoted holdings keep the market valuation, so the bank's value is only compared with it. */
function reportQuoteDifference(scope: PositionScope, holding: PluggyLocalHolding, position: PluggyMappedInvestment, valueCents: number) {
  bump(scope, "investmentsQuoted");
  const differenceCents = valueCents - holding.currentValueCents;
  if (differenceCents) flag(scope, "investment_quote_difference", position, differenceCents);
}

async function syncPosition(scope: PositionScope, position: PluggyMappedInvestment, holding: PluggyLocalHolding | undefined) {
  if (!holding) return bump(scope, "investmentsUnlinked");
  if (holding.isArchived) return bump(scope, "investmentsIgnored");
  const valueCents = position.currentValueCents;
  if (position.withdrawn) {
    bump(scope, "investmentsWithdrawn");
    flag(scope, "investment_total_withdrawal", position, valueCents ?? 0);
  }
  if (valueCents === null) {
    bump(scope, "investmentsWithoutValue");
    return flag(scope, "investment_missing_value", position, holding.currentValueCents);
  }
  if (holding.valuationMode === "market_quote") return reportQuoteDifference(scope, holding, position, valueCents);
  await applyBankValue(scope, holding, position, valueCents);
}

async function syncItemPositions(context: PluggySyncStepContext, item: PluggyItemRecord): Promise<PluggySyncStepResult> {
  const { positions, error } = await readRemoteInvestments(context.client, item);
  if (error) return { counts: { investmentItemsUnavailable: 1 } };
  if (!positions.length) return { counts: { investmentItemsEmpty: 1 } };
  const scope: PositionScope = { context, item, counts: {}, attention: [] };
  const today = getFinanceToday();
  const linked = linkedHoldingsByAsset(await context.db.query.investmentHoldings.findMany());
  for (const remote of positions) await syncPosition(scope, mapPluggyInvestment(remote, today), linked.get(remote.id));
  return { counts: scope.counts, attention: scope.attention };
}

/** The only writer of position values. Bank movements recorded by earlier steps never reduce a holding. */
export const syncInvestmentPositionsStep: PluggyItemSyncStep = {
  name: "sync-investment-positions",
  scope: "item",
  run: syncItemPositions,
};
