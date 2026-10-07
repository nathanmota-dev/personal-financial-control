export type DailyExpenseDirection = "expense" | "credit";
export type DailyExpenseSource = "transaction" | "credit_card_charge";

export type DailyExpenseEntry = {
  id: string;
  date: string;
  description: string;
  amountCents: number;
  direction: DailyExpenseDirection;
  source: DailyExpenseSource;
  category: string;
  account: string;
  sourceHref: string;
};

export type DailyExpenseDay = {
  date: string;
  dayNumber: number;
  expenseCents: number;
  creditCents: number;
  netCents: number;
  intensity: number;
  entries: DailyExpenseEntry[];
};

export type DailyExpenseMap = {
  period: string;
  expenseCents: number;
  creditCents: number;
  netCents: number;
  entries: DailyExpenseEntry[];
  days: DailyExpenseDay[];
  calendar: Array<DailyExpenseDay | null>;
};

export type DailyExpensesViewProps = { map: DailyExpenseMap };
export type DailyExpenseCalendarProps = {
  period: string;
  calendar: DailyExpenseMap["calendar"];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};
export type DailyExpenseDetailsProps = { day: DailyExpenseDay | null };
export type DailyExpenseTableProps = {
  days: DailyExpenseDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

export type DailyExpenseMapState = {
  period: string;
  attempt: number;
  map: DailyExpenseMap | null;
  error: boolean;
};
export type DailyExpenseMapQuery = { period: string; enabled: boolean };
