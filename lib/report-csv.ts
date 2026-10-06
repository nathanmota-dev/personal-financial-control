import { reportCategoryTotals } from "@/lib/report-aggregation";
import type { ReportMetrics, ReportResult } from "@/lib/interfaces/reports";
import type { ReportExportKind } from "@/lib/interfaces/report-export";

function csvCell(value: string | number | null) {
  if (value === null) return "";
  // Numeric negatives remain numbers. Only text can receive a formula guard.
  if (typeof value === "number") return value.toFixed(2).replace(".", ",");
  const safe = /^[\s\p{Cc}\p{Cf}]*[=+\-@]/u.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

function summaryRow(month: string, metrics: ReportMetrics) {
  return [month, ...[
    metrics.incomeCents, metrics.expenseCents, metrics.operatingResultCents,
    metrics.investmentContributionCents, metrics.investmentWithdrawalCents,
    metrics.netInvestmentFlowCents, metrics.netResultCents,
  ].map((cents) => cents / 100), metrics.savingsRate];
}

export function buildReportCsv(report: ReportResult, kind: ReportExportKind) {
  const rows: (string | number | null)[][] = [];
  if (kind === "summary") {
    rows.push(["Competência", "Receitas", "Despesas", "Resultado antes dos investimentos", "Aportes", "Resgates", "Investimentos líquidos", "Saldo livre", "Taxa de economia (%)"]);
    if (report.mode === "monthly") rows.push(summaryRow(report.period, report.totals));
    else {
      for (const { month, metrics } of report.series) rows.push(summaryRow(month, metrics));
      rows.push(summaryRow("TOTAL", report.totals));
    }
  } else {
    rows.push(["Competência", "Identificador da categoria", "Categoria", "Despesa líquida"]);
    for (const month of report.months) {
      const categories = reportCategoryTotals(report.entries.filter((entry) => entry.month === month), []);
      for (const category of categories.filter((row) => row.type === "expense")) {
        rows.push([month, category.id, category.name, category.amountCents / 100]);
      }
    }
  }
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}\r\n`;
}
