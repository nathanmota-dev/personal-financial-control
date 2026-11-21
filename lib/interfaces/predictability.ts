export type PredictabilityCycle = {
  start: string;
  end: string;
  dayCount: number;
  anchorDay: number | null;
  previousStart: string;
  nextStart: string;
};

export type PredictabilityExpense = {
  id: string;
  date: string;
  description: string;
  amountCents: number;
  accountName?: string | null;
  categoryName?: string | null;
};

export type PredictabilityAllocation = {
  transactionId: string;
  description: string;
  transactionDate: string;
  cents: number;
};

export type PredictabilityDayStatus = "free" | "partial" | "consumed";

export type PredictabilityDay = {
  date: string;
  allowanceCents: number;
  spentCents: number;
  consumedCents: number;
  remainingCents: number;
  status: PredictabilityDayStatus;
  isPast: boolean;
  isToday: boolean;
  expenses: PredictabilityExpense[];
  allocations: PredictabilityAllocation[];
};

export type PredictabilityBudgetItemKind = "income" | "fixed" | "credit_card";

export type PredictabilityBudgetItem = {
  id: string;
  kind: PredictabilityBudgetItemKind;
  description: string;
  date: string;
  amountCents: number;
  accountName?: string | null;
};

export type PredictabilityAlertCode =
  | "NO_RECURRING_INCOME"
  | "FIXED_EXCEED_INCOME"
  | "CYCLE_OVERFLOW";

export type PredictabilityAlert = {
  code: PredictabilityAlertCode;
  amountCents?: number;
};

export type PredictabilitySummary = {
  incomeCents: number;
  fixedCents: number;
  creditCardCents: number;
  budgetCents: number;
  dailyAllowanceCents: number;
  spentCents: number;
  remainingCents: number;
  availableTodayCents: number | null;
  overflowCents: number;
  freeDays: number;
  consumedDays: number;
  alerts: PredictabilityAlert[];
};

export type PredictabilityResult = {
  today: string;
  cycle: PredictabilityCycle;
  summary: PredictabilitySummary;
  days: PredictabilityDay[];
  budgetItems: PredictabilityBudgetItem[];
};

export type PredictabilityRequest = {
  today: string;
  /** Month (YYYY-MM) the wanted cycle starts in, on the pay day; defaults to the cycle containing today. */
  month?: string;
};

export type PredictabilityCalculationInput = {
  today: string;
  cycle: PredictabilityCycle;
  budgetItems: PredictabilityBudgetItem[];
  expenses: PredictabilityExpense[];
};

export type PredictabilityAllocationResult = {
  remainingCents: number[];
  allocations: PredictabilityAllocation[][];
  overflowCents: number;
};

/** A purchase the user is considering; it is never saved. */
export type PredictabilitySimulatedPurchase = {
  date: string;
  amountCents: number;
  description: string;
};

export type PredictabilitySimulationImpact = {
  purchase: PredictabilitySimulatedPurchase;
  /** Cents the purchase takes from each day it reaches, in cycle order. */
  consumedByDate: Record<string, number>;
  affectedDates: string[];
  remainingBeforeCents: number;
  remainingAfterCents: number;
  freeDaysBefore: number;
  freeDaysAfter: number;
  /** Part of the purchase that no day of the cycle can cover. */
  overflowAddedCents: number;
};

export type PredictabilitySimulation = {
  result: PredictabilityResult;
  impact: PredictabilitySimulationImpact;
};

export type PredictabilityCalendarCell = {
  key: string;
  day: PredictabilityDay | null;
};

export type PredictabilityCalendarWeek = {
  key: string;
  cells: PredictabilityCalendarCell[];
};
