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
export type ReportControlsProps = ReportPeriod & { defaultMonth: string; rememberedMonth?: string };
export type ReportInitialResult = Pick<ReportResult, "mode" | "period" | "series" | "pending" | "partial"> & { entryCount: number };
export type ReportInitialProps = { report: ReportInitialResult };
export type ReportMonthsProps = { report: Pick<ReportResult, "series"> };
export type ReportCategoryProps = { report: Pick<ReportResult, "categories" | "previousPeriod" | "partial"> };
export type ReportEntriesProps = { report: Pick<ReportResult, "entries"> };
export type ReportView = "categories" | "sources" | "summary";
export type ReportDeferredState = {
  categories: ReportResult["categories"] | null;
  entries: ReportEntry[] | null;
  categoryError: boolean;
  entriesError: boolean;
};

export type ReportYearPickerProps = { year: string; onYearChange: (year: string) => void };
export type ReportEntryProps = { entry: ReportEntry };

export type ReportViewLoadingProps = { error: boolean; retry: () => void };
