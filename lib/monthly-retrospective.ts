import type { MonthlyInsight, MonthlyRetrospective } from "@/lib/interfaces/monthly-retrospective";
import type { ReportEntry, ReportResult } from "@/lib/interfaces/reports";

// MVP category rules: at least R$ 100 absolute change and 20% for a positive
// previous base. Zero/negative bases use absolute amounts only. No settings UI.
export const MONTHLY_INSIGHT_MINIMUM_CENTS = 10000;
export const MONTHLY_INSIGHT_MINIMUM_PERCENTAGE = 20;
export const MONTHLY_INSIGHT_LIMIT = 3;

export function monthlyCategoryInsights(report: ReportResult): MonthlyInsight[] {
  if (report.partial || report.future || !report.comparison.hasHistory) return [];
  const insights: MonthlyInsight[] = [];
  for (const category of report.categories) {
    if (category.type !== "expense") continue;
    const differenceCents = category.amountCents - category.previousCents;
    const percentage = category.previousCents > 0 ? differenceCents / category.previousCents * 100 : null;
    if (Math.abs(differenceCents) < MONTHLY_INSIGHT_MINIMUM_CENTS) continue;
    if (percentage !== null && Math.abs(percentage) < MONTHLY_INSIGHT_MINIMUM_PERCENTAGE) continue;
    insights.push({
      id: category.id, category: category.name, currentCents: category.amountCents,
      previousCents: category.previousCents, differenceCents, percentage,
      kind: category.previousCents === 0 && category.amountCents > 0 ? "new"
        : percentage === null ? "absolute" : differenceCents > 0 ? "increase" : "decrease",
    });
  }
  return insights.sort((a, b) => Math.abs(b.differenceCents) - Math.abs(a.differenceCents) || a.id.localeCompare(b.id)).slice(0, MONTHLY_INSIGHT_LIMIT);
}

export function buildMonthlyRetrospective(report: ReportResult, previousEntries: ReportEntry[]): MonthlyRetrospective {
  const largestExpense = report.entries.filter((entry) => entry.type === "expense" && entry.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents || a.id.localeCompare(b.id))[0] ?? null;
  const largestCategory = report.categories.filter((category) => category.type === "expense" && category.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents || a.id.localeCompare(b.id))[0] ?? null;
  return {
    period: report.period, previousPeriod: report.previousPeriod, partial: report.partial, future: report.future,
    totals: report.totals, pending: report.pending, hasHistory: report.comparison.hasHistory,
    entries: report.entries, previousEntries, largestExpense, largestCategory,
    insights: monthlyCategoryInsights(report),
  };
}
