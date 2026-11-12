import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import { aggregateDashboardMonth } from "@/lib/dashboard-aggregation";
import { buildDashboardHousing, buildHousingEntries, HOUSING_CATEGORY_IDS } from "@/lib/dashboard-housing";
import type { HousingViewData } from "@/lib/interfaces/housing";
import { normalizeCompetenceMonth } from "@/lib/server/finance";
import { readDashboardRecords } from "@/lib/server/dashboard-records";
import { listRecurringTemplates } from "@/lib/server/recurring";

/** Housing spending of a month plus the recurring housing bills. */
export async function getHousingViewData(month: string, database?: AppDb): Promise<HousingViewData> {
  const competenceMonth = normalizeCompetenceMonth(month);
  const db = database ?? await getFinanceDatabase();
  const [records, templates] = await Promise.all([readDashboardRecords([competenceMonth], db), listRecurringTemplates(db)]);
  const incomeCents = aggregateDashboardMonth(competenceMonth, records.activeTransactions, records.expenses).totals.incomeCents;
  return {
    month: competenceMonth,
    housing: buildDashboardHousing({ expenses: records.expenses, incomeCents }),
    entries: buildHousingEntries(records.expenses),
    templates: templates
      .filter((template) => template.type === "expense" && template.status === "active" && HOUSING_CATEGORY_IDS.includes(template.categoryId))
      .map((template) => ({ id: template.id, description: template.description, dayOfMonth: template.dayOfMonth, amountCents: template.amountCents }))
      .sort((left, right) => left.dayOfMonth - right.dayOfMonth),
  };
}
