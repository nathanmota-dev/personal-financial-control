import type {
  DailyProjection,
  ProjectionCalculationInput,
  ProjectionCalculationResult,
  ProjectionEvent,
  ProjectionSimulation,
  ProjectionStatus,
  ProjectionSummaryAlert,
  ProjectedBalancePeriod,
} from "@/lib/interfaces/projected-balance";

export const projectedBalancePeriods = [
  "next_income",
  "end_of_month",
  "next_30_days",
  "next_60_days",
  "next_90_days",
  "custom",
] as const satisfies readonly ProjectedBalancePeriod[];

export const projectionStatuses = [
  "safe",
  "warning",
  "negative",
] as const satisfies readonly ProjectionStatus[];

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, amount: number) {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDate(date);
}

function listDays(startDate: string, endDate: string) {
  const days: string[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days;
}

function sortEvents(left: ProjectionEvent, right: ProjectionEvent) {
  return (
    left.date.localeCompare(right.date) ||
    left.source.localeCompare(right.source) ||
    left.description.localeCompare(right.description) ||
    left.id.localeCompare(right.id)
  );
}

function resolveStatus(projectedBalanceCents: number, minimumReserveCents: number) {
  if (projectedBalanceCents < 0) {
    return "negative" as const;
  }

  if (projectedBalanceCents < minimumReserveCents) {
    return "warning" as const;
  }

  return "safe" as const;
}

function sumEvents(events: ProjectionEvent[]) {
  return events.reduce(
    (totals, event) => {
      if (event.type === "income") {
        totals.incomeCents += event.amountCents;
      }

      if (event.type === "expense") {
        totals.expenseCents += event.amountCents;
      }

      if (event.type === "investment") {
        if (event.metadata?.direction === "withdrawal") {
          totals.investmentWithdrawalCents += event.amountCents;
          totals.investmentCents -= event.amountCents;
        } else {
          totals.investmentContributionCents += event.amountCents;
          totals.investmentCents += event.amountCents;
        }
      }

      if (event.type === "credit_card") {
        totals.creditCardCents += event.amountCents;
      }

      if (event.type === "transfer" && event.netImpactCents > 0) {
        totals.transferInCents += event.amountCents;
      }

      if (event.type === "transfer" && event.netImpactCents < 0) {
        totals.transferOutCents += event.amountCents;
      }

      totals.netChangeCents += event.netImpactCents;
      return totals;
    },
    {
      incomeCents: 0,
      expenseCents: 0,
      investmentCents: 0,
      investmentContributionCents: 0,
      investmentWithdrawalCents: 0,
      creditCardCents: 0,
      transferInCents: 0,
      transferOutCents: 0,
      netChangeCents: 0,
    }
  );
}

function buildSummary(input: {
  startDate: string;
  endDate: string;
  initialBalanceCents: number;
  minimumReserveCents: number;
  daily: DailyProjection[];
  events: ProjectionEvent[];
}) {
  const finalDay = input.daily[input.daily.length - 1];
  const minimumDay = input.daily.reduce((currentMinimum, day) =>
    day.projectedBalanceCents < currentMinimum.projectedBalanceCents
      ? day
      : currentMinimum
  );
  const nextIncomeEvent =
    input.events
      .filter((event) => event.type === "income")
      .sort(sortEvents)[0] ?? null;
  const firstNegative = input.daily.find((day) => day.status === "negative") ?? null;
  const firstWarning = input.daily.find((day) => day.status === "warning") ?? null;
  const status: ProjectionStatus = firstNegative
    ? "negative"
    : firstWarning
      ? "warning"
      : "safe";
  const alerts: ProjectionSummaryAlert[] = [];

  if (input.initialBalanceCents < 0) {
    alerts.push({
      code: "CURRENT_BALANCE_NEGATIVE",
      message: "Current balance is already negative.",
      date: input.startDate,
      amountCents: input.initialBalanceCents,
    });
  }

  if (firstNegative) {
    alerts.push({
      code: "PROJECTED_BALANCE_NEGATIVE",
      message: "Projected balance becomes negative during the period.",
      date: firstNegative.date,
      amountCents: firstNegative.projectedBalanceCents,
    });
  }

  if (firstWarning && !firstNegative) {
    alerts.push({
      code: "BELOW_MINIMUM_RESERVE",
      message: "Projected balance goes below the configured minimum reserve.",
      date: firstWarning.date,
      amountCents: firstWarning.projectedBalanceCents,
    });
  }

  if (!nextIncomeEvent) {
    alerts.push({
      code: "NO_FUTURE_INCOME",
      message: "No future income was found in the projection period.",
    });
  }

  return {
    startDate: input.startDate,
    endDate: input.endDate,
    initialBalanceCents: input.initialBalanceCents,
    finalProjectedBalanceCents: finalDay.projectedBalanceCents,
    minimumProjectedBalanceCents: minimumDay.projectedBalanceCents,
    minimumProjectedBalanceDate: minimumDay.date,
    availablePerDayCents: input.daily[0]?.availablePerDayCents ?? 0,
    minimumReserveCents: input.minimumReserveCents,
    nextIncomeDate: nextIncomeEvent?.date ?? null,
    firstNegativeDate: firstNegative?.date ?? null,
    firstWarningDate: firstWarning?.date ?? null,
    status,
    alerts,
  };
}

export function calculateDailyProjection(
  input: ProjectionCalculationInput
): ProjectionCalculationResult {
  const days = listDays(input.startDate, input.endDate);
  const events = input.events
    .filter((event) => event.date >= input.startDate && event.date <= input.endDate)
    .sort(sortEvents);
  const eventsByDate = new Map<string, ProjectionEvent[]>();

  for (const event of events) {
    eventsByDate.set(event.date, [...(eventsByDate.get(event.date) ?? []), event]);
  }

  const dailyNetChanges = days.map((date) =>
    sumEvents(eventsByDate.get(date) ?? []).netChangeCents
  );
  const futureNetChanges = dailyNetChanges.reduceRight<number[]>((suffixes, netChange, index) => {
    suffixes[index] = netChange + (suffixes[index + 1] ?? 0);
    return suffixes;
  }, []);
  const daily: DailyProjection[] = [];
  let balance = input.initialBalanceCents;

  for (const [index, date] of days.entries()) {
    const dayEvents = eventsByDate.get(date) ?? [];
    const startingBalanceCents = balance;
    const totals = sumEvents(dayEvents);
    balance += totals.netChangeCents;

    const remainingDays = days.length - index;
    const futureNetAfterToday = futureNetChanges[index + 1] ?? 0;
    const safeAvailableCents = balance + futureNetAfterToday - input.minimumReserveCents;

    daily.push({
      date,
      startingBalanceCents,
      incomeCents: totals.incomeCents,
      expenseCents: totals.expenseCents,
      investmentCents: totals.investmentCents,
      investmentContributionCents: totals.investmentContributionCents,
      investmentWithdrawalCents: totals.investmentWithdrawalCents,
      creditCardCents: totals.creditCardCents,
      transferInCents: totals.transferInCents,
      transferOutCents: totals.transferOutCents,
      netChangeCents: totals.netChangeCents,
      projectedBalanceCents: balance,
      availablePerDayCents: Math.floor(safeAvailableCents / remainingDays),
      status: resolveStatus(balance, input.minimumReserveCents),
      events: dayEvents,
    });
  }

  return {
    summary: buildSummary({
      startDate: input.startDate,
      endDate: input.endDate,
      initialBalanceCents: input.initialBalanceCents,
      minimumReserveCents: input.minimumReserveCents,
      daily,
      events,
    }),
    daily,
  };
}

export function createProjectionSimulationEvent(
  simulation: ProjectionSimulation
): ProjectionEvent {
  return {
    id: `simulation:${simulation.id}`,
    source: "simulation",
    type: "expense",
    description: simulation.description,
    amountCents: simulation.amountCents,
    netImpactCents: -simulation.amountCents,
    date: simulation.date,
    accountId: simulation.accountId,
    metadata: {
      simulationId: simulation.id,
      accountName: simulation.accountName,
      categoryName: "Simulação",
    },
  };
}

export function recalculateProjectionWithSimulations(
  projection: ProjectionCalculationResult,
  simulations: ProjectionSimulation[]
): ProjectionCalculationResult {
  const baseEvents = projection.daily.flatMap((day) => day.events);

  return calculateDailyProjection({
    startDate: projection.summary.startDate,
    endDate: projection.summary.endDate,
    initialBalanceCents: projection.summary.initialBalanceCents,
    minimumReserveCents: projection.summary.minimumReserveCents,
    events: [
      ...baseEvents,
      ...simulations.map(createProjectionSimulationEvent),
    ],
  });
}
