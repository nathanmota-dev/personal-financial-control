export type DayOfMonthAdjustment = {
  /** Month the occurrence belongs to, as `YYYY-MM`. */
  month: string;
  /** Date the occurrence falls on, as `YYYY-MM-DD`. */
  date: string;
};

export type DayOfMonthGridProps = {
  selectedDay: number;
  onSelectDay: (day: number) => void;
  className?: string;
};

export type DayOfMonthPickerFieldProps = {
  id?: string;
  name: string;
  defaultDay: number;
  /** First month of the recurrence, as `YYYY-MM`; the preview never starts before the current month. */
  startMonth: string;
  className?: string;
};

export type DayOfMonthAdjustmentsProps = {
  day: number;
  adjustments: DayOfMonthAdjustment[];
};
