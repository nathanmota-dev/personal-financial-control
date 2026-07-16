export type InvestmentMovementDirection = "contribution" | "withdrawal";

export type InvestmentMovement = {
  id: string;
  date: string;
  amountCents: number;
  direction: InvestmentMovementDirection;
  description?: string;
  source?: "transaction" | "recurring";
  createdAt?: string;
};

export type InvestmentGrowthPoint = {
  month: number;
  competenceMonth: string;
  balanceCents: number;
  principalCents: number;
  interestCents: number;
};

export type InvestmentBalanceResult = {
  balanceCents: number;
  checkpointBalanceCents: number;
  contributionCents: number;
  withdrawalCents: number;
  netMovementCents: number;
  estimatedInterestCents: number;
};

export type InvestmentBalanceInput = {
  checkpointBalanceCents: number;
  checkpointDate: string;
  expectedMonthlyRateBps: number;
  asOfDate: string;
  movements?: InvestmentMovement[];
};

export type InvestmentProjectionInput = {
  currentBalanceCents: number;
  expectedMonthlyRateBps: number;
  referenceDate: string;
  movements?: InvestmentMovement[];
  months: number;
};

export function calculateInvestmentBalance({
  checkpointBalanceCents,
  checkpointDate,
  expectedMonthlyRateBps,
  asOfDate,
  movements = [],
}: InvestmentBalanceInput): InvestmentBalanceResult {
  parseDateParts(checkpointDate);
  parseDateParts(asOfDate);

  if (asOfDate < checkpointDate) {
    throw new Error("The balance date cannot be before the checkpoint date.");
  }

  const orderedMovements = sortMovements(
    movements.filter(
      (movement) => movement.date >= checkpointDate && movement.date <= asOfDate
    )
  );
  let balanceCents = checkpointBalanceCents;
  let cursor = checkpointDate;
  let contributionCents = 0;
  let withdrawalCents = 0;

  for (const movement of orderedMovements) {
    balanceCents = accrueBalance(
      balanceCents,
      cursor,
      movement.date,
      expectedMonthlyRateBps
    );
    balanceCents += movement.direction === "contribution"
      ? movement.amountCents
      : -movement.amountCents;

    if (movement.direction === "contribution") {
      contributionCents += movement.amountCents;
    } else {
      withdrawalCents += movement.amountCents;
    }

    cursor = movement.date;
  }

  balanceCents = accrueBalance(balanceCents, cursor, asOfDate, expectedMonthlyRateBps);
  const roundedBalanceCents = Math.round(balanceCents);
  const netMovementCents = contributionCents - withdrawalCents;

  return {
    balanceCents: roundedBalanceCents,
    checkpointBalanceCents,
    contributionCents,
    withdrawalCents,
    netMovementCents,
    estimatedInterestCents: roundedBalanceCents - checkpointBalanceCents - netMovementCents,
  };
}

export function buildInvestmentGrowthSeries({
  currentBalanceCents,
  expectedMonthlyRateBps,
  referenceDate,
  movements = [],
  months,
}: InvestmentProjectionInput): InvestmentGrowthPoint[] {
  parseDateParts(referenceDate);

  if (months <= 0) {
    return [];
  }

  const orderedMovements = sortMovements(movements);
  let balanceCents = currentBalanceCents;
  let cursor = referenceDate;
  let movementIndex = 0;
  let principalCents = currentBalanceCents;
  const points: InvestmentGrowthPoint[] = [];

  for (let period = 1; period <= months; period += 1) {
    const competenceMonth = addCalendarMonths(referenceDate, period - 1);
    const periodEndExclusive = `${addCalendarMonths(`${competenceMonth}-01`, 1)}-01`;

    while (movementIndex < orderedMovements.length) {
      const movement = orderedMovements[movementIndex];

      if (movement.date < cursor) {
        movementIndex += 1;
        continue;
      }

      if (movement.date >= periodEndExclusive) {
        break;
      }

      balanceCents = accrueBalance(
        balanceCents,
        cursor,
        movement.date,
        expectedMonthlyRateBps
      );
      balanceCents += movement.direction === "contribution"
        ? movement.amountCents
        : -movement.amountCents;
      principalCents += movement.direction === "contribution"
        ? movement.amountCents
        : -movement.amountCents;
      cursor = movement.date;
      movementIndex += 1;
    }

    balanceCents = accrueBalance(
      balanceCents,
      cursor,
      periodEndExclusive,
      expectedMonthlyRateBps
    );
    cursor = periodEndExclusive;

    const roundedBalanceCents = Math.round(balanceCents);
    const roundedPrincipalCents = Math.round(principalCents);

    points.push({
      month: period,
      competenceMonth,
      balanceCents: roundedBalanceCents,
      principalCents: roundedPrincipalCents,
      interestCents: roundedBalanceCents - roundedPrincipalCents,
    });
  }

  return points;
}

export function projectCompoundBalance(input: InvestmentProjectionInput) {
  return (
    buildInvestmentGrowthSeries(input).at(-1)?.balanceCents ?? input.currentBalanceCents
  );
}

function accrueBalance(
  balanceCents: number,
  fromDate: string,
  toDate: string,
  expectedMonthlyRateBps: number
) {
  if (toDate <= fromDate || balanceCents === 0) {
    return balanceCents;
  }

  let cursor = parseUtcDate(fromDate);
  const target = parseUtcDate(toDate);
  const monthlyRate = expectedMonthlyRateBps / 10_000;

  while (cursor < target) {
    const nextMonth = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1)
    );
    const segmentEnd = nextMonth < target ? nextMonth : target;
    const elapsedDays = differenceInDays(cursor, segmentEnd);
    const daysInMonth = getDaysInMonth(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1);
    const segmentRate = Math.pow(1 + monthlyRate, elapsedDays / daysInMonth) - 1;

    balanceCents *= 1 + segmentRate;
    cursor = segmentEnd;
  }

  return balanceCents;
}

function sortMovements(movements: InvestmentMovement[]) {
  return [...movements].sort((left, right) => {
    return (
      left.date.localeCompare(right.date) ||
      (left.createdAt ?? "").localeCompare(right.createdAt ?? "") ||
      left.id.localeCompare(right.id)
    );
  });
}

function parseDateParts(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    throw new Error("Date must use YYYY-MM-DD format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const daysInMonth = getDaysInMonth(year, month);

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) {
    throw new Error("Date is not a valid calendar date.");
  }

  return { year, month, day };
}

function parseUtcDate(date: string) {
  parseDateParts(date);
  return new Date(`${date}T00:00:00.000Z`);
}

function differenceInDays(left: Date, right: Date) {
  return Math.floor((right.getTime() - left.getTime()) / 86_400_000);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addCalendarMonths(date: string, offset: number) {
  const { year, month } = parseDateParts(date);
  const resolved = new Date(Date.UTC(year, month - 1 + offset, 1));

  return `${resolved.getUTCFullYear()}-${String(resolved.getUTCMonth() + 1).padStart(2, "0")}`;
}
