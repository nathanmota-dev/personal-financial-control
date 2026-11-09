import type { PluggyItemSyncStep, PluggySyncStepContext, PluggySyncStepResult } from "@/lib/interfaces/pluggy";
import { configureInvestmentPortfolio } from "@/lib/server/investments/portfolio";
import { getFinanceToday } from "@/lib/server/runtime";

const aligned = new WeakSet<PluggySyncStepContext>();

async function alignCheckpoint(context: PluggySyncStepContext): Promise<PluggySyncStepResult> {
  if (aligned.has(context)) return;
  aligned.add(context);
  const { db } = context;
  const [portfolio, purposes, holdings, allocations] = await Promise.all([db.query.investmentPortfolio.findFirst(), db.query.investmentPurposes.findMany(), db.query.investmentHoldings.findMany(), db.query.investmentPurposeAllocations.findMany()]);
  const reserve = purposes.find((purpose) => purpose.kind === "emergency_reserve" && !purpose.isArchived);
  if (!portfolio || !reserve) return;
  const linked = new Set(holdings.filter((holding) => holding.externalAssetId && !holding.isArchived).map((holding) => holding.id));
  const rows = allocations.filter((allocation) => allocation.purposeId === reserve.id);
  if (!rows.some((allocation) => linked.has(allocation.holdingId))) return;
  const checkpointBalanceCents = rows.reduce((total, allocation) => total + allocation.amountCents, 0);
  const checkpointDate = getFinanceToday();
  if (portfolio.checkpointBalanceCents === checkpointBalanceCents && portfolio.checkpointDate === checkpointDate) return;
  await context.write((database) => configureInvestmentPortfolio({ checkpointBalanceCents, expectedMonthlyRateBps: portfolio.expectedMonthlyRateBps, checkpointDate }, database));
  return { counts: { reserveCheckpointUpdated: 1 } };
}

/** The reserve screen estimates from a checkpoint. Once a linked position backs the reserve, the bank's value is that checkpoint. */
export const alignReserveCheckpointStep: PluggyItemSyncStep = {
  name: "align-reserve-checkpoint",
  scope: "item",
  run: alignCheckpoint,
};
