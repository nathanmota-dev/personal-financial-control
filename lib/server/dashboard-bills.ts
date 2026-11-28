import { and, eq } from "drizzle-orm";
import type { AppDb } from "@/lib/db";
import { recurringTemplates } from "@/lib/db/schema";
import { summarizeDashboardBills } from "@/lib/dashboard-bills";
import type { DashboardBillsData } from "@/lib/interfaces/dashboard-bills";
import { listPaidRecurringTemplateIds } from "@/lib/server/recurring/occurrences";

/** Recurring expenses of the current month still unpaid from `today` onwards. */
export async function readDashboardBills(today: string, db: AppDb): Promise<DashboardBillsData> {
  const month = today.slice(0, 7);
  const templates = await db.query.recurringTemplates.findMany({
    where: and(eq(recurringTemplates.status, "active"), eq(recurringTemplates.type, "expense")),
  });
  // A pending or cancelled occurrence is not a payment; a posted or card entry linked to the rule is.
  const paidTemplateIds = await listPaidRecurringTemplateIds(db, month, templates.map((template) => template.id));
  return summarizeDashboardBills({ today, templates, paidTemplateIds });
}
