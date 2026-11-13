import type { BankReserveSplit } from "@/lib/interfaces/bank-reserve";
import type { ReserveContributionPlan } from "@/lib/interfaces/reserve-contribution";
import type { InvestmentMovementDirection } from "@/lib/investment-projection";
import type { ReactNode } from "react";

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
  /** `manual` estimates from a checkpoint and a rate; `bank` reads the amount set over the linked positions. */
  source: "manual" | "bank";
  bank: BankReserveSplit | null;
  reserveAmountCents?: number | null;
  contribution: ReserveContributionPlan;
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
  monetary?: boolean;
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
  value: ReactNode;
  detail: ReactNode;
  tone: "cyan" | "sky" | "amber";
};

export type InvestmentGrowthSummaryMetricProps = {
  label: string;
  value: ReactNode;
  tone: "cyan" | "amber" | "emerald";
};

export type InvestmentContributionChartProps = {
  history: InvestmentContributionHistory;
};

export type InvestmentHistoryMetricProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone: "cyan" | "sky" | "amber";
};

/** The projection exactly as the server returns it, in either reserve mode. */
export type ReserveProjection = NonNullable<Awaited<ReturnType<typeof import("@/lib/server/investments/projection").getInvestmentProjection>>>;

export type InvestmentMovementMonth = InvestmentContributionHistory["points"][number];

export type InvestmentMovementListProps = { history: InvestmentContributionHistory };

export type InvestmentMovementListRowProps = { point: InvestmentMovementMonth };
