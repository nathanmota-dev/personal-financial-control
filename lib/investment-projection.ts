export type InvestmentGrowthPoint = {
  month: number;
  competenceMonth: string;
  balanceCents: number;
  principalCents: number;
  interestCents: number;
};

type InvestmentProjectionInput = {
  currentBalanceCents: number;
  monthlyContributionCents: number;
  expectedMonthlyRateBps: number;
  referenceDate: string;
  months: number;
};

export function buildInvestmentGrowthSeries({
  currentBalanceCents,
  monthlyContributionCents,
  expectedMonthlyRateBps,
  referenceDate,
  months,
}: InvestmentProjectionInput): InvestmentGrowthPoint[] {
  const { year, month, day } = parseDateParts(referenceDate);
  const rate = expectedMonthlyRateBps / 10_000;
  const daysInReferenceMonth = getDaysInMonth(year, month);
  const remainingMonthFraction =
    (daysInReferenceMonth - day + 1) / daysInReferenceMonth;
  const firstMonthRate = Math.pow(1 + rate, remainingMonthFraction) - 1;
  let balanceCents = currentBalanceCents;
  const points: InvestmentGrowthPoint[] = [];

  for (let period = 1; period <= months; period += 1) {
    const periodRate = period === 1 ? firstMonthRate : rate;
    balanceCents *= 1 + periodRate;

    if (period > 1) {
      balanceCents += monthlyContributionCents;
    }

    const roundedBalanceCents = Math.round(balanceCents);
    const principalCents =
      currentBalanceCents + monthlyContributionCents * Math.max(period - 1, 0);

    points.push({
      month: period,
      competenceMonth: addCalendarMonths(year, month, period - 1),
      balanceCents: roundedBalanceCents,
      principalCents,
      interestCents: Math.max(roundedBalanceCents - principalCents, 0),
    });
  }

  return points;
}

export function projectCompoundBalance(input: InvestmentProjectionInput) {
  const points = buildInvestmentGrowthSeries(input);

  return points.at(-1)?.balanceCents ?? input.currentBalanceCents;
}

function parseDateParts(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    throw new Error("Reference date must use YYYY-MM-DD format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const daysInMonth = getDaysInMonth(year, month);

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) {
    throw new Error("Reference date is not a valid calendar date.");
  }

  return { year, month, day };
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addCalendarMonths(year: number, month: number, offset: number) {
  const absoluteMonth = year * 12 + month - 1 + offset;
  const resolvedYear = Math.floor(absoluteMonth / 12);
  const resolvedMonth = (absoluteMonth % 12) + 1;

  return `${resolvedYear}-${String(resolvedMonth).padStart(2, "0")}`;
}
