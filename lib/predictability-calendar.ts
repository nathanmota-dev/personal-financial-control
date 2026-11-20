import { getDay, parseISO } from "date-fns";

import type {
  PredictabilityCalendarCell,
  PredictabilityCalendarWeek,
  PredictabilityDay,
} from "@/lib/interfaces/predictability";

export const predictabilityWeekdayLabels = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

/** Lays the cycle out in Sunday-first weeks; the cycle usually spans two months. */
export function buildPredictabilityCalendarWeeks(days: PredictabilityDay[]): PredictabilityCalendarWeek[] {
  if (!days.length) {
    return [];
  }

  const leading = getDay(parseISO(days[0].date));
  const cells: PredictabilityCalendarCell[] = [
    ...Array.from({ length: leading }, (_, index) => ({ key: `before-${index}`, day: null })),
    ...days.map((day) => ({ key: day.date, day })),
  ];
  const trailing = (7 - (cells.length % 7)) % 7;
  cells.push(...Array.from({ length: trailing }, (_, index) => ({ key: `after-${index}`, day: null })));

  return Array.from({ length: cells.length / 7 }, (_, index) => {
    const weekCells = cells.slice(index * 7, index * 7 + 7);
    return { key: weekCells.find((cell) => cell.day)?.key ?? `week-${index}`, cells: weekCells };
  });
}
