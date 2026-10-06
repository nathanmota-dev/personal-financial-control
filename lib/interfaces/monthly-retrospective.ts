import type { ReportEntry, ReportMetrics, ReportResult } from "@/lib/interfaces/reports";

export type MonthlyInsight = {
  id: string; category: string; currentCents: number; previousCents: number;
  differenceCents: number; percentage: number | null;
  kind: "increase" | "decrease" | "new" | "absolute";
};
export type MonthlyRetrospective = {
  period: string; previousPeriod: string; partial: boolean; future: boolean;
  totals: ReportMetrics; pending: ReportResult["pending"]; hasHistory: boolean;
  entries: ReportEntry[]; previousEntries: ReportEntry[];
  largestExpense: ReportEntry | null;
  largestCategory: ReportResult["categories"][number] | null;
  insights: MonthlyInsight[];
};
export type MonthlyRetrospectiveProps = { summary: MonthlyRetrospective };
export type MonthlyInsightProps = MonthlyRetrospectiveProps & { insight: MonthlyInsight };
export type SummaryEvidenceProps = { label: string; entries: ReportEntry[] };
export type MonthlySummaryState = { period: string; attempt: number; summary: MonthlyRetrospective | null; error: boolean };
export type MonthlySummaryQuery = { period: string; enabled: boolean };
export type MonthlySummaryViewProps = { period: string; summary: MonthlyRetrospective | null; error: boolean; retry: () => void };
