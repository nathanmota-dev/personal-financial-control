import type { DashboardTotals } from "@/lib/interfaces/dashboard";
import type { readDashboardRecords } from "@/lib/server/dashboard-records";

export type ReportMode = "monthly" | "annual";
export type ReportPeriod = { mode: ReportMode; period: string };
export type ReportRecords = Awaited<ReturnType<typeof readDashboardRecords>>;
export type ReportMetrics = DashboardTotals & {
  expenseCents: number;
  operatingResultCents: number;
  savingsRate: number | null;
};
export type ReportEntry = {
  id: string; month: string; description: string; amountCents: number;
  type: string; status: string; source: "transaction" | "installment";
  category: string; categoryId: string; account: string;
};
export type ReportResult = ReportPeriod & {
  months: string[]; series: { month: string; metrics: ReportMetrics; hasMovements: boolean }[];
  totals: ReportMetrics; previous: ReportMetrics; previousPeriod: string;
  comparison: { differenceCents: number; percentage: number | null; hasHistory: boolean };
  partial: boolean; future: boolean; averageDivisor: number; averageIncomeCents: number | null;
  pending: { amountCents: number; count: number };
  categories: { id: string; name: string; type: string; amountCents: number; previousCents: number }[];
  entries: ReportEntry[];
};
export type ReportProps = { report: ReportResult };
export type ReportControlsProps = ReportPeriod & { previousPeriod: string; nextPeriod: string };
