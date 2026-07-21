import {
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";

import type {
  DailyProjection,
  ProjectionCalendarDay,
} from "@/lib/interfaces/projected-balance";

export function getProjectionMonthRange(daily: DailyProjection[]) {
  const firstDay = daily[0]?.date;
  const lastDay = daily[daily.length - 1]?.date;

  return {
    firstMonth: firstDay?.slice(0, 7) ?? "",
    lastMonth: lastDay?.slice(0, 7) ?? "",
  };
}

export function buildProjectionCalendarDays(
  month: string,
  daily: DailyProjection[]
): ProjectionCalendarDay[] {
  const dailyByDate = new Map(daily.map((day) => [day.date, day]));
  const monthDate = parseISO(`${month}-01`);

  return eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  }).map((date) => ({
    date,
    day: dailyByDate.get(format(date, "yyyy-MM-dd")) ?? null,
  }));
}

export function getProjectionMonthFromDate(date: Date) {
  return format(date, "yyyy-MM");
}

export function isProjectionMonthInRange(
  month: string,
  firstMonth: string,
  lastMonth: string
) {
  return month >= firstMonth && month <= lastMonth;
}
