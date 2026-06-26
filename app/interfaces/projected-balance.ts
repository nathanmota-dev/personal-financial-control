import type { ReactNode } from "react";

import type {
  DailyProjection,
  ProjectionEvent,
  ProjectionStatus,
  ProjectionSummary,
  ProjectionSummaryAlert,
  ProjectedBalancePeriod,
} from "@/lib/interfaces/projected-balance";

export type ProjectedBalanceAccountOption = {
  id: string;
  name: string;
  type: "checking" | "savings" | "cash";
  currentBalanceCents: number;
};

export type ProjectedBalanceCreditAccountOption = {
  id: string;
  name: string;
  creditDueDay: number;
};

export type ProjectedBalanceProjection = {
  summary: ProjectionSummary;
  daily: DailyProjection[];
};

export type ProjectedBalanceFilterState = {
  period: ProjectedBalancePeriod;
  startDate: string;
  endDate: string;
  accountId?: string;
  minimumReserveCents: number;
  includeCreditCard: boolean;
  includeInvestments: boolean;
  includeTransfers: boolean;
};

export type ProjectedBalanceViewProps = {
  projection: ProjectedBalanceProjection | null;
  accounts: ProjectedBalanceAccountOption[];
  creditAccounts: ProjectedBalanceCreditAccountOption[];
  filters: ProjectedBalanceFilterState;
  loadError?: string;
};

export type ProjectedBalanceChartPoint = {
  date: string;
  label: string;
  balance: number;
  zero: number;
  minimumReserve?: number;
  status: ProjectionStatus;
  statusLabel: string;
};

export type ProjectionFiltersProps = {
  accounts: ProjectedBalanceAccountOption[];
  creditAccounts: ProjectedBalanceCreditAccountOption[];
  filters: ProjectedBalanceFilterState;
};

export type ProjectionSummaryCardsProps = {
  summary: ProjectionSummary;
  selectedAccountName?: string;
};

export type ProjectionAlertsProps = {
  alerts: ProjectionSummaryAlert[];
};

export type ProjectedBalanceChartProps = {
  daily: DailyProjection[];
  minimumReserveCents: number;
};

export type DailyProjectionTableProps = {
  daily: DailyProjection[];
};

export type DayDetailSheetProps = {
  day: DailyProjection | null;
  onOpenChange: (open: boolean) => void;
};

export type EventRowProps = {
  event: ProjectionEvent;
};

export type MetricCardTone = "cyan" | "emerald" | "sky" | "amber" | "rose";

export type MetricCardProps = {
  label: string;
  value: string;
  description: string;
  icon: ReactNode;
  tone: MetricCardTone;
};

export type StatusBadgeProps = {
  status: ProjectionStatus;
};

export type MobileDayMetricProps = {
  label: string;
  value: string;
  className: string;
};

export type DetailMetricTone = "slate" | "cyan" | "emerald" | "sky" | "blue" | "rose";

export type DetailMetricProps = {
  label: string;
  value: string;
  tone?: DetailMetricTone;
};

export type FilterFieldProps = {
  label: string;
  children: ReactNode;
};

export type ToggleFilterProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};
