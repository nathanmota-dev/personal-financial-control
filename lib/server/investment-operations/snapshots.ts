import {
investmentHoldings,
investmentOperations,
investmentPortfolioSnapshots,
investmentPositionSnapshots,
investmentPurposeAllocations,
investmentPurposes
} from "@/lib/db/schema";
import { currentTimestamp } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import { and,eq } from "drizzle-orm";
import { calculateInvestmentPosition } from "./position";
import { Db } from "./validation";

export async function writeInvestmentSnapshots(db: Db, holdingId: string, position: {
  quantityUnits: number; costCents: number; currentValueCents: number; unitPriceCents: number | null;
  valuationSource: "market_quote" | "manual_balance"; costKnown: boolean;
}) {
  const snapshotDate = getFinanceToday();
  const timestamp = currentTimestamp();
  await db.insert(investmentPositionSnapshots).values({
    holdingId, snapshotDate, quantityUnits: position.quantityUnits,
    costCents: position.costKnown ? position.costCents : null,
    currentValueCents: position.currentValueCents, unitPriceCents: position.unitPriceCents,
    valuationSource: position.valuationSource,
  }).onConflictDoUpdate({
    target: [investmentPositionSnapshots.holdingId, investmentPositionSnapshots.snapshotDate],
    set: { quantityUnits: position.quantityUnits, costCents: position.costKnown ? position.costCents : null,
      currentValueCents: position.currentValueCents, unitPriceCents: position.unitPriceCents,
      valuationSource: position.valuationSource, updatedAt: timestamp },
  });

  const holdings = await db.query.investmentHoldings.findMany({ where: eq(investmentHoldings.isArchived, false) });
  const reserve = await db.query.investmentPurposes.findFirst({ where: and(eq(investmentPurposes.kind, "emergency_reserve"), eq(investmentPurposes.isArchived, false)) });
  const reserveRows = reserve ? await db.query.investmentPurposeAllocations.findMany({ where: eq(investmentPurposeAllocations.purposeId, reserve.id) }) : [];
  const reserveIds = new Set(reserveRows.map((row) => row.holdingId));
  let knownCostCents = 0, knownValueCents = 0, totalValueCents = 0;
  for (const item of holdings.filter((row) => !reserveIds.has(row.id))) {
    const operations = await db.query.investmentOperations.findMany({ where: eq(investmentOperations.holdingId, item.id) });
    totalValueCents += item.id === holdingId ? position.currentValueCents : item.currentValueCents;
    if (operations.length) {
      knownCostCents += item.id === holdingId ? position.costCents : calculateInvestmentPosition(operations).costCents;
      knownValueCents += item.id === holdingId ? position.currentValueCents : item.currentValueCents;
    }
  }
  await db.insert(investmentPortfolioSnapshots).values({ snapshotDate, knownCostCents, knownValueCents, totalValueCents, unrealizedResultCents: knownValueCents - knownCostCents })
    .onConflictDoUpdate({ target: investmentPortfolioSnapshots.snapshotDate, set: { knownCostCents, knownValueCents, totalValueCents, unrealizedResultCents: knownValueCents - knownCostCents, updatedAt: timestamp } });
}
