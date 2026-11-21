import type { AppDb } from "@/lib/db";
import { pluggyAccountLinks, transactions } from "@/lib/db/schema";
import type { ClassifyReserveDestinationInput, ReserveDestinationContribution } from "@/lib/interfaces/reserve-destination";
import { effectiveReserveShare, isShareAbsorbed, keptReserveShare, NEW_POSITION_LOOKBACK_DAYS, reserveAfterShareChange } from "@/lib/reserve-destination";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getBankReserveSplit } from "./bank-reserve";
import { addDaysToDate } from "./planned-movements";
import { reserveConfiguredOn, writeReserveAmount } from "./reserve-withdrawals";
import { InvestmentDb, resolveDb, resolveReadDb } from "./validation";

type TransactionRow = typeof transactions.$inferSelect;
type DestinationRow = Pick<TransactionRow, "type" | "status" | "amountCents" | "transactionDate" | "reserveShareCents" | "reserveClassifiedOn" | "importFingerprint">;
type MarkableRow = Pick<TransactionRow, "id" | "type" | "status" | "investmentOrigin" | "reserveShareCents" | "importFingerprint" | "transactionDate">;

const classifySchema = z.object({ transactionId: z.string().uuid(), reserveCents: z.number().int().nonnegative() });

const isBankTracked = (row: Pick<TransactionRow, "importFingerprint">) => Boolean(row.importFingerprint?.startsWith("pluggy:"));
const isPostedBankContribution = (row: Pick<TransactionRow, "type" | "status" | "importFingerprint">) => row.type === "investment_contribution" && row.status === "posted" && isBankTracked(row);

/** A posted bank contribution nobody gave a destination yet. A pending one waits until the bank posts it. */
export function needsReserveDestination(row: Pick<TransactionRow, "type" | "status" | "investmentOrigin" | "reserveShareCents" | "importFingerprint">) {
  return isPostedBankContribution(row) && !row.investmentOrigin && row.reserveShareCents === null;
}

/** The date the reserve was typed, or `null` while it was never set and every contribution is portfolio. */
async function readConfiguredOn(db: InvestmentDb) {
  const portfolio = await db.query.investmentPortfolio.findFirst();
  if (!portfolio || portfolio.reserveAmountCents === null) return { portfolio, configuredOn: null };
  return { portfolio, configuredOn: reserveConfiguredOn(portfolio) };
}

/** Pending, or classified on top of the reserve. A contribution dated before the reserve is open only when the app asked about it. */
function isOpenForDestination(row: TransactionRow, configuredOn: string) {
  if (!isPostedBankContribution(row)) return false;
  if (row.investmentOrigin === "pending") return true;
  return row.reserveShareCents === null ? row.transactionDate >= configuredOn : !isShareAbsorbed(row, configuredOn);
}

/**
 * Marks a bank contribution as waiting for its destination. Before the reserve exists, or before the date it was typed,
 * the contribution is already part of the amount the person typed, so nothing is asked.
 */
export async function markPendingReserveDestination(db: InvestmentDb, row: MarkableRow) {
  if (!needsReserveDestination(row)) return null;
  const { configuredOn } = await readConfiguredOn(db);
  if (configuredOn === null || row.transactionDate < configuredOn) return null;
  await db.update(transactions).set({ investmentOrigin: "pending", updatedAt: currentTimestamp() }).where(eq(transactions.id, row.id));
  return "pending" as const;
}

/**
 * A position the app starts following after the reserve was typed was not in the total the person split.
 * Contributions of the connection from the days before the reserve, and after it, are asked about.
 */
export async function askDestinationsForNewPosition(db: InvestmentDb, itemId: string) {
  const { configuredOn } = await readConfiguredOn(db);
  if (configuredOn === null) return 0;
  const since = addDaysToDate(configuredOn, -NEW_POSITION_LOOKBACK_DAYS);
  const links = (await db.query.pluggyAccountLinks.findMany({ where: eq(pluggyAccountLinks.itemId, itemId) })).filter((link) => link.kind === "bank");
  if (!links.length) return 0;
  const rows = await db.query.transactions.findMany({ where: inArray(transactions.accountId, links.map((link) => link.accountId)) });
  const ids = rows.filter((row) => needsReserveDestination(row) && row.transactionDate >= since).map((row) => row.id);
  if (ids.length) await db.update(transactions).set({ investmentOrigin: "pending", updatedAt: currentTimestamp() }).where(inArray(transactions.id, ids));
  return ids.length;
}

/** Bank contributions the reserve still answers for: pending first, then the newest. */
export async function listReserveDestinations(database?: InvestmentDb): Promise<ReserveDestinationContribution[]> {
  const db = await resolveReadDb(database);
  const { configuredOn } = await readConfiguredOn(db);
  if (configuredOn === null) return [];
  const rows = await db.query.transactions.findMany({ where: eq(transactions.type, "investment_contribution"), with: { account: true } });
  return rows
    .filter((row) => isOpenForDestination(row, configuredOn) && (row.investmentOrigin === "pending" || row.reserveShareCents !== null))
    .map((row) => ({
      id: row.id,
      transactionDate: row.transactionDate,
      description: row.description,
      amountCents: row.amountCents,
      accountName: row.account?.name ?? null,
      reserveShareCents: row.reserveShareCents,
      pending: row.investmentOrigin === "pending",
      beforeReserve: row.transactionDate < configuredOn,
    }))
    .sort((left, right) => Number(right.pending) - Number(left.pending) || right.transactionDate.localeCompare(left.transactionDate) || left.id.localeCompare(right.id));
}

/** Sets how much of a bank contribution went to the reserve. Changing it again moves the reserve by the difference only. */
export async function classifyReserveDestination(input: ClassifyReserveDestinationInput, database?: AppDb) {
  const db = await resolveDb(database);
  const { transactionId, reserveCents } = classifySchema.parse(input);
  return db.transaction(async (tx) => {
    const row = await tx.query.transactions.findFirst({ where: eq(transactions.id, transactionId) });
    invariant(row, "TRANSACTION_NOT_FOUND", "Aporte não encontrado.", 404);
    invariant(isPostedBankContribution(row), "CONTRIBUTION_NOT_TRACKED", "Só aportes lançados pelo banco recebem um destino.");
    invariant(reserveCents <= row.amountCents, "RESERVE_SHARE_ABOVE_AMOUNT", "A parte da reserva não pode passar do valor do aporte.");
    const split = await getBankReserveSplit(tx);
    invariant(split, "BANK_RESERVE_REQUIRES_LINKED_POSITION", "Vincule uma posição do Open Finance antes de definir a reserva.");
    const { portfolio, configuredOn } = await readConfiguredOn(tx);
    invariant(portfolio && portfolio.reserveAmountCents !== null && configuredOn !== null, "BANK_RESERVE_NOT_SET", "Defina quanto é reserva antes de classificar os aportes.");
    invariant(isOpenForDestination(row, configuredOn), "CONTRIBUTION_BEFORE_RESERVE", "Este aporte já está dentro da reserva que você definiu. Ajuste o valor da reserva se precisar.");
    const deltaCents = reserveCents - effectiveReserveShare(row, configuredOn);
    const nextReserveCents = reserveAfterShareChange(portfolio.reserveAmountCents, deltaCents);
    invariant(deltaCents <= 0 || nextReserveCents <= split.totalCents, "RESERVE_DESTINATION_ABOVE_TOTAL", "A reserva passaria do total investido que o banco informa. Vincule a posição desta aplicação e tente de novo.");
    await tx.update(transactions).set({ reserveShareCents: reserveCents, reserveClassifiedOn: getFinanceToday(), investmentOrigin: null, updatedAt: currentTimestamp() }).where(eq(transactions.id, row.id));
    if (deltaCents) await writeReserveAmount(tx, portfolio, nextReserveCents);
    return { id: row.id, reserveShareCents: reserveCents };
  });
}

/**
 * Keeps the reserve in step when a classified contribution is edited or deleted (`after` is `null`).
 * Runs inside the write that changes the row.
 */
export async function followReserveShare(db: InvestmentDb, before: DestinationRow & { id: string }, after: DestinationRow | null) {
  if (before.reserveShareCents === null) return;
  const { portfolio, configuredOn } = await readConfiguredOn(db);
  const keptShareCents = after ? keptReserveShare(before.reserveShareCents, after) : null;
  if (after && keptShareCents !== after.reserveShareCents) {
    await db.update(transactions).set({ reserveShareCents: keptShareCents }).where(eq(transactions.id, before.id));
  }
  const deltaCents = effectiveReserveShare(after && { ...after, reserveShareCents: keptShareCents }, configuredOn) - effectiveReserveShare(before, configuredOn);
  if (!deltaCents || !portfolio || portfolio.reserveAmountCents === null) return;
  await writeReserveAmount(db, portfolio, reserveAfterShareChange(portfolio.reserveAmountCents, deltaCents));
}
