import type { ReserveDestinationRow } from "@/lib/interfaces/reserve-destination";

/** Days before the reserve was typed in which a contribution may still be missing from it: the bank can report a new position days after the movement. */
export const NEW_POSITION_LOOKBACK_DAYS = 7;

/**
 * Whether a classified share still sits on top of the reserve. A reserve amount typed on or after the day
 * of the classification is a new total that already includes it.
 */
export function isShareAbsorbed(row: Pick<ReserveDestinationRow, "reserveShareCents" | "reserveClassifiedOn">, configuredOn: string | null) {
  if (row.reserveShareCents === null) return false;
  return configuredOn !== null && (row.reserveClassifiedOn === null || row.reserveClassifiedOn < configuredOn);
}

/** The part of a contribution the reserve currently counts. */
export function effectiveReserveShare(row: ReserveDestinationRow | null, configuredOn: string | null) {
  if (!row || row.type !== "investment_contribution" || row.status !== "posted" || row.reserveShareCents === null) return 0;
  if (configuredOn === null || isShareAbsorbed(row, configuredOn)) return 0;
  return Math.min(Math.max(row.reserveShareCents, 0), row.amountCents);
}

/** The reserve never goes below zero when a contribution's share is taken back. */
export function reserveAfterShareChange(reserveCents: number, deltaCents: number) {
  return Math.max(reserveCents + deltaCents, 0);
}

/** A share kept after an edit: it follows a lower amount down, and disappears when the row is no longer a posted contribution. */
export function keptReserveShare(previousShareCents: number | null, row: Pick<ReserveDestinationRow, "type" | "status" | "amountCents">) {
  if (previousShareCents === null || row.type !== "investment_contribution" || row.status !== "posted") return null;
  return Math.min(previousShareCents, row.amountCents);
}

/**
 * Yield of the positions that already existed, without the contributions that grew them. Contributions that
 * opened new positions are covered by those positions' values and are not taken out.
 */
export function yieldWithoutContributions(yieldCents: number, contributionsCents: number, newPositionsCents: number) {
  return yieldCents - Math.max(contributionsCents - newPositionsCents, 0);
}
