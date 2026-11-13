import type { PopoverContent } from "@/components/ui/popover";

export type DatePickerFieldProps = {
  id?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  clearable?: boolean;
  required?: boolean;
  /** Earliest selectable date, as `YYYY-MM-DD`. */
  min?: string;
  /** Latest selectable date, as `YYYY-MM-DD`. */
  max?: string;
  onDateChange?: (date: string | undefined) => void;
  className?: string;
  align?: React.ComponentProps<typeof PopoverContent>["align"];
};

export type YearPickerFieldProps = {
  id?: string;
  /** Selected year, as `YYYY`. */
  value?: string;
  placeholder?: string;
  /** Earliest selectable year. Defaults to the current year. */
  minYear?: number;
  /** Latest selectable year. Unlimited when omitted. */
  maxYear?: number;
  onYearChange: (year: string) => void;
  className?: string;
  align?: React.ComponentProps<typeof PopoverContent>["align"];
};

export type YearGridProps = {
  selectedYear?: number;
  minYear: number;
  maxYear?: number;
  onYearSelect: (year: number) => void;
  className?: string;
};

export type MonthPickerFieldProps = {
  id?: string;
  name?: string;
  value?: string;
  /** @deprecated Use value. Kept for the existing month navigation controls. */
  month?: string;
  placeholder?: string;
  clearable?: boolean;
  required?: boolean;
  onMonthChange?: (month: string | undefined) => void;
  className?: string;
  align?: React.ComponentProps<typeof PopoverContent>["align"];
};
