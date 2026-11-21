import { transactions } from "@/lib/db/schema";
import { currentTimestamp } from "@/lib/server/finance";
import { eq, inArray } from "drizzle-orm";
import type { InvestmentDb } from "./validation";

/** A reserve typed by the person includes every contribution made until then, so older ones stop waiting. */
export async function settlePendingDestinationsBefore(db: InvestmentDb, configuredOn: string) {
  const rows = await db.query.transactions.findMany({ where: eq(transactions.type, "investment_contribution") });
  const ids = rows.filter((row) => row.investmentOrigin === "pending" && row.transactionDate < configuredOn).map((row) => row.id);
  if (ids.length) await db.update(transactions).set({ investmentOrigin: null, updatedAt: currentTimestamp() }).where(inArray(transactions.id, ids));
}
