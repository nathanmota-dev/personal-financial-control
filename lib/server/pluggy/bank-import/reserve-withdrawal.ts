import { eq } from "drizzle-orm";

import { pluggyItems } from "@/lib/db/schema";
import type { BankImportLocalRow, BankImportScope } from "@/lib/interfaces/pluggy-bank-import";
import type { PluggySyncStepContext } from "@/lib/interfaces/pluggy";
import { applyReserveWithdrawal } from "@/lib/server/investments/reserve-withdrawals";
import type { InvestmentDb } from "@/lib/server/investments/validation";
import { linkedHoldingsByAsset } from "../investments/match-holdings";
import { readRemoteInvestments } from "../investments/read-positions";

type Tracked = Pick<BankImportLocalRow, "id" | "type" | "status" | "amountCents" | "transactionDate" | "investmentOrigin">;

/**
 * A withdrawal only moves the reserve when its connection reports positions the app follows.
 * Money kept inside an account, such as a savings box that exposes no position, is account balance.
 */
async function readTracksPositions(context: PluggySyncStepContext, itemId: string) {
  const item = await context.db.query.pluggyItems.findFirst({ where: eq(pluggyItems.id, itemId) });
  if (!item) return false;
  const { positions } = await readRemoteInvestments(context.client, item);
  if (!positions.length) return false;
  const linked = linkedHoldingsByAsset(await context.db.query.investmentHoldings.findMany());
  return positions.some((position) => {
    const holding = linked.get(position.id);
    return Boolean(holding && !holding.isArchived);
  });
}

/** Cached per connection for the run; an unreadable connection follows no positions. */
export function tracksLinkedPositions({ context, link, run }: Pick<BankImportScope, "context" | "link" | "run">) {
  if (!run.trackedItems.has(link.itemId)) run.trackedItems.set(link.itemId, readTracksPositions(context, link.itemId).catch(() => false));
  return run.trackedItems.get(link.itemId)!;
}

/** A posted withdrawal nobody attributed yet. A pending one waits until the bank posts it. */
export function needsReserveOrigin(row: Pick<Tracked, "type" | "status" | "investmentOrigin">) {
  return row.type === "investment_withdrawal" && row.status === "posted" && !row.investmentOrigin;
}

/** Runs inside the write that records the row, so the origin and the reserve change land together. */
export async function attributeImportedWithdrawal(db: InvestmentDb, row: Tracked) {
  if (!needsReserveOrigin(row)) return null;
  return applyReserveWithdrawal(db, row);
}
