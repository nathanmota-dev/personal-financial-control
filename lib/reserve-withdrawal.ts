import type { InvestmentWithdrawalOrigin } from "@/lib/db/schema/types";
import type { ReserveWithdrawalSplit } from "@/lib/interfaces/reserve-withdrawal";

/**
 * Only an empty side tells where the money came from: with no reserve it left the portfolio,
 * with no portfolio it left the reserve. With money on both sides the person decides.
 */
export function classifyReserveWithdrawal({ reserveCents, portfolioCents }: ReserveWithdrawalSplit): InvestmentWithdrawalOrigin {
  if (reserveCents <= 0) return "portfolio";
  if (portfolioCents <= 0) return "reserve";
  return "pending";
}

/** A withdrawal larger than the reserve empties it; the reserve never goes below zero. */
export function reserveAfterWithdrawal(reserveCents: number, amountCents: number) {
  return Math.max(reserveCents - amountCents, 0);
}

/**
 * Yield of the positions that already existed, shared in proportion to what each side holds.
 * With everything in the reserve, all of it stays in the reserve.
 */
export function reserveYieldShare(yieldCents: number, reserveCents: number, totalCents: number) {
  if (yieldCents <= 0 || reserveCents <= 0 || totalCents <= 0) return 0;
  return Math.round((yieldCents * Math.min(reserveCents, totalCents)) / totalCents);
}
