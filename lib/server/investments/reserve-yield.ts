import { reserveYieldShare } from "@/lib/reserve-withdrawal";
import { writeReserveAmount } from "./reserve-withdrawals";
import type { InvestmentDb } from "./validation";

/**
 * Gives the reserve its share of the yield the bank reported for positions that already existed.
 * New positions are contributions and lower values are withdrawals, so neither reaches this.
 * A contribution into an existing position would count as yield: banks that add to a position are not told apart.
 */
export async function applyReserveYield(db: InvestmentDb, yieldCents: number, totalBeforeCents: number) {
  const portfolio = await db.query.investmentPortfolio.findFirst();
  const reserveCents = portfolio?.reserveAmountCents ?? null;
  if (!portfolio || reserveCents === null) return 0;
  const shareCents = reserveYieldShare(yieldCents, reserveCents, totalBeforeCents);
  if (shareCents) await writeReserveAmount(db, portfolio, reserveCents + shareCents);
  return shareCents;
}
