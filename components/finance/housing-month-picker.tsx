"use client";

import { useRouter } from "next/navigation";

import { MonthPickerField } from "@/components/ui/month-picker-field";
import type { HousingMonthPickerProps } from "@/lib/interfaces/housing";

export function HousingMonthPicker({ month }: HousingMonthPickerProps) {
  const router = useRouter();
  return (
    <MonthPickerField
      id="housing-month"
      name="month"
      month={month}
      align="end"
      placeholder="Mês"
      className="w-full sm:w-[188px]"
      onMonthChange={(next) => next && router.push(`/housing?month=${next}`)}
    />
  );
}
