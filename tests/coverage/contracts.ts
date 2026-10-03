export const metrics = [
  "lines",
  "statements",
  "functions",
  "branches",
] as const;

export type Metric = (typeof metrics)[number];
export interface Counter {
  total: number;
  covered: number;
  skipped: number;
  pct: number | "Unknown";
}
export type FileCoverage = Record<Metric, Counter>;
export interface CoverageTargetReport {
  passed: boolean;
  files: Record<string, Record<Metric, number | null>>;
  failures: string[];
}
