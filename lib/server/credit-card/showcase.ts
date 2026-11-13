import { and, eq } from "drizzle-orm";
import type { AppDb } from "@/lib/db";
import { creditCardBills } from "@/lib/db/schema";
import { DASHBOARD_CARD_INVOICE_COUNT, resolveOpenInvoiceMonth, shiftMonth } from "@/lib/dashboard-cards";
import type { DashboardCardsData } from "@/lib/interfaces/dashboard-cards";
import { normalizeCompetenceMonth } from "@/lib/server/finance";
import { readDashboardAccounts, readDashboardCards, readDashboardRecords } from "@/lib/server/dashboard-records";
import { resolveDb } from "./validation";

/** Every active credit card with the selected invoice and the next ones, as shown in the cards carousel. */
export async function getCreditCardShowcase(invoiceMonth: string, database?: AppDb): Promise<DashboardCardsData> {
  const db = await resolveDb(database);
  const month = normalizeCompetenceMonth(invoiceMonth);
  const months = Array.from({ length: DASHBOARD_CARD_INVOICE_COUNT }, (_, index) => shiftMonth(month, index));
  const [records, accountRows] = await Promise.all([readDashboardRecords(months, db), readDashboardAccounts(db)]);
  return readDashboardCards(month, records.expenses, accountRows, db);
}

/** Invoice the card page opens on without a month: the selected card's (or the first one's) still to be paid. */
export async function getCreditCardDefaultMonth(today: string, accountId?: string, database?: AppDb) {
  const db = await resolveDb(database);
  const month = today.slice(0, 7);
  const cards = (await readDashboardAccounts(db)).filter((account) => account.type === "credit");
  const account = cards.find((card) => card.id === accountId) ?? cards[0];
  if (!account) return month;
  const bill = await db.query.creditCardBills.findFirst({
    where: and(eq(creditCardBills.accountId, account.id), eq(creditCardBills.invoiceMonth, month)),
    columns: { dueDate: true },
  });
  return resolveOpenInvoiceMonth(today, account.creditDueDay, bill?.dueDate);
}
