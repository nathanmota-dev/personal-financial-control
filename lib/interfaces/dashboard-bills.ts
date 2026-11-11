export type DashboardBill = {
  id: string;
  description: string;
  amountCents: number;
  /** ISO date (yyyy-mm-dd) of the due day inside the current month. */
  dueDate: string;
};

export type DashboardBillDay = {
  dueDate: string;
  day: number;
  bills: DashboardBill[];
};

export type DashboardBillsData = {
  today: string;
  /** Days left in the month after today. */
  daysLeft: number;
  /** Recurring expenses of the month already paid, out of `totalCount`. */
  paidCount: number;
  totalCount: number;
  /** Unpaid bills due from today to the end of the month. */
  bills: DashboardBill[];
};

export type DashboardBillsProps = { data: DashboardBillsData };

export type DashboardBillsDayTabsProps = {
  days: DashboardBillDay[];
  selected: string;
  onSelect: (dueDate: string) => void;
};

export type DashboardBillsListProps = {
  bills: DashboardBill[];
  disabled?: boolean;
  onPay: (id: string) => void;
};

export type BuildDashboardBillsInput = {
  today: string;
  templates: {
    id: string;
    description: string;
    amountCents: number;
    dayOfMonth: number;
    startMonth: string;
    endMonth?: string | null;
  }[];
  /** Template ids already paid (posted transaction) in the month of `today`. */
  paidTemplateIds: Set<string>;
};
