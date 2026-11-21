import { daysBetween } from "@/lib/bank-reserve";

/** A bank position not updated for longer than this still counts in the total, so the person is asked about it. */
export const STALE_POSITION_DAYS = 30;

export function isStalePosition(holding: { externalAssetId: string | null; isArchived: boolean; currentValueCents: number; valueAsOf: string }, today: string) {
  return Boolean(holding.externalAssetId) && !holding.isArchived && holding.currentValueCents > 0 && daysBetween(holding.valueAsOf, today) > STALE_POSITION_DAYS;
}
