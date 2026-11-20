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
  /** Any date inside the wanted cycle; defaults to today. */
  reference?: string;
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

export type PredictabilityCalendarCell = {
  key: string;
  day: PredictabilityDay | null;
};

export type PredictabilityCalendarWeek = {
  key: string;
  cells: PredictabilityCalendarCell[];
};
