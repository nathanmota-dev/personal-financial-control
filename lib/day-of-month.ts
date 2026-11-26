import type { DayOfMonthAdjustment } from "@/lib/interfaces/day-of-month";
import { addMonthsToMonth, buildDateInMonth } from "@/lib/utils/finance-month";

export const daysOfMonth = Array.from({ length: 31 }, (_, index) => index + 1);

export function isValidDayOfMonth(day: number) {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

/** The day an occurrence falls on in `month`: the last day of the month when it is shorter. */
export function effectiveDayInMonth(month: string, dayOfMonth: number) {
  return Number(buildDateInMonth(month, dayOfMonth).slice(8));
}

/** Months, from `fromMonth` on, in which `dayOfMonth` does not exist and the occurrence moves to the last day. */
export function listDayOfMonthAdjustments(fromMonth: string, dayOfMonth: number, monthCount = 12): DayOfMonthAdjustment[] {
  return Array.from({ length: monthCount }, (_, index) => addMonthsToMonth(fromMonth, index))
    .filter((month) => effectiveDayInMonth(month, dayOfMonth) !== dayOfMonth)
    .map((month) => ({ month, date: buildDateInMonth(month, dayOfMonth) }));
}
