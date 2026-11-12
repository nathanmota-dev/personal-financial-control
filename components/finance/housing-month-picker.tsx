"use client";

import { useRouter } from "next/navigation";

import { RecurringMonthPicker } from "@/components/finance/recurring-month-picker";
import type { HousingMonthPickerProps } from "@/lib/interfaces/housing";

export function HousingMonthPicker({ month }: HousingMonthPickerProps) {
  const router = useRouter();
  return (
    <RecurringMonthPicker
      id="housing-month"
      name="month"
      month={month}
      placeholder="Mês"
      className="w-44"
      onMonthChange={(next) => next && router.push(`/housing?month=${next}`)}
    />
  );
}
