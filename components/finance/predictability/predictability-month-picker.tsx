"use client";

import { usePathname, useRouter } from "next/navigation";

import type { PredictabilityMonthPickerProps } from "@/app/interfaces/predictability";
import { MonthPickerField } from "@/components/ui/month-picker-field";

export function PredictabilityMonthPicker({ month }: PredictabilityMonthPickerProps) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <MonthPickerField
      id="predictability-month"
      month={month}
      align="end"
      placeholder="Mês"
      className="w-full sm:w-[188px]"
      onMonthChange={(next) => next && router.replace(`${pathname}?${new URLSearchParams({ month: next })}`)}
    />
  );
}
