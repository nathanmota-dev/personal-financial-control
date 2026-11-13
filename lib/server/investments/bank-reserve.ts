import type { AppDb } from "@/lib/db";
import { investmentHoldings, investmentPortfolio, investmentPositionSnapshots } from "@/lib/db/schema";
import { calculateRealizedYield, splitBankReserve } from "@/lib/bank-reserve";
import type { BankReserveSplit, SetBankReserveInput } from "@/lib/interfaces/bank-reserve";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { InvestmentDb, resolveDb, resolveReadDb } from "./validation";

type HoldingRow = typeof investmentHoldings.$inferSelect;
type PortfolioRow = typeof investmentPortfolio.$inferSelect;

const bankReserveSchema = z.object({ reserveAmountCents: z.number().int().nonnegative() });

/** Bank mode starts once any active position is linked to Open Finance: the reserve then comes from the positions. */
export function isBankReserveMode(holdings: Pick<HoldingRow, "externalAssetId" | "isArchived">[]) {
  return holdings.some((holding) => !holding.isArchived && Boolean(holding.externalAssetId));
}

async function readRealizedYield(db: InvestmentDb, holdings: HoldingRow[], asOfDate: string) {
  const tracked = holdings.filter((holding) => holding.valuationMode !== "market_quote");
  if (!tracked.length) return null;
  const snapshots = await db.query.investmentPositionSnapshots.findMany({ where: inArray(investmentPositionSnapshots.holdingId, tracked.map((holding) => holding.id)) });
  return calculateRealizedYield({ holdings: tracked, snapshots, asOfDate });
}

/** Builds the split from rows the caller already read, so overview queries do not read the holdings twice. */
export async function buildBankReserveSplit(db: InvestmentDb, holdings: HoldingRow[], portfolio: PortfolioRow | undefined, asOfDate = getFinanceToday()): Promise<BankReserveSplit | null> {
  const active = holdings.filter((holding) => !holding.isArchived);
  if (!isBankReserveMode(active)) return null;
  const totalCents = active.reduce((total, holding) => total + holding.currentValueCents, 0);
  const configuredReserveCents = portfolio?.reserveAmountCents ?? null;
  const split = splitBankReserve(totalCents, configuredReserveCents);
  const valueAsOf = active.filter((holding) => holding.externalAssetId).map((holding) => holding.valueAsOf).sort().at(-1) ?? asOfDate;
  const rate = await readRealizedYield(db, active, asOfDate);
  return {
    totalCents,
    configuredReserveCents,
    ...split,
    valueAsOf,
    realizedYield: rate ? { ...rate, reserveMonthlyYieldCents: Math.round((split.reserveCents * rate.monthlyRateBps) / 10_000) } : null,
  };
}

export async function getBankReserveSplit(database?: InvestmentDb) {
  const db = await resolveReadDb(database);
  const [holdings, portfolio] = await Promise.all([
    db.query.investmentHoldings.findMany({ where: eq(investmentHoldings.isArchived, false) }),
    db.query.investmentPortfolio.findFirst(),
  ]);
  return buildBankReserveSplit(db, holdings, portfolio);
}

/** The only writer of the split. The portfolio is never stored: it is always the total minus this amount. */
export async function setBankReserveAmount(input: SetBankReserveInput, database?: AppDb) {
  const db = await resolveDb(database);
  const { reserveAmountCents } = bankReserveSchema.parse(input);
  return db.transaction(async (transaction) => {
    const split = await getBankReserveSplit(transaction);
    invariant(split, "BANK_RESERVE_REQUIRES_LINKED_POSITION", "Vincule uma posição do Open Finance antes de definir a reserva.");
    invariant(reserveAmountCents <= split.totalCents, "BANK_RESERVE_ABOVE_TOTAL", "A reserva não pode passar do total investido.");
    const existing = await transaction.query.investmentPortfolio.findFirst();
    const updatedAt = currentTimestamp();
    if (existing) {
      await transaction.update(investmentPortfolio).set({ reserveAmountCents, updatedAt }).where(eq(investmentPortfolio.id, existing.id));
    } else {
      await transaction.insert(investmentPortfolio).values({ checkpointBalanceCents: 0, expectedMonthlyRateBps: 0, checkpointDate: getFinanceToday(), reserveAmountCents, updatedAt });
    }
    return { ...split, configuredReserveCents: reserveAmountCents, ...splitBankReserve(split.totalCents, reserveAmountCents) };
  });
}
