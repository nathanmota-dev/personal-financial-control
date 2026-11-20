import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

import type {
  PredictabilityAlert,
  PredictabilityAllocation,
  PredictabilityAllocationResult,
  PredictabilityCalculationInput,
  PredictabilityCycle,
  PredictabilityDay,
  PredictabilityDayStatus,
  PredictabilityExpense,
  PredictabilityResult,
  PredictabilitySummary,
} from "@/lib/interfaces/predictability";
import { addMonthsToMonth, buildDateInMonth } from "@/lib/utils/finance-month";

export function shiftDate(date: string, amount: number) {
  return format(addDays(parseISO(date), amount), "yyyy-MM-dd");
}

export function listCycleDates(cycle: Pick<PredictabilityCycle, "start" | "end">) {
  const total = differenceInCalendarDays(parseISO(cycle.end), parseISO(cycle.start)) + 1;
  return Array.from({ length: Math.max(total, 0) }, (_, index) => shiftDate(cycle.start, index));
}

function buildCycle(start: string, nextStart: string, previousStart: string, anchorDay: number | null): PredictabilityCycle {
  const end = shiftDate(nextStart, -1);
  return {
    start,
    end,
    dayCount: listCycleDates({ start, end }).length,
    anchorDay,
    previousStart,
    nextStart,
  };
}

/** Cycle that contains `reference`: from the pay day to the eve of the next one, or the calendar month without a pay day. */
export function resolveCycle(anchorDay: number | null, reference: string): PredictabilityCycle {
  const month = reference.slice(0, 7);

  if (!anchorDay) {
    return buildCycle(
      `${month}-01`,
      `${addMonthsToMonth(month, 1)}-01`,
      `${addMonthsToMonth(month, -1)}-01`,
      null
    );
  }

  const candidate = buildDateInMonth(month, anchorDay);
  const startMonth = candidate <= reference ? month : addMonthsToMonth(month, -1);

  return buildCycle(
    buildDateInMonth(startMonth, anchorDay),
    buildDateInMonth(addMonthsToMonth(startMonth, 1), anchorDay),
    buildDateInMonth(addMonthsToMonth(startMonth, -1), anchorDay),
    anchorDay
  );
}

/** Splits the cycle budget in whole cents; the first days take the leftover cents so the sum stays exact. */
export function splitAllowance(budgetCents: number, dayCount: number) {
  if (dayCount <= 0) {
    return [];
  }

  if (budgetCents <= 0) {
    return Array.from({ length: dayCount }, () => 0);
  }

  const base = Math.floor(budgetCents / dayCount);
  const leftover = budgetCents - base * dayCount;

  return Array.from({ length: dayCount }, (_, index) => base + (index < leftover ? 1 : 0));
}

function take(
  remaining: number[],
  allocations: PredictabilityAllocation[][],
  index: number,
  expense: PredictabilityExpense,
  pendingCents: number
) {
  const cents = Math.min(remaining[index], pendingCents);

  if (cents <= 0) {
    return pendingCents;
  }

  remaining[index] -= cents;
  allocations[index].push({
    transactionId: expense.id,
    description: expense.description,
    transactionDate: expense.date,
    cents,
  });

  return pendingCents - cents;
}

function consume(
  state: PredictabilityAllocationResult,
  dayIndex: number,
  expense: PredictabilityExpense
) {
  let pending = expense.amountCents;

  for (let index = dayIndex; index < state.remainingCents.length && pending > 0; index += 1) {
    pending = take(state.remainingCents, state.allocations, index, expense, pending);
  }

  for (let index = dayIndex - 1; index >= 0 && pending > 0; index -= 1) {
    pending = take(state.remainingCents, state.allocations, index, expense, pending);
  }

  state.overflowCents += pending;
}

function release(
  state: PredictabilityAllocationResult,
  allowance: number[],
  expense: PredictabilityExpense
) {
  let credit = -expense.amountCents;
  const fromOverflow = Math.min(state.overflowCents, credit);
  state.overflowCents -= fromOverflow;
  credit -= fromOverflow;

  for (let index = allowance.length - 1; index >= 0 && credit > 0; index -= 1) {
    const cents = Math.min(allowance[index] - state.remainingCents[index], credit);

    if (cents <= 0) {
      continue;
    }

    state.remainingCents[index] += cents;
    state.allocations[index].push({
      transactionId: expense.id,
      description: expense.description,
      transactionDate: expense.date,
      cents: -cents,
    });
    credit -= cents;
  }
}

/**
 * Each expense consumes its own day and the following ones, then the earlier days that still
 * have money, and only then overflows the cycle. Refunds give the money back in reverse.
 */
export function allocateExpenses(
  dates: string[],
  allowance: number[],
  expenses: PredictabilityExpense[]
): PredictabilityAllocationResult {
  const state: PredictabilityAllocationResult = {
    remainingCents: [...allowance],
    allocations: dates.map(() => []),
    overflowCents: 0,
  };
  const indexByDate = new Map(dates.map((date, index) => [date, index]));

  for (const expense of expenses) {
    const dayIndex = indexByDate.get(expense.date);

    if (dayIndex === undefined || expense.amountCents === 0) {
      continue;
    }

    if (expense.amountCents > 0) {
      consume(state, dayIndex, expense);
    } else {
      release(state, allowance, expense);
    }
  }

  return state;
}

function resolveDayStatus(allowanceCents: number, remainingCents: number): PredictabilityDayStatus {
  if (remainingCents <= 0) {
    return "consumed";
  }

  return remainingCents >= allowanceCents ? "free" : "partial";
}

function sumAmounts(items: Array<{ amountCents: number }>) {
  return items.reduce((total, item) => total + item.amountCents, 0);
}

function buildAlerts(summary: Omit<PredictabilitySummary, "alerts">, cycle: PredictabilityCycle) {
  const alerts: PredictabilityAlert[] = [];

  if (!cycle.anchorDay || summary.incomeCents <= 0) {
    alerts.push({ code: "NO_RECURRING_INCOME" });
  }

  if (summary.incomeCents > 0 && summary.budgetCents < 0) {
    alerts.push({ code: "FIXED_EXCEED_INCOME", amountCents: -summary.budgetCents });
  }

  if (summary.overflowCents > 0) {
    alerts.push({ code: "CYCLE_OVERFLOW", amountCents: summary.overflowCents });
  }

  return alerts;
}

export function calculatePredictability(
  input: PredictabilityCalculationInput
): PredictabilityResult {
  const dates = listCycleDates(input.cycle);
  const incomeCents = sumAmounts(input.budgetItems.filter((item) => item.kind === "income"));
  const fixedCents = sumAmounts(input.budgetItems.filter((item) => item.kind === "fixed"));
  const creditCardCents = sumAmounts(input.budgetItems.filter((item) => item.kind === "credit_card"));
  const budgetCents = incomeCents - fixedCents - creditCardCents;
  const allowance = splitAllowance(budgetCents, dates.length);
  const expenses = [...input.expenses].sort((left, right) => left.date.localeCompare(right.date));
  const allocation = allocateExpenses(dates, allowance, expenses);
  const days: PredictabilityDay[] = dates.map((date, index) => ({
    date,
    allowanceCents: allowance[index],
    spentCents: sumAmounts(expenses.filter((expense) => expense.date === date)),
    consumedCents: allowance[index] - allocation.remainingCents[index],
    remainingCents: allocation.remainingCents[index],
    status: resolveDayStatus(allowance[index], allocation.remainingCents[index]),
    isPast: date < input.today,
    isToday: date === input.today,
    expenses: expenses.filter((expense) => expense.date === date),
    allocations: allocation.allocations[index],
  }));
  const today = days.find((day) => day.isToday);
  const summaryWithoutAlerts = {
    incomeCents,
    fixedCents,
    creditCardCents,
    budgetCents,
    dailyAllowanceCents: allowance[allowance.length - 1] ?? 0,
    spentCents: sumAmounts(expenses),
    remainingCents: sumAmounts(days.map((day) => ({ amountCents: day.remainingCents }))),
    availableTodayCents: today ? today.remainingCents : null,
    overflowCents: allocation.overflowCents,
    freeDays: days.filter((day) => !day.isPast && day.status === "free").length,
    consumedDays: days.filter((day) => day.status === "consumed").length,
  };

  return {
    today: input.today,
    cycle: input.cycle,
    summary: { ...summaryWithoutAlerts, alerts: buildAlerts(summaryWithoutAlerts, input.cycle) },
    days,
    budgetItems: input.budgetItems,
  };
}
