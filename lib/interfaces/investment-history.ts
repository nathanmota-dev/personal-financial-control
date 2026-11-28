import type { ComponentProps, ReactNode } from "react";

import type { ChartTooltipContent } from "@/components/ui/chart";
import type { investmentOperationTypes } from "@/lib/db/schema/enums";

export type InvestmentHistoryHolding = {
  id: string;
  externalAssetId: string | null;
  isArchived: boolean;
  currentValueCents: number;
};

export type InvestmentHistorySnapshot = {
  holdingId: string;
  snapshotDate: string;
  currentValueCents: number;
};

export type InvestmentHistoryOperation = {
  holdingId: string;
  type: (typeof investmentOperationTypes)[number];
  operatedOn: string;
  grossAmountCents: number;
  feesCents: number;
};

export type InvestmentHistoryTransaction = {
  type: "investment_contribution" | "investment_withdrawal";
  transactionDate: string;
  amountCents: number;
};

export type InvestmentHistoryInput = {
  holdings: InvestmentHistoryHolding[];
  snapshots: InvestmentHistorySnapshot[];
  operations: InvestmentHistoryOperation[];
  /** Bank movements. They only count while a position is linked to the bank, since that is where the money lands. */
  transactions: InvestmentHistoryTransaction[];
  today: string;
};

export type InvestmentHistoryPoint = {
  month: string;
  /** Value of the positions at the end of the month. */
  valueCents: number;
  /** Contributions minus withdrawals in the month. */
  netFlowCents: number;
  /** Value at the start of the history plus every net flow after it. */
  investedCents: number;
  /** What the positions earned in the month, without the money that came in or out. */
  gainCents: number;
  /** Modified Dietz return of the month, as a fraction. */
  returnRate: number;
  /** Chained monthly returns since the first month (time-weighted), as a fraction. */
  cumulativeRate: number;
};

export type InvestmentHistory = { points: InvestmentHistoryPoint[] };

export type InvestmentBenchmarkKey = "cdi" | "ipca" | "ibov";

/** Monthly rate of each index by `YYYY-MM`, as a fraction. `null` when the source could not be read. */
export type InvestmentBenchmarkRates = Record<InvestmentBenchmarkKey, Record<string, number> | null>;

export type InvestmentHistoryWithBenchmarks = InvestmentHistory & { benchmarks: InvestmentBenchmarkRates };

export type InvestmentBenchmarkPoint = {
  month: string;
  portfolio: number;
  cdi: number | null;
  ipca: number | null;
  ibov: number | null;
};

export type InvestmentHistoryPeriod = "12m" | "24m" | "all";

export type InvestmentHistorySummary = {
  valueCents: number;
  investedCents: number;
  gainCents: number;
  cumulativeRate: number;
  best: InvestmentHistoryPoint | null;
  worst: InvestmentHistoryPoint | null;
  averageGainCents: number;
};

export type InvestmentHistorySectionProps = { history: InvestmentHistoryWithBenchmarks };

export type InvestmentHistoryPeriodControlProps = {
  value: InvestmentHistoryPeriod;
  onChange: (value: InvestmentHistoryPeriod) => void;
};

export type InvestmentHistoryStatProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "brand" | "contrast" | "positive" | "negative" | "neutral";
};

export type InvestmentHistoryEmptyProps = { title: string; description: string };

export type InvestmentEvolutionChartProps = {
  points: InvestmentHistoryPoint[];
  summary: InvestmentHistorySummary;
  period: InvestmentHistoryPeriod;
  onPeriodChange: (value: InvestmentHistoryPeriod) => void;
};

export type InvestmentEvolutionChartPlotProps = { points: InvestmentHistoryPoint[] };

export type InvestmentMonthlyReturnChartProps = {
  points: InvestmentHistoryPoint[];
  summary: InvestmentHistorySummary;
};

export type InvestmentMonthlyReturnChartPlotProps = { points: InvestmentHistoryPoint[] };

export type InvestmentBenchmarkChartProps = {
  points: InvestmentBenchmarkPoint[];
  benchmarks: InvestmentBenchmarkRates;
};

export type InvestmentBenchmarkChartPlotProps = {
  points: InvestmentBenchmarkPoint[];
  available: InvestmentBenchmarkKey[];
};

export type InvestmentChartTooltipContentProps = ComponentProps<typeof ChartTooltipContent> & {
  renderValue: (value: number, payload: Record<string, unknown>) => ReactNode;
};
