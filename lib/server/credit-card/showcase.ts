import type { AppDb } from "@/lib/db";
import { DASHBOARD_CARD_INVOICE_COUNT, shiftMonth } from "@/lib/dashboard-cards";
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
