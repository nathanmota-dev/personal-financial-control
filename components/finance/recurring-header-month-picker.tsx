"use client";

import { usePathname, useRouter } from "next/navigation";

import { MonthPickerField } from "@/components/ui/month-picker-field";
import type { RecurringHeaderMonthPickerProps } from "@/lib/interfaces/recurring";

export function RecurringHeaderMonthPicker({ month }: RecurringHeaderMonthPickerProps) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <MonthPickerField
      id="recurring-month"
      name="month"
      month={month}
      align="end"
      placeholder="Mês"
      className="w-full sm:w-[188px]"
      onMonthChange={(next) => next && router.replace(`${pathname}?${new URLSearchParams({ month: next })}`)}
    />
  );
}
