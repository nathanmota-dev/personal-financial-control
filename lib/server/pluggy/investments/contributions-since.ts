import { eq, inArray } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { pluggyAccountLinks, transactions } from "@/lib/db/schema";

/** Posted bank contributions in the connection's accounts dated after `since`, the last day its positions were valued. */
export async function contributionsSinceCents(db: AppDb, itemId: string, since: string) {
  const links = (await db.query.pluggyAccountLinks.findMany({ where: eq(pluggyAccountLinks.itemId, itemId) })).filter((link) => link.kind === "bank");
  if (!links.length) return 0;
  const rows = await db.query.transactions.findMany({ where: inArray(transactions.accountId, links.map((link) => link.accountId)) });
  return rows
    .filter((row) => row.type === "investment_contribution" && row.status === "posted" && row.importFingerprint?.startsWith("pluggy:") && row.transactionDate > since)
    .reduce((total, row) => total + row.amountCents, 0);
}
