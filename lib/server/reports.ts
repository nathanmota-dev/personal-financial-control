import { getFinanceDatabase, type AppDb } from "@/lib/db";
import type { ReportPeriod } from "@/lib/interfaces/reports";
import { buildReport } from "@/lib/report-aggregation";
import { reportYearMonths, shiftReportPeriod } from "@/lib/report-periods";
import { readDashboardRecords } from "@/lib/server/dashboard-records";
import { getFinanceToday } from "@/lib/server/runtime";

export async function getReport(selection: ReportPeriod, database?: AppDb, today = getFinanceToday()) {
  const previous = shiftReportPeriod(selection.mode, selection.period, -1);
  const months = new Set(reportYearMonths(selection.period.slice(0, 4), today));
  if (selection.mode === "monthly") { months.add(selection.period); months.add(previous); }
  else for (const month of reportYearMonths(previous, "9999-12-31")) months.add(month);
  const records = await readDashboardRecords([...months], database ?? await getFinanceDatabase());
  return buildReport(selection, today, records);
}
