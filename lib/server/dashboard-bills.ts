import { and, eq, inArray } from "drizzle-orm";
import type { AppDb } from "@/lib/db";
import { recurringTemplates, transactions } from "@/lib/db/schema";
import { summarizeDashboardBills } from "@/lib/dashboard-bills";
import type { DashboardBillsData } from "@/lib/interfaces/dashboard-bills";

/** Recurring expenses of the current month still unpaid from `today` onwards. */
export async function readDashboardBills(today: string, db: AppDb): Promise<DashboardBillsData> {
  const month = today.slice(0, 7);
  const templates = await db.query.recurringTemplates.findMany({
    where: and(eq(recurringTemplates.status, "active"), eq(recurringTemplates.type, "expense")),
  });
  if (!templates.length) return summarizeDashboardBills({ today, templates, paidTemplateIds: new Set() });
  const generated = await db.query.transactions.findMany({
    where: and(eq(transactions.competenceMonth, month), inArray(transactions.recurringTemplateId, templates.map((template) => template.id))),
  });
  // A pending or cancelled occurrence is not a payment.
  const paidTemplateIds = new Set(generated.filter((row) => row.status === "posted").map((row) => row.recurringTemplateId as string));
  return summarizeDashboardBills({ today, templates, paidTemplateIds });
}
