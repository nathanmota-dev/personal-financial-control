import { aggregateDashboardMonth } from "@/lib/dashboard-aggregation";
import type { DashboardTotals } from "@/lib/interfaces/dashboard";
import type { ReportEntry, ReportMetrics, ReportPeriod, ReportRecords, ReportResult } from "@/lib/interfaces/reports";
import { reportYearMonths, shiftReportPeriod } from "@/lib/report-periods";

export function reportMetrics(totals: DashboardTotals): ReportMetrics {
  const expenseCents = totals.fixedExpenseCents + totals.variableExpenseCents + totals.uncategorizedExpenseCents;
  const operatingResultCents = totals.incomeCents - expenseCents;
  return { ...totals, expenseCents, operatingResultCents,
    savingsRate: totals.incomeCents > 0 ? operatingResultCents / totals.incomeCents * 100 : null };
}

export function reportEntries(records: ReportRecords): ReportEntry[] {
  return [
    ...records.activeTransactions.map((row): ReportEntry => ({
      id: row.id, month: row.competenceMonth, description: row.description, amountCents: row.amountCents,
      type: row.type, status: row.status, source: "transaction",
      categoryId: row.category?.id ?? "uncategorized", category: row.category?.name ?? "Sem categoria", account: row.account?.name ?? "Conta ausente",
    })),
    ...records.installments.map((row): ReportEntry => ({
      id: row.id, month: row.invoiceMonth, description: row.charge.description, amountCents: row.amountCents,
      type: "expense", status: "installment", source: "installment",
      categoryId: row.charge.category?.id ?? "uncategorized", category: row.charge.category?.name ?? "Sem categoria", account: row.charge.account?.name ?? "Conta ausente",
    })),
  ].sort((a, b) => a.month.localeCompare(b.month) || a.id.localeCompare(b.id));
}

function sumMetrics(metrics: ReportMetrics[]) {
  const totals = aggregateDashboardMonth("", [], []).totals;
  for (const row of metrics) for (const key of Object.keys(totals) as (keyof DashboardTotals)[]) totals[key] += row[key];
  return reportMetrics(totals);
}

export function reportCategoryTotals(entries: ReportEntry[], previous: ReportEntry[]) {
  const categories = new Map<string, ReportResult["categories"][number]>();
  for (const [rows, field] of [[entries, "amountCents"], [previous, "previousCents"]] as const) {
    for (const row of rows) {
      const key = `${row.type}:${row.categoryId}`;
      const item = categories.get(key) ?? { id: key, name: row.category, type: row.type, amountCents: 0, previousCents: 0 };
      item[field] += row.amountCents;
      categories.set(key, item);
    }
  }
  return [...categories.values()].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
}

export function buildReport(selection: ReportPeriod, today: string, records: ReportRecords): ReportResult {
  const { mode, period } = selection;
  const previousPeriod = shiftReportPeriod(mode, period, -1);
  const months = mode === "monthly" ? [period] : reportYearMonths(period, today);
  const previousMonths = mode === "monthly" ? [previousPeriod] : reportYearMonths(previousPeriod, "9999-12-31");
  const series = reportYearMonths(period.slice(0, 4), today).map((month) => {
    const result = aggregateDashboardMonth(month, records.activeTransactions, records.expenses);
    return { month, metrics: reportMetrics(result.totals), hasMovements: result.hasMovements };
  });
  const metricsFor = (month: string) => reportMetrics(aggregateDashboardMonth(month, records.activeTransactions, records.expenses).totals);
  const totals = sumMetrics(months.map(metricsFor));
  const previous = sumMetrics(previousMonths.map(metricsFor));
  const allEntries = reportEntries(records);
  const entries = allEntries.filter((row) => months.includes(row.month));
  const previousEntries = allEntries.filter((row) => previousMonths.includes(row.month));
  const pending = entries.filter((row) => row.status === "pending");
  const differenceCents = totals.operatingResultCents - previous.operatingResultCents;
  return { ...selection, months, series, totals, previous, previousPeriod,
    comparison: { differenceCents, hasHistory: previousEntries.length > 0,
      percentage: previousEntries.length && previous.operatingResultCents > 0 ? differenceCents / previous.operatingResultCents * 100 : null },
    partial: period === today.slice(0, mode === "monthly" ? 7 : 4),
    future: period > today.slice(0, mode === "monthly" ? 7 : 4),
    averageDivisor: months.length, averageIncomeCents: months.length ? totals.incomeCents / months.length : null,
    pending: { count: pending.length, amountCents: pending.reduce((sum, row) => sum + row.amountCents, 0) },
    categories: reportCategoryTotals(entries, previousEntries), entries,
  };
}
