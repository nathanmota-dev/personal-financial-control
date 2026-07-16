import type { ReactNode } from "react";
import type { InvestmentMovementDirection } from "@/lib/investment-projection";

export type InvestmentMovementRow = {
  id: string;
  date: string;
  amountCents: number;
  direction: InvestmentMovementDirection;
  description?: string;
  source?: "transaction" | "recurring";
  createdAt?: string;
};

export type InvestmentProjection = {
  id: string;
  checkpointBalanceCents: number;
  expectedMonthlyRateBps: number;
  checkpointDate: string;
  currentBalanceCents: number;
  asOfDate: string;
  estimatedInterestCents: number;
  contributionCents: number;
  withdrawalCents: number;
  netMovementCents: number;
  projection: Record<number, number>;
  plannedMovements: InvestmentMovementRow[];
  nextContributionDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type InvestmentContributionHistory = {
  totalContributionCents: number;
  totalWithdrawalCents: number;
  points: Array<{
    month: string;
    monthlyContributionCents: number;
    monthlyWithdrawalCents: number;
    cumulativeNetMovementCents: number;
  }>;
};

export type InvestmentAccountOption = {
  id: string;
  name: string;
};

export type InvestmentCategoryOption = InvestmentAccountOption;

export type InvestmentsViewProps = {
  projection: InvestmentProjection | null;
  contributionHistory: InvestmentContributionHistory;
};

export type InvestmentGrowthChartProps = {
  currentBalanceCents: number;
  expectedMonthlyRateBps: number;
  referenceDate: string;
  movements: InvestmentMovementRow[];
  months: number;
  periodLabel: string;
};

export type InvestmentPortfolioSettingsProps = {
  projection: InvestmentProjection | null;
};

export type InvestmentFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
};

export type InvestmentSummaryCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "cyan" | "sky" | "amber";
};

export type InvestmentGrowthSummaryMetricProps = {
  label: string;
  value: string;
  tone: "cyan" | "amber" | "emerald";
};

export type InvestmentContributionChartProps = {
  history: InvestmentContributionHistory;
};

export type InvestmentHistoryMetricProps = {
  label: string;
  value: string;
  detail?: string;
  tone: "cyan" | "sky" | "amber";
};
