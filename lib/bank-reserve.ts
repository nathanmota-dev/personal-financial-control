import type { ClassAmount, RealizedYieldInput, RealizedYieldResult } from "@/lib/interfaces/bank-reserve";

const DAY_MS = 86_400_000;
const DEFAULT_WINDOW_DAYS = 30;

/** Classes the reserve is taken from first when the distribution leaves it out. Liquid, low-risk classes come first. */
const RESERVE_CLASS_ORDER: ClassAmount["assetClass"][] = ["fixed_income", "cash", "funds", "other", "real_estate", "equities", "crypto"];

function dayNumber(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

export function daysBetween(from: string, to: string) {
  return dayNumber(to) - dayNumber(from);
}

/** The amount set never exceeds what is invested, so the reserve and the portfolio always add up to the total. */
export function splitBankReserve(totalCents: number, configuredReserveCents: number | null) {
  const reserveCents = Math.min(Math.max(configuredReserveCents ?? 0, 0), Math.max(totalCents, 0));
  return {
    reserveCents,
    portfolioCents: Math.max(totalCents, 0) - reserveCents,
    exceedsTotal: configuredReserveCents !== null && configuredReserveCents > totalCents,
  };
}

/**
 * Realized monthly rate of the positions, from the oldest to the newest snapshot inside the window.
 * Snapshots are dated by the sync, so both ends use the same clock.
 * A new purchase appears as a new position, so its first value is the start and never counts as yield.
 * A position that lost value was redeemed and is left out, since a redemption is not a negative yield.
 */
export function calculateRealizedYield({ holdings, snapshots, asOfDate, windowDays = DEFAULT_WINDOW_DAYS }: RealizedYieldInput): RealizedYieldResult | null {
  const from = new Date((dayNumber(asOfDate) - windowDays) * DAY_MS).toISOString().slice(0, 10);
  let gainCents = 0;
  let weightedCentDays = 0;
  let periodDays = 0;
  for (const holding of holdings) {
    const window = snapshots
      .filter((snapshot) => snapshot.holdingId === holding.id && snapshot.snapshotDate >= from && snapshot.snapshotDate <= asOfDate)
      .sort((left, right) => left.snapshotDate.localeCompare(right.snapshotDate));
    const start = window[0];
    const end = window.at(-1);
    if (!start || !end || start === end || start.currentValueCents <= 0 || end.currentValueCents < start.currentValueCents) continue;
    const days = daysBetween(start.snapshotDate, end.snapshotDate);
    gainCents += end.currentValueCents - start.currentValueCents;
    weightedCentDays += start.currentValueCents * days;
    periodDays = Math.max(periodDays, days);
  }
  if (!weightedCentDays) return null;
  return { monthlyRateBps: Math.round((gainCents / weightedCentDays) * 30 * 10_000), periodDays };
}

/** Removes the reserve from the portfolio's class distribution, taking it from the most liquid classes first. */
export function deductReserveFromClasses(items: ClassAmount[], reserveCents: number): ClassAmount[] {
  let remaining = reserveCents;
  const byClass = new Map(items.map((item) => [item.assetClass, item.amountCents]));
  for (const assetClass of RESERVE_CLASS_ORDER) {
    const amountCents = byClass.get(assetClass);
    if (!amountCents || remaining <= 0) continue;
    const taken = Math.min(amountCents, remaining);
    byClass.set(assetClass, amountCents - taken);
    remaining -= taken;
  }
  return items.map((item) => ({ ...item, amountCents: byClass.get(item.assetClass) ?? 0 })).filter((item) => item.amountCents > 0);
}
