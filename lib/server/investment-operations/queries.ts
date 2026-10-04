import {
fixedIncomeTerms,
investmentAssetClasses,
investmentHoldings,
investmentOperations,
investmentPortfolioSnapshots,
investmentPositionSnapshots,
investmentPurposeAllocations,
investmentPurposes,
investmentQuotes
} from "@/lib/db/schema";
import { getServerEnv } from "@/lib/env";
import type { InvestmentQuoteRefreshResult,MarketDataProvider } from "@/lib/interfaces/market-data";
import { BrapiMarketDataProvider } from "@/lib/server/brapi";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp,serializeTimestamps } from "@/lib/server/finance";
import { getInvestmentProjection } from "@/lib/server/investments";
import { getFinanceToday } from "@/lib/server/runtime";
import { and,asc,desc,eq } from "drizzle-orm";
import { calculateInvestmentPosition,recalculateHolding } from "./position";
import { Db,dbOrDefault } from "./validation";

export async function listLongTermInvestmentPositions(database?: Db) {
  const db = await dbOrDefault(database);
  const [holdings, reserve] = await Promise.all([
    db.query.investmentHoldings.findMany({ where: eq(investmentHoldings.isArchived, false), orderBy: [asc(investmentHoldings.name)] }),
    db.query.investmentPurposes.findFirst({ where: and(eq(investmentPurposes.kind, "emergency_reserve"), eq(investmentPurposes.isArchived, false)) }),
  ]);
  const reserveAllocations = reserve ? await db.query.investmentPurposeAllocations.findMany({ where: eq(investmentPurposeAllocations.purposeId, reserve.id) }) : [];
  const reserveHoldingIds = new Set(reserveAllocations.map((item) => item.holdingId));
  const positions = await Promise.all(holdings.filter((holding) => !reserveHoldingIds.has(holding.id)).map(async (holding) => {
    const operations = await db.query.investmentOperations.findMany({ where: eq(investmentOperations.holdingId, holding.id), orderBy: [asc(investmentOperations.operatedOn), asc(investmentOperations.createdAt)] });
    const position = operations.length ? calculateInvestmentPosition(operations) : null;
    const latestQuote = await db.query.investmentQuotes.findFirst({ where: eq(investmentQuotes.holdingId, holding.id), orderBy: [desc(investmentQuotes.quotedOn), desc(investmentQuotes.createdAt)] });
    return { ...serializeTimestamps(holding), position, resultCents: position ? holding.currentValueCents - position.costCents : null,
      participationPercentage: 0, latestQuote: latestQuote ? serializeTimestamps(latestQuote) : null };
  }));
  const totalCents = positions.reduce((total, position) => total + position.currentValueCents, 0);
  return positions.map((position) => ({ ...position, participationPercentage: totalCents ? position.currentValueCents / totalCents * 100 : 0 }));
}

export async function getInvestmentAssetDetails(id: string, database?: Db) {
  const db = await dbOrDefault(database);
  const holding = await db.query.investmentHoldings.findFirst({ where: and(eq(investmentHoldings.id, id), eq(investmentHoldings.isArchived, false)) });
  if (!holding) return null;
  const [operations, quotes, terms, snapshots] = await Promise.all([
    db.query.investmentOperations.findMany({ where: eq(investmentOperations.holdingId, id), orderBy: [desc(investmentOperations.operatedOn), desc(investmentOperations.createdAt)] }),
    db.query.investmentQuotes.findMany({ where: eq(investmentQuotes.holdingId, id), orderBy: [desc(investmentQuotes.quotedOn)] }),
    db.query.fixedIncomeTerms.findFirst({ where: eq(fixedIncomeTerms.holdingId, id) }),
    db.query.investmentPositionSnapshots.findMany({ where: eq(investmentPositionSnapshots.holdingId, id), orderBy: [asc(investmentPositionSnapshots.snapshotDate)] }),
  ]);
  const position = operations.length ? calculateInvestmentPosition(operations) : null;
  return { ...serializeTimestamps(holding), position, operations: operations.map(serializeTimestamps), quotes: quotes.map(serializeTimestamps), terms: terms ? serializeTimestamps(terms) : null, snapshots: snapshots.map(serializeTimestamps), resultCents: position ? holding.currentValueCents - position.costCents : null };
}

export async function getInvestmentOverview(database?: Db) {
  const db = await dbOrDefault(database);
  const [positions, reservePurpose, projection, history] = await Promise.all([
    listLongTermInvestmentPositions(db),
    db.query.investmentPurposes.findFirst({ where: and(eq(investmentPurposes.kind, "emergency_reserve"), eq(investmentPurposes.isArchived, false)) }),
    getInvestmentProjection(db),
    db.query.investmentPortfolioSnapshots.findMany({ orderBy: [asc(investmentPortfolioSnapshots.snapshotDate)] }),
  ]);
  const reserveCents = projection?.currentBalanceCents ?? 0;
  const portfolioCents = positions.reduce((total, row) => total + row.currentValueCents, 0);
  const knownCostCents = positions.reduce((total, row) => total + (row.position?.costCents ?? 0), 0);
  const knownValueCents = positions.reduce((total, row) => total + (row.position ? row.currentValueCents : 0), 0);
  const distribution = investmentAssetClasses.map((assetClass) => ({ assetClass, amountCents: positions.filter((row) => row.assetClass === assetClass).reduce((sum, row) => sum + row.currentValueCents, 0) })).filter((item) => item.amountCents > 0);
  return { totalCents: reserveCents + portfolioCents, reserve: { amountCents: reserveCents, purposeId: reservePurpose?.id ?? null, configured: Boolean(projection) }, portfolioCents, knownCostCents, resultCents: knownValueCents - knownCostCents, distribution, history: history.map(serializeTimestamps), lastUpdatedAt: positions.map((row) => row.updatedAt).sort().at(-1) ?? null };
}

export async function getEmergencyReserveComposition(database?: Db) {
  const db = await dbOrDefault(database);
  const [purpose, projection] = await Promise.all([
    db.query.investmentPurposes.findFirst({ where: and(eq(investmentPurposes.kind, "emergency_reserve"), eq(investmentPurposes.isArchived, false)) }),
    getInvestmentProjection(db),
  ]);
  if (!purpose) return { officialBalanceCents: projection?.currentBalanceCents ?? 0, registeredCents: 0, differenceCents: projection?.currentBalanceCents ?? 0, holdings: [] };
  const allocations = await db.query.investmentPurposeAllocations.findMany({ where: eq(investmentPurposeAllocations.purposeId, purpose.id) });
  const holdings = await Promise.all(allocations.map(async (allocation) => {
    const holding = await db.query.investmentHoldings.findFirst({ where: eq(investmentHoldings.id, allocation.holdingId) });
    return holding ? { id: holding.id, name: holding.name, institutionName: holding.institutionName, amountCents: allocation.amountCents, valueAsOf: holding.valueAsOf } : null;
  }));
  const activeHoldings = holdings.filter((holding): holding is NonNullable<typeof holding> => holding !== null);
  const registeredCents = activeHoldings.reduce((total, holding) => total + holding.amountCents, 0);
  const officialBalanceCents = projection?.currentBalanceCents ?? 0;
  return { officialBalanceCents, registeredCents, differenceCents: officialBalanceCents - registeredCents, holdings: activeHoldings };
}

export async function refreshInvestmentQuotes(options: { provider?: MarketDataProvider; now?: Date; cooldownMinutes?: number } = {}, database?: Db): Promise<InvestmentQuoteRefreshResult> {
  const db = await dbOrDefault(database);
  const env = getServerEnv();
  const provider = options.provider ?? (env.BRAPI_API_TOKEN ? new BrapiMarketDataProvider(env.BRAPI_API_TOKEN) : null);
  invariant(provider, "MARKET_DATA_NOT_CONFIGURED", "Configure BRAPI_API_TOKEN para habilitar a atualização automática.");
  const now = options.now ?? new Date();
  const cooldown = options.cooldownMinutes ?? env.INVESTMENT_QUOTE_MIN_INTERVAL_MINUTES;
  const holdings = await db.query.investmentHoldings.findMany({ where: and(eq(investmentHoldings.valuationMode, "market_quote"), eq(investmentHoldings.isArchived, false)), orderBy: [asc(investmentHoldings.name)] });
  const items: InvestmentQuoteRefreshResult["items"] = [];
  for (const holding of holdings) {
    const symbol = holding.quoteSymbol ?? holding.ticker;
    if (!symbol) { items.push({ holdingId: holding.id, symbol: "—", status: "failed", message: "Ticker não configurado." }); continue; }
    const latest = await db.query.investmentQuotes.findFirst({ where: eq(investmentQuotes.holdingId, holding.id), orderBy: [desc(investmentQuotes.fetchedAt), desc(investmentQuotes.createdAt)] });
    if (latest?.fetchedAt && now.getTime() - latest.fetchedAt.getTime() < cooldown * 60_000) {
      items.push({ holdingId: holding.id, symbol, status: "cooldown" }); continue;
    }
    try {
      const quote = await provider.getQuote(symbol);
      const quotedOn = quote.quotedAt.toISOString().slice(0, 10);
      await db.insert(investmentQuotes).values({ holdingId: holding.id, quotedOn, unitPriceCents: quote.unitPriceCents, source: provider.name, provider: provider.name, symbol: quote.symbol, currency: quote.currency, quotedAt: quote.quotedAt, fetchedAt: now, marketState: quote.marketState, isStale: false })
        .onConflictDoUpdate({ target: [investmentQuotes.holdingId, investmentQuotes.quotedOn], set: { unitPriceCents: quote.unitPriceCents, source: provider.name, provider: provider.name, symbol: quote.symbol, currency: quote.currency, quotedAt: quote.quotedAt, fetchedAt: now, marketState: quote.marketState, isStale: false, updatedAt: currentTimestamp() } });
      await recalculateHolding(db, holding.id);
      items.push({ holdingId: holding.id, symbol, status: "updated" });
    } catch (error) {
      if (latest) await db.update(investmentQuotes).set({ isStale: true, updatedAt: currentTimestamp() }).where(eq(investmentQuotes.id, latest.id));
      items.push({ holdingId: holding.id, symbol, status: "failed", message: error instanceof Error ? error.message : "Falha desconhecida." });
    }
  }
  return { updated: items.filter((item) => item.status === "updated").length, skippedByCooldown: items.filter((item) => item.status === "cooldown").length, failed: items.filter((item) => item.status === "failed").length, refreshedAt: now.toISOString(), snapshotDate: items.some((item) => item.status === "updated") ? getFinanceToday() : null, items };
}
