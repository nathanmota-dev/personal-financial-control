import type { ReportPeriod } from "@/lib/interfaces/reports";

export type ReportExportKind = "summary" | "categories";
export type ReportExportRequest = ReportPeriod & { kind: ReportExportKind };
