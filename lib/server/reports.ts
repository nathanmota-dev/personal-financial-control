import { aggregateDashboardMonth } from "@/lib/dashboard-aggregation";
import { getFinanceDatabase, type AppDb } from "@/lib/db";
import type { ReportInitialResult, ReportPeriod, ReportView } from "@/lib/interfaces/reports";
import { buildReport, reportEntries, reportMetrics } from "@/lib/report-aggregation";
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

export async function getReportInitial(selection: ReportPeriod, database?: AppDb, today = getFinanceToday()): Promise<ReportInitialResult> {
  const months = reportYearMonths(selection.period.slice(0, 4), today);
  const selectedMonths = selection.mode === "monthly" ? [selection.period] : months;
  const records = await readDashboardRecords([...new Set([...months, ...selectedMonths])], database ?? await getFinanceDatabase());
  const entries = records.activeTransactions.filter((row) => selectedMonths.includes(row.competenceMonth));
  const pending = entries.filter((row) => row.status === "pending");
  return {
    ...selection,
    series: months.map((month) => {
      const result = aggregateDashboardMonth(month, records.activeTransactions, records.expenses);
      return { month, metrics: reportMetrics(result.totals), hasMovements: result.hasMovements };
    }),
    partial: selection.period === today.slice(0, selection.mode === "monthly" ? 7 : 4),
    entryCount: entries.length + records.installments.filter((row) => selectedMonths.includes(row.invoiceMonth)).length,
    pending: { count: pending.length, amountCents: pending.reduce((sum, row) => sum + row.amountCents, 0) },
  };
}

export async function getReportView(selection: ReportPeriod, view: ReportView, database?: AppDb, today = getFinanceToday()) {
  const previous = shiftReportPeriod(selection.mode, selection.period, -1);
  const months = selection.mode === "monthly" ? [selection.period] : reportYearMonths(selection.period, today);
  const previousMonths = view === "categories" ? selection.mode === "monthly" ? [previous] : reportYearMonths(previous, "9999-12-31") : [];
  const records = await readDashboardRecords([...new Set([...months, ...previousMonths])], database ?? await getFinanceDatabase());
  if (view === "sources") return { entries: reportEntries(records).filter((row) => months.includes(row.month)) };
  return { categories: buildReport(selection, today, records).categories };
}
