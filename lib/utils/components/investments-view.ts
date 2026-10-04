import { addMonths,differenceInCalendarMonths,startOfMonth } from "date-fns";

export const SIMULATION_MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export function formatSimulationMonth(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function getDefaultSimulationDate(currentDate: Date, minimumDate: Date) {
  const monthInOneYear = addMonths(startOfMonth(currentDate), 12);

  return monthInOneYear > minimumDate ? monthInOneYear : minimumDate;
}

export function getSimulationMonthCount(date: Date, referenceMonth: Date) {
  return differenceInCalendarMonths(startOfMonth(date), referenceMonth) + 1;
}

export function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}
