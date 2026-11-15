import type { ReactNode } from "react";

export type InterestRatePeriod = "monthly" | "annual";

export type InvestmentPeriodUnit = "months" | "years";

export type CompoundInterestFormValues = {
  initialAmount: string;
  monthlyContribution: string;
  interestRate: string;
  interestRatePeriod: InterestRatePeriod;
  investmentPeriod: string;
  investmentPeriodUnit: InvestmentPeriodUnit;
};

export type CompoundInterestSimulationInput = {
  initialAmountCents: number;
  monthlyContributionCents: number;
  interestRate: number;
  interestRatePeriod: InterestRatePeriod;
  investmentPeriod: number;
  investmentPeriodUnit: InvestmentPeriodUnit;
};

export type CompoundInterestPoint = {
  month: number;
  label: string;
  balanceCents: number;
  investedCents: number;
  interestCents: number;
};

export type CompoundInterestSimulation = {
  input: CompoundInterestSimulationInput;
  totalBalanceCents: number;
  totalInvestedCents: number;
  totalInterestCents: number;
  monthlyRate: number;
  points: CompoundInterestPoint[];
};

export type CompoundInterestFormProps = {
  values: CompoundInterestFormValues;
  error: string | null;
  onChange: (values: CompoundInterestFormValues) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export type CurrencyInputProps = {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
};

export type CompoundInterestResultsProps = {
  simulation: CompoundInterestSimulation;
};

export type CompoundInterestChartProps = {
  points: CompoundInterestPoint[];
};

export type CompoundInterestTableProps = {
  points: CompoundInterestPoint[];
};

export type CalculatorCatalogCardProps = {
  href: string;
  title: string;
  description: string;
  badge: string;
  illustrationSrc: string;
  /** Results the calculator answers, listed on the card. */
  highlights: string[];
};

export type CalculatorFormCardProps = {
  illustrationSrc: string;
  title: string;
  description: string;
  children: ReactNode;
};

export type CalculatorEmptyResultProps = {
  illustrationSrc: string;
  description: string;
};

export type CalculatorSplitSegment = {
  label: string;
  cents: number;
  /** Background utility of the bar segment and of the legend dot. */
  colorClassName: string;
  hint?: ReactNode;
};

export type CalculatorSplitBarProps = {
  segments: CalculatorSplitSegment[];
};

export type CompoundInterestSummaryProps = {
  simulation: CompoundInterestSimulation;
};
