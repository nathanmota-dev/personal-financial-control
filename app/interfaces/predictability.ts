import type { ReactNode } from "react";

import type {
  PredictabilityAlert,
  PredictabilityAllocation,
  PredictabilityBudgetItem,
  PredictabilityCalendarCell,
  PredictabilityCycle,
  PredictabilityDay,
  PredictabilityDayStatus,
  PredictabilityExpense,
  PredictabilityResult,
  PredictabilitySummary,
} from "@/lib/interfaces/predictability";

export type PredictabilityViewProps = {
  predictability: PredictabilityResult | null;
  loadError?: string;
};

export type PredictabilityCycleNavProps = {
  cycle: PredictabilityCycle;
};

export type PredictabilityHeroProps = {
  summary: PredictabilitySummary;
  cycle: PredictabilityCycle;
};

export type PredictabilityBreakdownProps = {
  summary: PredictabilitySummary;
  budgetItems: PredictabilityBudgetItem[];
};

export type PredictabilityBudgetRowProps = {
  item: PredictabilityBudgetItem;
};

export type PredictabilityAlertsProps = {
  alerts: PredictabilityAlert[];
};

export type PredictabilityDaySelectProps = {
  days: PredictabilityDay[];
  onSelectDay: (day: PredictabilityDay) => void;
};

export type PredictabilityExplorerProps = {
  days: PredictabilityDay[];
  overflowCents: number;
};

export type PredictabilityCalendarDayProps = {
  cell: PredictabilityCalendarCell;
  onSelectDay: (day: PredictabilityDay) => void;
};

export type PredictabilityTableProps = PredictabilityDaySelectProps & {
  overflowCents: number;
};

export type PredictabilityDayItemProps = {
  day: PredictabilityDay;
  onSelectDay: (day: PredictabilityDay) => void;
};

export type PredictabilityStatusChipProps = {
  status: PredictabilityDayStatus;
};

export type PredictabilityDaySheetProps = {
  day: PredictabilityDay | null;
  onOpenChange: (open: boolean) => void;
};

export type PredictabilityExpenseRowProps = {
  expense: PredictabilityExpense;
};

export type PredictabilityAllocationRowProps = {
  allocation: PredictabilityAllocation;
  dayDate: string;
};

export type PredictabilityDayMetricProps = {
  label: string;
  value: ReactNode;
  className?: string;
};
