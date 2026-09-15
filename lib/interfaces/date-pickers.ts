import type { PopoverContent } from "@/components/ui/popover";

export type DatePickerFieldProps = {
  id?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  clearable?: boolean;
  required?: boolean;
  onDateChange?: (date: string | undefined) => void;
  className?: string;
  align?: React.ComponentProps<typeof PopoverContent>["align"];
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
