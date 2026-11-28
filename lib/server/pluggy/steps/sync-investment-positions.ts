import { eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { investmentHoldings, investmentOperations } from "@/lib/db/schema";
import type { PluggyAttentionItem, PluggyAttentionReason, PluggyItemRecord, PluggyItemSyncStep, PluggySyncStepContext, PluggySyncStepResult } from "@/lib/interfaces/pluggy";
import type { PluggyLocalHolding, PluggyMappedInvestment } from "@/lib/interfaces/pluggy-investments";
import { DomainError, invariant } from "@/lib/server/errors";
import { calculateInvestmentPosition } from "@/lib/server/investment-operations/position";
import { writeInvestmentSnapshots } from "@/lib/server/investment-operations/snapshots";
import { updateInvestmentHolding } from "@/lib/server/investment-portfolio";
import { sumBlockingAllocations } from "@/lib/server/investment-portfolio/validation";
import { askDestinationsForNewPosition } from "@/lib/server/investments/reserve-destinations";
import { applyReserveYield } from "@/lib/server/investments/reserve-yield";
import { yieldWithoutContributions } from "@/lib/reserve-destination";
import { getFinanceToday } from "@/lib/server/runtime";
import { bump } from "../bank-import/scope";
import { contributionsSinceCents } from "../investments/contributions-since";
import { bankPurchase, insertLinkedHolding } from "../investments/create-linked-holding";
import { linkedHoldingsByAsset, suggestHolding, uniqueMatchCodes } from "../investments/match-holdings";
import { readRemoteInvestments } from "../investments/read-positions";
import { mapPluggyInvestment } from "../mappers/investment";

const BELOW_ALLOCATIONS = "HOLDING_VALUE_BELOW_ALLOCATIONS";

type PositionScope = {
  context: PluggySyncStepContext;
  item: PluggyItemRecord;
  counts: Record<string, number>;
  attention: PluggyAttentionItem[];
  /** Growth of positions that already had a value; drops are withdrawals and are left out. */
  yieldCents: number;
  /** Whether the connection already has followed positions, and the manual holdings a new position could be. */
  newPositions: { tracked: boolean; free: PluggyLocalHolding[]; uniqueCodes: Set<string> };
  /** Value of the positions linked on their own in this run. */
  newPositionsCents: number;
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
    if (holding.currentValueCents > 0 && valueCents > holding.currentValueCents) scope.yieldCents += valueCents - holding.currentValueCents;
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

/**
 * A connection the app already follows gets its new positions on its own. The person still decides when the
 * connection is new, when the position holds nothing, or when a manual holding may be the same asset.
 */
async function linkNewPosition(scope: PositionScope, position: PluggyMappedInvestment) {
  const { tracked, free, uniqueCodes } = scope.newPositions;
  const valueCents = position.currentValueCents;
  if (!tracked || position.withdrawn || !valueCents || suggestHolding(position, free, uniqueCodes)) return bump(scope, "investmentsUnlinked");
  await scope.context.write((db) => insertLinkedHolding(db, position));
  scope.newPositionsCents += valueCents;
  bump(scope, "investmentsAutoLinked");
}

/** Kept for every followed position, quoted or without a value, so the contribution history can use them. */
async function recordBankPurchase(scope: PositionScope, holding: PluggyLocalHolding, position: PluggyMappedInvestment) {
  if (holding.principalCents === position.principalCents && holding.purchasedOn === position.purchasedOn) return;
  await scope.context.write((db) => db.update(investmentHoldings).set(bankPurchase(position)).where(eq(investmentHoldings.id, holding.id)));
}

async function syncPosition(scope: PositionScope, position: PluggyMappedInvestment, holding: PluggyLocalHolding | undefined) {
  if (!holding) return linkNewPosition(scope, position);
  if (holding.isArchived) return bump(scope, "investmentsIgnored");
  await recordBankPurchase(scope, holding, position);
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
  const today = getFinanceToday();
  const holdings = await context.db.query.investmentHoldings.findMany();
  const totalBeforeCents = holdings.reduce((total, holding) => total + (holding.isArchived ? 0 : holding.currentValueCents), 0);
  const linked = linkedHoldingsByAsset(holdings);
  const mapped = positions.map((remote) => ({ position: mapPluggyInvestment(remote, today), holding: linked.get(remote.id) }));
  const followed = mapped.flatMap(({ holding }) => holding && !holding.isArchived ? [holding] : []);
  const newPositions = { tracked: followed.length > 0, free: holdings.filter((holding) => !holding.isArchived && !holding.externalAssetId), uniqueCodes: uniqueMatchCodes(mapped.map(({ position }) => position)) };
  const scope: PositionScope = { context, item, counts: {}, attention: [], yieldCents: 0, newPositions, newPositionsCents: 0 };
  const valuedSince = followed.filter((holding) => holding.currentValueCents > 0).map((holding) => holding.valueAsOf).sort()[0] ?? null;
  for (const { position, holding } of mapped) await syncPosition(scope, position, holding);
  if (scope.newPositionsCents) await context.write((db) => askDestinationsForNewPosition(db, item.id));
  // A contribution into an existing position grows it like yield, and its destination already moved the reserve.
  const contributionsCents = valuedSince ? await contributionsSinceCents(context.db, item.id, valuedSince) : 0;
  const yieldCents = yieldWithoutContributions(scope.yieldCents, contributionsCents, scope.newPositionsCents);
  // The difference is taken over the stored values, so a second sync on the same day adds nothing.
  if (yieldCents > 0) await context.write((db) => applyReserveYield(db, yieldCents, totalBeforeCents));
  return { counts: scope.counts, attention: scope.attention };
}

/** The only writer of position values. Bank movements recorded by earlier steps never reduce a holding. */
export const syncInvestmentPositionsStep: PluggyItemSyncStep = {
  name: "sync-investment-positions",
  scope: "item",
  run: syncItemPositions,
};
