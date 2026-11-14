import { investmentHoldings, investmentPortfolio, investmentPositionSnapshots, transactions } from "@/lib/db/schema";
import type { ClassifyReserveWithdrawalInput, PendingReserveWithdrawal, TrackedWithdrawal } from "@/lib/interfaces/reserve-withdrawal";
import { classifyReserveWithdrawal, reserveAfterWithdrawal } from "@/lib/reserve-withdrawal";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp } from "@/lib/server/finance";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { isBankReserveMode } from "./bank-reserve";
import { InvestmentDb, resolveDb, resolveReadDb } from "./validation";
import type { AppDb } from "@/lib/db";

type PortfolioRow = typeof investmentPortfolio.$inferSelect;

const classifySchema = z.object({ transactionId: z.string().uuid(), origin: z.enum(["reserve", "portfolio"]) });

/** The date the reserve amount was set. Rows from before the column existed fall back to their last update. */
export function reserveConfiguredOn(portfolio: PortfolioRow) {
  return portfolio.reserveConfiguredOn ?? portfolio.updatedAt.toISOString().slice(0, 10);
}

/** The only writer of reserve changes that do not come from the user, so the date it was set is kept. */
export async function writeReserveAmount(db: InvestmentDb, portfolio: PortfolioRow, reserveAmountCents: number) {
  await db.update(investmentPortfolio)
    .set({ reserveAmountCents, reserveConfiguredOn: reserveConfiguredOn(portfolio), updatedAt: currentTimestamp() })
    .where(eq(investmentPortfolio.id, portfolio.id));
}

/**
 * Invested total as the bank reported it before `date`: each position's last snapshot taken earlier,
 * or its current value when it has none. A position the bank already lowered still counts its old value.
 */
async function readTotalBefore(db: InvestmentDb, date: string) {
  const holdings = await db.query.investmentHoldings.findMany({ where: eq(investmentHoldings.isArchived, false) });
  if (!isBankReserveMode(holdings)) return null;
  const snapshots = holdings.length
    ? await db.query.investmentPositionSnapshots.findMany({ where: inArray(investmentPositionSnapshots.holdingId, holdings.map((holding) => holding.id)) })
    : [];
  return holdings.reduce((total, holding) => {
    const before = snapshots
      .filter((snapshot) => snapshot.holdingId === holding.id && snapshot.snapshotDate < date)
      .sort((left, right) => left.snapshotDate.localeCompare(right.snapshotDate))
      .at(-1);
    return total + (before ? before.currentValueCents : holding.currentValueCents);
  }, 0);
}

/**
 * Attributes a withdrawal the bank import recorded. It only touches the investment side:
 * the transaction keeps its account, type and amount, so the account balance is unchanged.
 */
export async function applyReserveWithdrawal(db: InvestmentDb, withdrawal: TrackedWithdrawal) {
  const totalCents = await readTotalBefore(db, withdrawal.transactionDate);
  if (totalCents === null) return null;
  const portfolio = await db.query.investmentPortfolio.findFirst();
  const configured = portfolio?.reserveAmountCents ?? null;
  // Before the reserve was set, its amount already accounts for this withdrawal.
  if (portfolio && configured !== null && withdrawal.transactionDate < reserveConfiguredOn(portfolio)) return null;
  // The amount set is not capped by the total here: a total the bank already lowered below it still means the portfolio is empty.
  const reserveCents = Math.max(configured ?? 0, 0);
  const origin = classifyReserveWithdrawal({ reserveCents, portfolioCents: Math.max(totalCents - reserveCents, 0) });
  await db.update(transactions).set({ investmentOrigin: origin, updatedAt: currentTimestamp() }).where(eq(transactions.id, withdrawal.id));
  if (origin === "reserve" && portfolio && configured !== null) {
    await writeReserveAmount(db, portfolio, reserveAfterWithdrawal(configured, withdrawal.amountCents));
  }
  return origin;
}

/** A pending withdrawal is classified once. Choosing the reserve lowers it, unless it was set after the withdrawal. */
export async function classifyPendingReserveWithdrawal(input: ClassifyReserveWithdrawalInput, database?: AppDb) {
  const db = await resolveDb(database);
  const { transactionId, origin } = classifySchema.parse(input);
  return db.transaction(async (tx) => {
    const row = await tx.query.transactions.findFirst({ where: eq(transactions.id, transactionId) });
    invariant(row, "TRANSACTION_NOT_FOUND", "Retirada não encontrada.", 404);
    invariant(row.type === "investment_withdrawal" && row.investmentOrigin === "pending", "WITHDRAWAL_NOT_PENDING", "Esta retirada já foi classificada.");
    await tx.update(transactions).set({ investmentOrigin: origin, updatedAt: currentTimestamp() }).where(eq(transactions.id, row.id));
    const portfolio = await tx.query.investmentPortfolio.findFirst();
    const configured = portfolio?.reserveAmountCents ?? null;
    if (origin === "reserve" && portfolio && configured !== null && row.transactionDate >= reserveConfiguredOn(portfolio)) {
      await writeReserveAmount(tx, portfolio, reserveAfterWithdrawal(configured, row.amountCents));
    }
    return { id: row.id, origin };
  });
}

export async function listPendingReserveWithdrawals(database?: InvestmentDb): Promise<PendingReserveWithdrawal[]> {
  const db = await resolveReadDb(database);
  const rows = await db.query.transactions.findMany({
    where: and(eq(transactions.type, "investment_withdrawal"), eq(transactions.investmentOrigin, "pending")),
    with: { account: true },
  });
  return rows
    .map((row) => ({ id: row.id, transactionDate: row.transactionDate, description: row.description, amountCents: row.amountCents, accountName: row.account?.name ?? null }))
    .sort((left, right) => left.transactionDate.localeCompare(right.transactionDate) || left.id.localeCompare(right.id));
}
