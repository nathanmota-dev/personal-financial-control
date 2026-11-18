import type { AppDb } from "@/lib/db";
import { creditCardLimits } from "@/lib/db/schema";
import { buildCreditCardLimitView } from "@/lib/credit-card-limit";
import { DASHBOARD_CARD_INVOICE_COUNT, shiftMonth } from "@/lib/dashboard-cards";
import type { CreditCardLimits } from "@/lib/interfaces/credit-card-limit";
import type { PluggyCardLimit } from "@/lib/interfaces/pluggy";
import { readDashboardAccounts, readDashboardCards, readDashboardRecords } from "@/lib/server/dashboard-records";
import { localDay } from "@/lib/server/pluggy/mappers/bank-transaction";
import { resolveDb } from "./validation";

/** One row per card: each sync replaces the previous report. */
export async function saveCreditCardLimit(db: AppDb, accountId: string, limit: PluggyCardLimit, now: Date) {
  await db.insert(creditCardLimits).values({ accountId, ...limit }).onConflictDoUpdate({
    target: creditCardLimits.accountId,
    set: { ...limit, updatedAt: now },
  });
}

/** Limits of the active cards, with the invoice still to be paid on `today` taken from the local records. */
export async function getCreditCardLimits(today: string, database?: AppDb): Promise<CreditCardLimits> {
  const db = await resolveDb(database);
  const rows = await db.query.creditCardLimits.findMany();
  if (!rows.length) return {};
  const month = today.slice(0, 7);
  // The open invoice may already be next month's, so the records cover one month past the invoices shown.
  const months = Array.from({ length: DASHBOARD_CARD_INVOICE_COUNT + 1 }, (_, index) => shiftMonth(month, index));
  const [records, accountRows] = await Promise.all([readDashboardRecords(months, db), readDashboardAccounts(db)]);
  const cards = await readDashboardCards(month, records.expenses, accountRows, db, today);
  return Object.fromEntries(rows.flatMap((row) => {
    const card = cards.find((entry) => entry.id === row.accountId);
    // An invoice paid before its due date no longer takes up the limit.
    const invoice = card?.invoices.find((entry) => entry.status !== "paid");
    if (!invoice) return [];
    const collectedOn = localDay(row.collectedAt.toISOString()) ?? today;
    return [[row.accountId, buildCreditCardLimitView({ limitCents: row.limitCents, availableCents: row.availableCents, collectedOn, invoice })]];
  }));
}
