import type { ReportMode, ReportPeriod } from "@/lib/interfaces/reports";
import type { ReportExportRequest } from "@/lib/interfaces/report-export";

export function parseReportPeriod(params: Record<string, string | string[] | undefined>, defaultMonth: string): ReportPeriod | null {
  const mode = params.mode ?? "monthly";
  if (mode !== "monthly" && mode !== "annual") return null;
  const period = params.period ?? (mode === "monthly" ? defaultMonth : defaultMonth.slice(0, 4));
  if (typeof period !== "string" || !(mode === "monthly" ? /^[0-9]{4}-(0[1-9]|1[0-2])$/ : /^[0-9]{4}$/).test(period)) return null;
  const year = Number(period.slice(0, 4));
  return year >= 2 && year <= 9998 ? { mode, period } : null;
}

export function shiftReportPeriod(mode: ReportMode, period: string, offset: number) {
  const year = Number(period.slice(0, 4));
  if (mode === "annual") return String(year + offset).padStart(4, "0");
  const index = year * 12 + Number(period.slice(5)) - 1 + offset;
  return `${String(Math.floor(index / 12)).padStart(4, "0")}-${String(index % 12 + 1).padStart(2, "0")}`;
}

export function reportYearMonths(year: string, today: string) {
  const currentYear = today.slice(0, 4);
  const count = year > currentYear ? 0 : year === currentYear ? Number(today.slice(5, 7)) : 12;
  return Array.from({ length: count }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
}

export function reportHref(mode: ReportMode, period: string, rememberedMonth?: string) {
  const params = new URLSearchParams({ mode, period });
  if (mode === "annual" && rememberedMonth) params.set("month", rememberedMonth);
  return `/reports?${params}`;
}

export function reportCsvFilename({ kind, mode, period }: ReportExportRequest) {
  return `relatorio-${kind === "summary" ? "resumo" : "categorias"}-${mode === "monthly" ? "mensal" : "anual"}-${period}.csv`;
}
