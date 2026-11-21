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
  PredictabilitySimulatedPurchase,
  PredictabilitySimulationImpact,
  PredictabilitySummary,
} from "@/lib/interfaces/predictability";

export type PredictabilityViewProps = {
  predictability: PredictabilityResult | null;
  loadError?: string;
};

export type PredictabilityMonthPickerProps = {
  /** Month the cycle starts in (YYYY-MM). */
  month: string;
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
  /** Cents a simulated purchase takes from each affected day. */
  simulatedCentsByDate?: Record<string, number>;
};

export type PredictabilityExplorerProps = {
  predictability: PredictabilityResult;
};

export type PredictabilityCalendarDayProps = {
  cell: PredictabilityCalendarCell;
  onSelectDay: (day: PredictabilityDay) => void;
  simulatedCents?: number;
};

export type PredictabilitySimulationDialogProps = {
  predictability: Pick<PredictabilityResult, "today" | "cycle">;
  purchase: PredictabilitySimulatedPurchase | null;
  onSimulate: (purchase: PredictabilitySimulatedPurchase) => void;
};

export type PredictabilitySimulationFormProps = PredictabilitySimulationDialogProps;

export type PredictabilitySimulationBannerProps = {
  impact: PredictabilitySimulationImpact;
  onClear: () => void;
};

export type PredictabilityTableProps = PredictabilityDaySelectProps & {
  overflowCents: number;
};

export type PredictabilityDayItemProps = {
  day: PredictabilityDay;
  onSelectDay: (day: PredictabilityDay) => void;
  simulatedCents?: number;
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
