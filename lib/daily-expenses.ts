import type {
  DailyExpenseDay,
  DailyExpenseEntry,
  DailyExpenseMap,
} from "@/lib/interfaces/daily-expenses";

function utcDate(year: number, month: number, day: number) {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
}

function compareEntries(left: DailyExpenseEntry, right: DailyExpenseEntry) {
  return left.date.localeCompare(right.date)
    || left.description.localeCompare(right.description)
    || left.source.localeCompare(right.source)
    || left.id.localeCompare(right.id);
}

function sumDirection(entries: DailyExpenseEntry[], direction: DailyExpenseEntry["direction"]) {
  return entries.reduce((sum, entry) => sum + (entry.direction === direction ? entry.amountCents : 0), 0);
}

export function buildDailyExpenseMap(period: string, sourceEntries: DailyExpenseEntry[]): DailyExpenseMap {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new Error("Mês inválido.");

  const [year, month] = period.split("-").map(Number);
  const firstDay = utcDate(year, month, 1);
  const daysInMonth = utcDate(year, month + 1, 0).getUTCDate();
  const monthPrefix = `${period}-`;
  const entries = sourceEntries
    .filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
      && entry.date.startsWith(monthPrefix)
      && Number(entry.date.slice(-2)) > 0
      && Number(entry.date.slice(-2)) <= daysInMonth
      && entry.amountCents > 0)
    .map((entry) => ({ ...entry }))
    .sort(compareEntries);
  const entriesByDate = new Map<string, DailyExpenseEntry[]>();

  for (const entry of entries) {
    const dayEntries = entriesByDate.get(entry.date) ?? [];
    dayEntries.push(entry);
    entriesByDate.set(entry.date, dayEntries);
  }

  const days: DailyExpenseDay[] = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const date = `${period}-${String(dayNumber).padStart(2, "0")}`;
    const dayEntries = entriesByDate.get(date) ?? [];
    const expenseCents = sumDirection(dayEntries, "expense");
    const creditCents = sumDirection(dayEntries, "credit");
    return { date, dayNumber, expenseCents, creditCents, netCents: expenseCents - creditCents, intensity: 0, entries: dayEntries };
  });

  const maximumExpenseCents = Math.max(0, ...days.map((day) => day.expenseCents));
  for (const day of days) {
    day.intensity = maximumExpenseCents === 0 || day.expenseCents === 0
      ? 0
      : Math.max(1, Math.ceil(day.expenseCents / maximumExpenseCents * 4));
  }

  const offset = (firstDay.getUTCDay() + 6) % 7;
  const calendar: Array<DailyExpenseDay | null> = [
    ...Array.from({ length: offset }, () => null),
    ...days,
  ];
  while (calendar.length % 7 !== 0) calendar.push(null);

  const expenseCents = sumDirection(entries, "expense");
  const creditCents = sumDirection(entries, "credit");
  return { period, expenseCents, creditCents, netCents: expenseCents - creditCents, entries, days, calendar };
}
