export type ProjectedBalancePeriod =
  | "next_income"
  | "end_of_month"
  | "next_30_days"
  | "next_60_days"
  | "next_90_days"
  | "custom";

export type ProjectionStatus = "safe" | "warning" | "negative";

export type ProjectionEventSource =
  | "transaction"
  | "recurring"
  | "credit_card"
  | "investment"
  | "transfer";

export type ProjectionEventType =
  | "income"
  | "expense"
  | "investment"
  | "credit_card"
  | "transfer";

export type ProjectionEventMetadata = Record<string, string | number | boolean | null>;

export type ProjectionEvent = {
  id: string;
  source: ProjectionEventSource;
  type: ProjectionEventType;
  description: string;
  amountCents: number;
  netImpactCents: number;
  date: string;
  accountId?: string;
  categoryId?: string;
  metadata?: ProjectionEventMetadata;
};

export type DailyProjection = {
  date: string;
  startingBalanceCents: number;
  incomeCents: number;
  expenseCents: number;
  investmentCents: number;
  creditCardCents: number;
  transferInCents: number;
  transferOutCents: number;
  netChangeCents: number;
  projectedBalanceCents: number;
  availablePerDayCents: number;
  status: ProjectionStatus;
  events: ProjectionEvent[];
};

export type ProjectionSummaryAlertCode =
  | "CURRENT_BALANCE_NEGATIVE"
  | "PROJECTED_BALANCE_NEGATIVE"
  | "BELOW_MINIMUM_RESERVE"
  | "NO_FUTURE_INCOME";

export type ProjectionSummaryAlert = {
  code: ProjectionSummaryAlertCode;
  message: string;
  date?: string;
  amountCents?: number;
};

export type ProjectionSummary = {
  startDate: string;
  endDate: string;
  initialBalanceCents: number;
  finalProjectedBalanceCents: number;
  minimumProjectedBalanceCents: number;
  minimumProjectedBalanceDate: string;
  availablePerDayCents: number;
  minimumReserveCents: number;
  nextIncomeDate: string | null;
  firstNegativeDate: string | null;
  firstWarningDate: string | null;
  status: ProjectionStatus;
  alerts: ProjectionSummaryAlert[];
};

export type ProjectionCalculationInput = {
  startDate: string;
  endDate: string;
  initialBalanceCents: number;
  minimumReserveCents: number;
  events: ProjectionEvent[];
};

export type ProjectionCalculationResult = {
  summary: ProjectionSummary;
  daily: DailyProjection[];
};
